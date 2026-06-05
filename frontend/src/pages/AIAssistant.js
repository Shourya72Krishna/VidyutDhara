import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Send, Zap, Calendar, Target, Sparkles, User, Construction } from 'lucide-react';
import { aiAPI, tasksAPI } from '../services/api';
import toast from 'react-hot-toast';

const APP_NAME = process.env.REACT_APP_NAME || 'विद्युत्धारा';

const SUGGESTIONS = [
  'What should I work on next?',
  'Which goals are falling behind?',
  'How can I improve my productivity?',
  'Create a study plan for this week',
  'What tasks are overdue?',
];

// ============================================================
// AI_UNAVAILABLE — set this to false when AI is live
const AI_UNAVAILABLE = false;
// ============================================================

function UnavailableBanner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 20px',
      background: 'repeating-linear-gradient(45deg, #1a1400, #1a1400 10px, #211900 10px, #211900 20px)',
      border: '1px solid var(--warning)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 20,
    }}>
      <Construction size={22} color="var(--warning)" style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--warning)', fontFamily: 'var(--font-display)' }}>
          AI Service Unavailable
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
          We're working on it — AI features will be back shortly. Sorry for the inconvenience!
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, boxShadow: '0 2px 8px rgba(250,189,47,0.25)' }}>
          <Bot size={16} color="#0a0b0f" />
        </div>
      )}
      <div style={{
        maxWidth: '78%', padding: '12px 16px',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isUser ? 'var(--gradient-accent)' : 'var(--bg-card)',
        color: isUser ? '#0a0b0f' : 'var(--text-primary)',
        border: isUser ? 'none' : '1px solid var(--border)',
        fontSize: '0.875rem', lineHeight: 1.65,
        boxShadow: isUser ? '0 2px 12px rgba(250,189,47,0.2)' : 'var(--shadow-sm)',
      }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
          <User size={16} color="var(--text-muted)" />
        </div>
      )}
    </div>
  );
}

