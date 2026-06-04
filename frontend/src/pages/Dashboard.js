import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Target, Zap, FileText, Timer, Bot,
  Plus, ArrowRight, Flame,
} from 'lucide-react';
import { analyticsAPI, tasksAPI, habitsAPI, goalsAPI, focusAPI } from '../services/api';
import api from '../services/api';
import { useAuthStore } from '../context/AuthStore';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#fabd2f', '#a3e635', '#74b9ff', '#ff9f43'];

export default function Dashboard() {
  const { user } = useAuthStore();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: () => analyticsAPI.overview().then(r => r.data) });
  const { data: tasksData } = useQuery({ queryKey: ['tasks-dash'], queryFn: () => tasksAPI.getAll({ limit: 5, status: 'TODO', sort: 'dueDate' }).then(r => r.data) });
  const { data: habitsData } = useQuery({ queryKey: ['habits-dash'], queryFn: () => habitsAPI.getAll().then(r => r.data) });
  const { data: goalsData } = useQuery({ queryKey: ['goals-dash'], queryFn: () => goalsAPI.getAll({ status: 'ACTIVE' }).then(r => r.data) });
  const { data: focusStats } = useQuery({ queryKey: ['focus-stats'], queryFn: () => focusAPI.stats().then(r => r.data) });

  const { data: activityLogsData } = useQuery({
    queryKey: ['activity-chart'],
    queryFn: () => api.get('/activity', { params: { limit: 200 } }).then(r => r.data),
  });

  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, 'yyyy-MM-dd');
    const count = activityLogsData?.logs?.filter(log =>
      format(new Date(log.createdAt), 'yyyy-MM-dd') === dayStr &&
      log.action.includes('CREATED')
    ).length || 0;
    return { day: format(d, 'EEE'), tasks: count };
  });

  const stats = [
    {
      label: 'Tasks', value: analytics?.tasks?.total || 0, sub: `${analytics?.tasks?.completed || 0} done`,
      icon: CheckSquare, color: '#fabd2f', bg: 'rgba(250,189,47,0.1)', link: '/tasks'
    },
    {
      label: 'Goals', value: analytics?.goals?.total || 0, sub: 'active',
      icon: Target, color: '#74b9ff', bg: 'rgba(116,185,255,0.1)', link: '/goals'
    },
    {
      label: 'Habits', value: analytics?.habits?.total || 0, sub: 'tracked',
      icon: Zap, color: '#a3e635', bg: 'rgba(163,230,53,0.1)', link: '/habits'
    },
    {
      label: 'Focus', value: Math.round((focusStats?.totalMinutes || 0) / 60) + 'h', sub: `${focusStats?.totalSessions || 0} sessions`,
      icon: Timer, color: '#ff9f43', bg: 'rgba(255,159,67,0.1)', link: '/focus'
    },
  ];

  const completionRate = analytics?.tasks?.completionRate || 0;

  const pieData = [
    { name: 'Done', value: analytics?.tasks?.completed || 0 },
    { name: 'Pending', value: (analytics?.tasks?.total || 0) - (analytics?.tasks?.completed || 0) },
  ];

  const getDueLabel = (dueDate) => {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    if (isPast(d) && !isToday(d)) return { label: 'Overdue', color: 'var(--danger)' };
    if (isToday(d)) return { label: 'Today', color: 'var(--warning)' };
    if (isTomorrow(d)) return { label: 'Tomorrow', color: 'var(--info)' };
    return { label: format(d, 'MMM d'), color: 'var(--text-muted)' };
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 800, marginBottom: 4 }}>
              {greeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {format(new Date(), 'EEEE, MMMM d')} · Here's your productivity overview
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/ai" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bot size={15} /> AI Plan
            </Link>
            <Link to="/tasks" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> New Task
            </Link>
          </div>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-icon" style={{ background: s.bg }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <ArrowRight size={16} color="var(--text-muted)" />
              </div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>Weekly Activity</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Items created over last 7 days</p>
            </div>
            <div style={{ padding: '6px 12px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
              This Week
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={activityData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fabd2f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fabd2f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-primary)' }}
                itemStyle={{ color: 'var(--accent)' }}
              />
              <Area type="monotone" dataKey="tasks" name="Actions" stroke="#fabd2f" strokeWidth={2} fill="url(#taskGrad)" dot={{ fill: '#fabd2f', strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Completion</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>Overall task rate</p>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.some(d => d.value > 0) ? pieData : [{ name: 'Empty', value: 1 }]}
                    cx="50%" cy="50%" innerRadius={38} outerRadius={55}
                    startAngle={90} endAngle={-270} paddingAngle={2} dataKey="value"
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} strokeWidth={0} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>{completionRate}%</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Done</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fabd2f' }} />
                <span style={{ color: 'var(--text-muted)' }}>Done</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a3e635' }} />
                <span style={{ color: 'var(--text-muted)' }}>Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>Upcoming Tasks</h3>
            <Link to="/tasks" style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {tasksData?.tasks?.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <CheckSquare size={28} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>No pending tasks</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tasksData?.tasks?.slice(0, 5).map(task => {
                const due = getDueLabel(task.dueDate);
                return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: task.priority === 'URGENT' ? 'var(--danger)' : task.priority === 'HIGH' ? 'var(--warning)' : task.priority === 'MEDIUM' ? 'var(--success)' : 'var(--info)' }} />
                    <span style={{ flex: 1, fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    {due && <span style={{ fontSize: '0.7rem', color: due.color, flexShrink: 0 }}>{due.label}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>Habit Streaks</h3>
            <Link to="/habits" style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {habitsData?.habits?.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <Flame size={28} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>No habits yet</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {habitsData?.habits?.slice(0, 5).map(h => (
                <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1rem' }}>{h.icon || '⚡'}</div>
                  <span style={{ flex: 1, fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Flame size={13} color="var(--warning)" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--warning)' }}>{h.currentStreak}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>Active Goals</h3>
            <Link to="/goals" style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={13} />
            </Link>
          </div>
          {goalsData?.goals?.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <Target size={28} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>No active goals</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {goalsData?.goals?.slice(0, 4).map(g => (
                <div key={g.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.83rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{g.title}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{g.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${g.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'New Task', icon: CheckSquare, to: '/tasks', color: 'var(--accent)' },
            { label: 'New Goal', icon: Target, to: '/goals', color: 'var(--info)' },
            { label: 'Track Habit', icon: Zap, to: '/habits', color: 'var(--success)' },
            { label: 'Write Note', icon: FileText, to: '/notes', color: 'var(--warning)' },
            { label: 'Start Focus', icon: Timer, to: '/focus', color: '#c084fc' },
            { label: 'Ask AI', icon: Bot, to: '/ai', color: 'var(--accent)' },
          ].map(a => (
            <Link key={a.label} to={a.to} style={{ textDecoration: 'none' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 500, transition: 'all var(--transition)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <a.icon size={16} color={a.color} />
                {a.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}