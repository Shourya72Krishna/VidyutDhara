import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Zap, Trash2, Edit2, X, Flame, CheckCircle, Calendar, Award } from 'lucide-react';
import { habitsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format, subDays, isSameDay } from 'date-fns';

const FREQ_COLORS = { DAILY: 'var(--accent)', WEEKLY: 'var(--info)', MONTHLY: 'var(--success)' };
const HABIT_ICONS = ['⚡', '🏃', '📚', '💧', '🧘', '💪', '🥗', '😴', '✍️', '🎯', '🧠', '❤️', '🎸', '🌿', '🔥'];

function HabitModal({ habit, onClose, onSave }) {
  const [form, setForm] = useState(habit || { title: '', description: '', frequency: 'DAILY', targetCount: 1, color: '#fabd2f', icon: '⚡' });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade">
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{habit ? 'Edit Habit' : 'New Habit'}</h2>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Habit Name *</label>
            <input className="form-input" placeholder="e.g. Morning meditation" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              {HABIT_ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                  style={{ width: 36, height: 36, borderRadius: 8, background: form.icon === icon ? 'var(--accent-dim)' : 'transparent', border: form.icon === icon ? '1px solid var(--accent)' : '1px solid transparent', fontSize: '1.1rem', cursor: 'pointer', transition: 'all var(--transition)' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" placeholder="Why this habit matters..." value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select className="form-input" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Count</label>
              <input type="number" className="form-input" min={1} max={99} value={form.targetCount}
                onChange={e => setForm(f => ({ ...f, targetCount: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.title.trim()}>
              {habit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitHeatmap({ logs }) {
  const days = Array.from({ length: 28 }, (_, i) => subDays(new Date(), 27 - i));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(28, 1fr)', gap: 3, marginTop: 8 }}>
      {days.map(day => {
        const completed = logs.some(l => isSameDay(new Date(l.completedAt), day));
        return (
          <div key={day.toISOString()} title={format(day, 'MMM d')}
            style={{ height: 10, borderRadius: 2, background: completed ? 'var(--accent)' : 'var(--bg-elevated)', transition: 'opacity var(--transition)', opacity: completed ? 1 : 0.5 }} />
        );
      })}
    </div>
  );
}

function HabitCard({ habit, onEdit, onDelete, onLog }) {
  const todayLogged = habit.logs?.some(l => isSameDay(new Date(l.completedAt), new Date()));

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: todayLogged ? 'var(--accent-dim)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: todayLogged ? '1px solid var(--accent)' : '1px solid transparent', transition: 'all var(--transition)' }}>
            {habit.icon || '⚡'}
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 2 }}>{habit.title}</h3>
            <span className="badge" style={{ background: `${FREQ_COLORS[habit.frequency]}18`, color: FREQ_COLORS[habit.frequency], fontSize: '0.7rem' }}>
              {habit.frequency}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-ghost btn-icon btn-sm" onClick={() => onEdit(habit)}><Edit2 size={13} /></button>
          <button className="btn-ghost btn-icon btn-sm" onClick={() => onDelete(habit.id)} style={{ color: 'var(--danger)' }}><Trash2 size={13} /></button>
        </div>
      </div>

      {habit.description && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{habit.description}</p>
      )}

      {/* Streak & stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flame size={16} color="var(--warning)" />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{habit.currentStreak}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Streak</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={16} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{habit.longestStreak}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best</div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <HabitHeatmap logs={habit.logs || []} />

      {/* Log button */}
      <button
        onClick={() => !todayLogged && onLog(habit.id)}
        className={todayLogged ? 'btn' : 'btn btn-primary'}
        style={{
          width: '100%', justifyContent: 'center', marginTop: 14,
          background: todayLogged ? 'var(--success-dim)' : undefined,
          color: todayLogged ? 'var(--success)' : undefined,
          border: todayLogged ? '1px solid rgba(163,230,53,0.3)' : undefined,
          cursor: todayLogged ? 'default' : 'pointer',
        }}
        disabled={todayLogged}
      >
        {todayLogged ? <><CheckCircle size={16} /> Completed today</> : <><Zap size={16} /> Mark Complete</>}
      </button>
    </div>
  );
}

export default function Habits() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsAPI.getAll().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: habitsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['habits']); toast.success('Habit created!'); setModal(null); },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => habitsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['habits']); toast.success('Habit updated!'); setModal(null); },
  });
  const deleteMut = useMutation({
    mutationFn: habitsAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['habits']); toast.success('Habit deleted'); },
  });
  const logMut = useMutation({
    mutationFn: id => habitsAPI.log(id, {}),
    onSuccess: () => { qc.invalidateQueries(['habits']); toast.success('Habit logged! 🔥'); },
  });

  const handleSave = (form) => {
    if (modal?.id) updateMut.mutate({ id: modal.id, data: form });
    else createMut.mutate(form);
  };

  const habits = data?.habits || [];
  const todayCount = habits.filter(h => h.logs?.some(l => isSameDay(new Date(l.completedAt), new Date()))).length;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Habits</h1>
          <p className="page-subtitle">{todayCount}/{habits.length} completed today · Build consistent routines</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={16} /> New Habit</button>
      </div>

      {/* Today progress bar */}
      {habits.length > 0 && (
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={18} color="var(--warning)" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Today's Progress</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: todayCount === habits.length ? 'var(--success)' : 'var(--text-secondary)' }}>
              {todayCount}/{habits.length} {todayCount === habits.length ? '🎉 All done!' : ''}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${habits.length > 0 ? (todayCount / habits.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid-3">{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />)}</div>
      ) : habits.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon"><Zap size={28} /></div>
          <div><p style={{ fontWeight: 600, marginBottom: 4 }}>No habits yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Start building powerful daily routines</p></div>
          <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> Create Habit</button>
        </div></div>
      ) : (
        <div className="grid-3">
          {habits.map(h => (
            <HabitCard key={h.id} habit={h} onEdit={h => setModal(h)} onDelete={id => deleteMut.mutate(id)} onLog={id => logMut.mutate(id)} />
          ))}
        </div>
      )}

      {modal !== null && <HabitModal habit={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
