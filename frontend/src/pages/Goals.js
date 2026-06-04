import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Trash2, Edit2, X, CheckCircle, Clock, PauseCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { goalsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CATEGORIES = ['Personal', 'Work', 'Health', 'Finance', 'Learning', 'Relationships', 'Other'];
const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: 'var(--info)', icon: TrendingUp },
  COMPLETED: { label: 'Completed', color: 'var(--success)', icon: CheckCircle },
  PAUSED: { label: 'Paused', color: 'var(--warning)', icon: PauseCircle },
  ABANDONED: { label: 'Abandoned', color: 'var(--danger)', icon: X },
};

function GoalModal({ goal, onClose, onSave }) {
  const [form, setForm] = useState(goal || { title: '', description: '', category: '', targetDate: '', progress: 0, status: 'ACTIVE' });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade">
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{goal ? 'Edit Goal' : 'New Goal'}</h2>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input className="form-input" placeholder="What do you want to achieve?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="Why is this goal important?" value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Date</label>
              <input type="date" className="form-input" value={form.targetDate ? form.targetDate.slice(0, 10) : ''}
                onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
            </div>
          </div>
          {goal && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Progress ({form.progress}%)</label>
                <input type="range" min={0} max={100} value={form.progress}
                  onChange={e => setForm(f => ({ ...f, progress: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: 'var(--accent)', marginTop: 8 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.title.trim()}>
              {goal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete }) {
  const sc = STATUS_CONFIG[goal.status] || STATUS_CONFIG.ACTIVE;
  const Icon = sc.icon;

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Glow accent line at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: sc.color, opacity: 0.7, borderRadius: '16px 16px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${sc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} color={sc.color} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 2 }}>{goal.title}</h3>
            {goal.category && <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>{goal.category}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn-ghost btn-icon btn-sm" onClick={() => onEdit(goal)}><Edit2 size={14} /></button>
          <button className="btn-ghost btn-icon btn-sm" onClick={() => onDelete(goal.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      </div>

      {goal.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>{goal.description}</p>
      )}

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Progress</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: sc.color }}>{goal.progress}%</span>
        </div>
        <div className="progress-bar" style={{ height: 8 }}>
          <div className="progress-fill" style={{ width: `${goal.progress}%`, background: sc.color }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Clock size={12} />
          {goal.targetDate ? `Due ${format(new Date(goal.targetDate), 'MMM d, yyyy')}` : 'No deadline'}
        </div>
        {goal.tasks?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <ChevronRight size={13} />
            {goal.tasks.filter(t => t.status === 'DONE').length}/{goal.tasks.length} tasks
          </div>
        )}
      </div>
    </div>
  );
}

export default function Goals() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['goals', filterStatus],
    queryFn: () => goalsAPI.getAll({ status: filterStatus || undefined }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: goalsAPI.create,
    onSuccess: () => { qc.invalidateQueries(['goals']); toast.success('Goal created!'); setModal(null); },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => goalsAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['goals']); toast.success('Goal updated!'); setModal(null); },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });
  const deleteMut = useMutation({
    mutationFn: goalsAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['goals']); toast.success('Goal deleted'); },
  });

  const handleSave = (form) => {
    if (modal?.id) updateMut.mutate({ id: modal.id, data: form });
    else createMut.mutate(form);
  };

  const goals = data?.goals || [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals</h1>
          <p className="page-subtitle">{goals.length} goal{goals.length !== 1 ? 's' : ''} · Track your long-term ambitions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={16} /> New Goal</button>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[{ label: 'All', value: '' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))].map(f => (
          <button key={f.value} onClick={() => setFilterStatus(f.value)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none',
              fontSize: '0.85rem', fontWeight: filterStatus === f.value ? 600 : 400,
              color: filterStatus === f.value ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: filterStatus === f.value ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'all var(--transition)', cursor: 'pointer',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon"><Target size={28} /></div>
          <div><p style={{ fontWeight: 600, marginBottom: 4 }}>No goals yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Set your first goal and start tracking progress</p></div>
          <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> Create Goal</button>
        </div></div>
      ) : (
        <div className="grid-3">
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onEdit={g => setModal(g)} onDelete={id => deleteMut.mutate(id)} />
          ))}
        </div>
      )}

      {modal !== null && <GoalModal goal={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
