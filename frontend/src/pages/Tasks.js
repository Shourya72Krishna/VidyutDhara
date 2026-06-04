import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Filter, Search, CheckSquare, Clock, Tag, Trash2,
  Archive, ArchiveRestore, ChevronDown, Circle, CheckCircle2,
  AlertCircle, Loader, MoreHorizontal, Edit2, X, Calendar
} from 'lucide-react';
import { tasksAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format, isPast, isToday } from 'date-fns';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

const priorityColors = {
  LOW: 'var(--priority-low)',
  MEDIUM: 'var(--priority-medium)',
  HIGH: 'var(--priority-high)',
  URGENT: 'var(--priority-urgent)',
};

const statusIcons = {
  TODO: <Circle size={16} color="var(--text-muted)" />,
  IN_PROGRESS: <Loader size={16} color="var(--info)" />,
  DONE: <CheckCircle2 size={16} color="var(--success)" />,
};

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState(task || { title: '', description: '', priority: 'MEDIUM', status: 'TODO', category: '', tags: [], dueDate: '' });
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade">
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>{task ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="What needs to be done?" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" placeholder="Add details..." value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" placeholder="e.g. Work, Personal" value={form.category || ''}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate ? form.dueDate.slice(0, 10) : ''}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" placeholder="Add tag and press Enter" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
              <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {form.tags.map(t => (
                  <span key={t} className="tag" style={{ cursor: 'pointer' }}
                    onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}>
                    {t} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.title.trim()}>
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onArchive, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = due && isPast(due) && !isToday(due) && task.status !== 'DONE';

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
      transition: 'all var(--transition)', position: 'relative',
      borderLeft: `3px solid ${priorityColors[task.priority]}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderLeftColor = priorityColors[task.priority]; }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Status toggle */}
        <button
          onClick={() => onStatusChange(task, task.status === 'DONE' ? 'TODO' : 'DONE')}
          style={{ background: 'none', marginTop: 1, flexShrink: 0, transition: 'transform var(--transition)' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {statusIcons[task.status]}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: '0.9rem', fontWeight: 500,
              textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
              color: task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {task.title}
            </span>
          </div>

          {task.description && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.description}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span className={`badge badge-${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>

            {task.category && (
              <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {task.category}
              </span>
            )}

            {due && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.73rem', color: isOverdue ? 'var(--danger)' : isToday(due) ? 'var(--warning)' : 'var(--text-muted)' }}>
                <Calendar size={11} />
                {isOverdue ? 'Overdue · ' : isToday(due) ? 'Today · ' : ''}
                {format(due, 'MMM d')}
              </span>
            )}

            {task.subtasks?.length > 0 && (
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <CheckSquare size={11} />
                {task.subtasks.filter(s => s.status === 'DONE').length}/{task.subtasks.length}
              </span>
            )}

            {task.tags?.map(t => (
              <span key={t} className="tag" style={{ fontSize: '0.7rem', padding: '1px 7px' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button className="btn-ghost btn-icon btn-sm" onClick={() => setMenuOpen(!menuOpen)}>
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', overflow: 'hidden',
              boxShadow: 'var(--shadow-md)', minWidth: 150,
            }} onMouseLeave={() => setMenuOpen(false)}>
              {[
                { label: 'Edit', icon: Edit2, action: () => { onEdit(task); setMenuOpen(false); } },
                { label: task.isArchived ? 'Restore' : 'Archive', icon: task.isArchived ? ArchiveRestore : Archive, action: () => { onArchive(task.id); setMenuOpen(false); } },
                { label: 'Delete', icon: Trash2, action: () => { onDelete(task.id); setMenuOpen(false); }, danger: true },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'none', color: item.danger ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '0.85rem', transition: 'background var(--transition)', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <item.icon size={14} /> {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'create' | task object
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', archived: false });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksAPI.getAll({ ...filters, archived: filters.archived }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['analytics']); toast.success('Task created!'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create task'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['analytics']); toast.success('Task updated!'); setModal(null); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to update'),
  });

  const deleteMut = useMutation({
    mutationFn: tasksAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['tasks']); qc.invalidateQueries(['analytics']); toast.success('Task deleted'); },
  });

  const archiveMut = useMutation({
    mutationFn: tasksAPI.archive,
    onSuccess: () => { qc.invalidateQueries(['tasks']); toast.success('Done!'); },
  });

  const handleSave = (form) => {
    if (modal && modal.id) {
      updateMut.mutate({ id: modal.id, data: form });
    } else {
      createMut.mutate(form);
    }
  };

  const handleStatusChange = (task, status) => {
    updateMut.mutate({ id: task.id, data: { status } });
  };

  const tasks = data?.tasks || [];
  const total = data?.total || 0;

  const filterBadge = [filters.status, filters.priority, filters.search].filter(Boolean).length;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{total} task{total !== 1 ? 's' : ''} · {tasks.filter(t => t.status === 'DONE').length} completed</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)} style={{ position: 'relative' }}>
            <Filter size={15} /> Filters
            {filterBadge > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: 'var(--text-inverse)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {filterBadge}
              </span>
            )}
          </button>
          <button className="btn btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="card animate-fade" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label className="form-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search tasks..."
                  value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
              </div>
            </div>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label className="form-label">Status</label>
              <select className="form-input" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option value="">All</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 140px' }}>
              <label className="form-label">Priority</label>
              <select className="form-input" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
                <option value="">All</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={filters.archived} onChange={e => setFilters(f => ({ ...f, archived: e.target.checked }))}
                  style={{ accentColor: 'var(--accent)' }} />
                Show archived
              </label>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', search: '', archived: false })}>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 82, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><CheckSquare size={28} /></div>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>No tasks found</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Create your first task to get started</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModal({})}>
              <Plus size={15} /> Create Task
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={t => setModal(t)}
              onDelete={id => deleteMut.mutate(id)}
              onArchive={id => archiveMut.mutate(id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {(modal !== null) && (
        <TaskModal
          task={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
