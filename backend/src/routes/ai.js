const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/auth');
const { OpenAI } = require('openai');
console.log("OPENAI KEY:", process.env.OPENAI_API_KEY);

router.use(protect);

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI API key not configured.');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const saveInteraction = async (userId, feature, prompt, response, tokens) => {
  try {
    await prisma.aIInteraction.create({ data: { userId, feature, prompt, response: JSON.stringify(response), tokens } });
  } catch {}
};

// POST /api/ai/breakdown - break a goal into tasks
router.post('/breakdown', async (req, res, next) => {
  try {
    const openai = getOpenAI();
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ error: 'Goal text required.' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a productivity expert. Break down goals into actionable tasks. Return JSON only: {"tasks": [{"title": string, "description": string, "priority": "LOW|MEDIUM|HIGH|URGENT", "estimatedDays": number, "subtasks": [string]}]}'
        },
        { role: 'user', content: `Break down this goal into specific, actionable tasks: "${goal}"` }
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;
    const data = JSON.parse(text.replace(/```json|```/g, '').trim());

    await saveInteraction(req.user.id, 'BREAKDOWN', goal, data, completion.usage?.total_tokens);
    res.json(data);
  } catch (err) {
    if (err.message?.includes('API key')) return res.status(503).json({ error: 'AI service not configured.' });
    next(err);
  }
});

// POST /api/ai/plan - generate a daily plan
router.post('/plan', async (req, res, next) => {
  try {
    const openai = getOpenAI();
    const { availableHours, preferences } = req.body;

    // Fetch user's pending tasks
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id, status: { in: ['TODO', 'IN_PROGRESS'] }, isArchived: false },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 20,
    });

    const goals = await prisma.goal.findMany({
      where: { userId: req.user.id, status: 'ACTIVE' },
      take: 5,
    });

    const context = `
Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, priority: t.priority, dueDate: t.dueDate })))}
Goals: ${JSON.stringify(goals.map(g => ({ title: g.title, progress: g.progress })))}
Available hours: ${availableHours || 4}
Preferences: ${preferences || 'none'}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a productivity coach. Create an optimized daily plan. Return JSON: {"plan": [{"time": string, "activity": string, "taskTitle": string, "duration": number, "notes": string}], "tips": [string], "focusArea": string}'
        },
        { role: 'user', content: `Create my daily plan based on: ${context}` }
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;
    const data = JSON.parse(text.replace(/```json|```/g, '').trim());

    await saveInteraction(req.user.id, 'PLAN', context, data, completion.usage?.total_tokens);
    res.json(data);
  } catch (err) {
    if (err.message?.includes('API key')) return res.status(503).json({ error: 'AI service not configured.' });
    next(err);
  }
});

// POST /api/ai/assistant - chat with AI productivity assistant
router.post('/assistant', async (req, res, next) => {
  try {
    const openai = getOpenAI();
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required.' });

    // Fetch user context
    const [tasks, goals, habits] = await Promise.all([
      prisma.task.findMany({ where: { userId: req.user.id, status: { not: 'DONE' }, isArchived: false }, take: 10, orderBy: { priority: 'desc' } }),
      prisma.goal.findMany({ where: { userId: req.user.id, status: 'ACTIVE' }, take: 5 }),
      prisma.habit.findMany({ where: { userId: req.user.id, isActive: true }, take: 5 }),
    ]);

    const systemPrompt = `You are VidyutDhar AI, a personal productivity assistant. 
User context:
- Pending tasks (${tasks.length}): ${tasks.slice(0, 5).map(t => t.title).join(', ')}
- Active goals: ${goals.map(g => `${g.title} (${g.progress}%)`).join(', ')}
- Habits: ${habits.map(h => h.title).join(', ')}
Be concise, specific, and actionable. Use emojis sparingly.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-6),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 600,
    });

    const response = completion.choices[0].message.content;
    await saveInteraction(req.user.id, 'ASSISTANT', message, response, completion.usage?.total_tokens);
    res.json({ response });
  } catch (err) {
    if (err.message?.includes('API key')) return res.status(503).json({ error: 'AI service not configured.' });
    next(err);
  }
});

module.exports = router;