function BreakdownTab() {
  const qc = useQueryClient();
  const [goal, setGoal] = useState('');
  const [result, setResult] = useState(null);
  const [creating, setCreating] = useState({});

  const breakMut = useMutation({
    mutationFn: () => aiAPI.breakdown(goal),
    onSuccess: (res) => setResult(res.data),
    onError: e => toast.error(e.response?.data?.error || 'AI unavailable'),
  });

  const createTask = async (task) => {
    setCreating(c => ({ ...c, [task.title]: true }));
    try {
      await tasksAPI.create({ title: task.title, description: task.description, priority: task.priority });
      qc.invalidateQueries(['tasks']);
      toast.success('Task created!');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setCreating(c => ({ ...c, [task.title]: false }));
    }
  };

  return (
    <div>
      {/* ── AI_UNAVAILABLE block start ── */}
      {AI_UNAVAILABLE && <UnavailableBanner />}
      {/* ── AI_UNAVAILABLE block end ── */}

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>AI Task Breakdown</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Describe a goal and AI will break it into actionable tasks</p>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          className="form-input"
          placeholder='e.g. "Learn machine learning in 3 months"'
          value={goal}
          onChange={e => setGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !AI_UNAVAILABLE && goal.trim() && breakMut.mutate()}
          disabled={AI_UNAVAILABLE}
          style={{ opacity: AI_UNAVAILABLE ? 0.45 : 1 }}
        />
        <button
          className="btn btn-primary"
          onClick={() => goal.trim() && breakMut.mutate()}
          disabled={AI_UNAVAILABLE || breakMut.isPending || !goal.trim()}
          style={{ opacity: AI_UNAVAILABLE ? 0.45 : 1 }}
        >
          {breakMut.isPending
            ? <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }} />
            : <Sparkles size={16} />}
          Break it down
        </button>
      </div>

      {breakMut.isPending && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>AI is breaking down your goal...</p>
        </div>
      )}

      {result?.tasks && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result.tasks.map((task, i) => (
            <div key={i} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{task.title}</span>
                    <span className={`badge badge-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                    {task.estimatedDays && (
                      <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>~{task.estimatedDays}d</span>
                    )}
                  </div>
                  {task.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>{task.description}</p>}
                  {task.subtasks?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {task.subtasks.map((st, j) => (
                        <span key={j} className="tag" style={{ fontSize: '0.73rem' }}>{st}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => createTask(task)} disabled={creating[task.title]}>
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanTab() {
  const [hours, setHours] = useState(4);
  const [result, setResult] = useState(null);

  const planMut = useMutation({
    mutationFn: () => aiAPI.plan({ availableHours: hours }),
    onSuccess: (res) => setResult(res.data),
    onError: e => toast.error(e.response?.data?.error || 'AI unavailable'),
  });

  return (
    <div>
      {/* ── AI_UNAVAILABLE block start ── */}
      {AI_UNAVAILABLE && <UnavailableBanner />}
      {/* ── AI_UNAVAILABLE block end ── */}

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>AI Daily Planner</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tell AI how much time you have and get an optimized work plan</p>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Available hours today</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2, 4, 6, 8].map(h => (
              <button key={h}
                onClick={() => !AI_UNAVAILABLE && setHours(h)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 'var(--radius-md)',
                  border: '1px solid', cursor: AI_UNAVAILABLE ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem', fontWeight: 600, transition: 'all var(--transition)',
                  background: hours === h ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  color: hours === h ? 'var(--accent)' : 'var(--text-secondary)',
                  borderColor: hours === h ? 'var(--accent)' : 'var(--border)',
                  opacity: AI_UNAVAILABLE ? 0.45 : 1,
                }}>
                {h}h
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => planMut.mutate()}
          disabled={AI_UNAVAILABLE || planMut.isPending}
          style={{ opacity: AI_UNAVAILABLE ? 0.45 : 1 }}
        >
          {planMut.isPending
            ? <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }} />
            : <Calendar size={16} />}
          Generate Plan
        </button>
      </div>

      {planMut.isPending && (
        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Building your personalized plan...</p>
        </div>
      )}

      {result && (
        <div>
          {result.focusArea && (
            <div className="card" style={{ marginBottom: 16, background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} color="var(--accent)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent)' }}>Today's Focus: </span>
                <span style={{ fontSize: '0.9rem' }}>{result.focusArea}</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {result.plan?.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', minWidth: 48, paddingTop: 2 }}>{item.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>{item.activity}</div>
                  {item.taskTitle && <div style={{ fontSize: '0.78rem', color: 'var(--info)', marginBottom: 3 }}>📌 {item.taskTitle}</div>}
                  {item.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.notes}</div>}
                </div>
                {item.duration && <span className="badge badge-accent">{item.duration}m</span>}
              </div>
            ))}
          </div>
          {result.tips?.length > 0 && (
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10, color: 'var(--text-secondary)' }}>💡 Tips for today</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                {result.tips.map((tip, i) => (
                  <li key={i} style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIAssistant() {
  const [tab, setTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm your ${APP_NAME} AI assistant. I have full context of your tasks, goals, and habits. Ask me anything — I can help you plan your day, prioritize tasks, or review your progress. 🚀` }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const chatMut = useMutation({
    mutationFn: (data) => aiAPI.assistant(data),
    onMutate: () => setTyping(true),
    onSuccess: (res) => {
      setMessages(m => [...m, { role: 'assistant', content: res.data.response }]);
      setTyping(false);
    },
    onError: (e) => {
      toast.error(e.response?.data?.error || 'AI unavailable');
      setTyping(false);
    },
  });

  const sendMessage = () => {
    if (AI_UNAVAILABLE || !input.trim() || chatMut.isPending) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    chatMut.mutate({
      message: input,
      history: newMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
    });
    setInput('');
  };

  const TABS = [
    { id: 'chat',      label: 'Assistant',     icon: Bot      },
    { id: 'breakdown', label: 'Task Breakdown', icon: Sparkles },
    { id: 'plan',      label: 'Day Planner',    icon: Calendar },
  ];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">Powered by GPT-4 · Context-aware productivity intelligence</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
          background: AI_UNAVAILABLE ? 'rgba(255,159,67,0.1)' : 'var(--accent-dim)',
          border: `1px solid ${AI_UNAVAILABLE ? 'rgba(255,159,67,0.3)' : 'var(--border-glow)'}`,
          borderRadius: 'var(--radius-full)',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: AI_UNAVAILABLE ? 'var(--warning)' : 'var(--success)' }} />
          <span style={{ fontSize: '0.78rem', color: AI_UNAVAILABLE ? 'var(--warning)' : 'var(--accent)', fontWeight: 600 }}>
            {AI_UNAVAILABLE ? 'AI Offline' : 'AI Online'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
              borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: tab === t.id ? 600 : 400,
              background: tab === t.id ? 'var(--bg-elevated)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all var(--transition)',
            }}>
            <t.icon size={15} color={tab === t.id ? 'var(--accent)' : undefined} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>

          {/* ── AI_UNAVAILABLE block start ── */}
          {AI_UNAVAILABLE && <UnavailableBanner />}
          {/* ── AI_UNAVAILABLE block end ── */}

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px' }}>
            {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
            {typing && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} color="#0a0b0f" />
                </div>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px 16px 16px 16px' }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && !AI_UNAVAILABLE && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="tag"
                  style={{ cursor: 'pointer', fontSize: '0.78rem', background: 'var(--bg-elevated)', transition: 'all var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <input
              className="form-input"
              placeholder={AI_UNAVAILABLE ? 'AI is currently unavailable...' : 'Ask me anything about your productivity...'}
              value={input}
              onChange={e => !AI_UNAVAILABLE && setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              disabled={AI_UNAVAILABLE}
              style={{ flex: 1, opacity: AI_UNAVAILABLE ? 0.5 : 1, cursor: AI_UNAVAILABLE ? 'not-allowed' : 'text' }}
            />
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={AI_UNAVAILABLE || chatMut.isPending || !input.trim()}
              style={{ flexShrink: 0, opacity: AI_UNAVAILABLE ? 0.5 : 1 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {tab === 'breakdown' && <div className="card"><BreakdownTab /></div>}
      {tab === 'plan'      && <div className="card"><PlanTab /></div>}
    </div>
  );
}