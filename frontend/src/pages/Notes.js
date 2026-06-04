import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Trash2, Pin, PinOff, Search, Archive, X, Tag, Clock } from 'lucide-react';
import { notesAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function NoteEditor({ note, onClose, onSave }) {
  const [form, setForm] = useState(note || { title: '', content: '', tags: [], isPinned: false });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-save
  useEffect(() => {
    if (!note?.id) return;
    const timer = setTimeout(() => {
      if (form.title || form.content) {
        setSaving(true);
        onSave(form, true).finally(() => setTimeout(() => setSaving(false), 600));
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [form.title, form.content]);

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade" style={{ maxWidth: 700, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <input
            className="form-input"
            style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', border: 'none', background: 'transparent', padding: 0, flex: 1 }}
            placeholder="Note title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {saving && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Saving...</span>}
            <button className="btn-ghost btn-icon" title={form.isPinned ? 'Unpin' : 'Pin'}
              onClick={() => setForm(f => ({ ...f, isPinned: !f.isPinned }))}>
              {form.isPinned ? <PinOff size={16} color="var(--accent)" /> : <Pin size={16} />}
            </button>
            <button className="btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Content */}
        <textarea
          style={{
            flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)', fontSize: '0.9rem', lineHeight: 1.7,
            resize: 'none', outline: 'none', padding: 0,
          }}
          placeholder="Start writing..."
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        />

        {/* Footer */}
        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input className="form-input" style={{ fontSize: '0.82rem', height: 34 }} placeholder="Add tag..."
              value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
            <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
          </div>
          {form.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {form.tags.map(t => (
                <span key={t} className="tag" style={{ cursor: 'pointer' }}
                  onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}>
                  <Tag size={10} /> {t} ×
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.title.trim() && !form.content.trim()}>
              {note?.id ? 'Save' : 'Create Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onPin }) {
  const preview = note.content?.slice(0, 120) + (note.content?.length > 120 ? '...' : '');
  const colors = ['#fabd2f', '#74b9ff', '#a3e635', '#ff9f43', '#c084fc'];
  const color = colors[note.title.charCodeAt(0) % colors.length];

  return (
    <div className="card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      onClick={() => onEdit(note)}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '50'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, opacity: 0.5, borderRadius: '16px 16px 0 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {note.title || 'Untitled'}
        </h3>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }} onClick={e => e.stopPropagation()}>
          <button className="btn-ghost btn-icon btn-sm" title={note.isPinned ? 'Unpin' : 'Pin'}
            onClick={() => onPin(note)}>
            {note.isPinned ? <Pin size={13} color="var(--accent)" /> : <Pin size={13} />}
          </button>
          <button className="btn-ghost btn-icon btn-sm" onClick={() => onDelete(note.id)} style={{ color: 'var(--danger)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {preview && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 14, minHeight: 40 }}>{preview}</p>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {note.tags?.slice(0, 3).map(t => (
            <span key={t} className="tag" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          <Clock size={11} /> {format(new Date(note.updatedAt), 'MMM d')}
        </div>
      </div>
    </div>
  );
}

export default function Notes() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['notes', search, filterTag],
    queryFn: () => notesAPI.getAll({ search: search || undefined, tag: filterTag || undefined }).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: notesAPI.create,
    onSuccess: (res) => { qc.invalidateQueries(['notes']); setModal(res.data.note); toast.success('Note created!'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => notesAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries(['notes']),
  });
  const deleteMut = useMutation({
    mutationFn: notesAPI.delete,
    onSuccess: () => { qc.invalidateQueries(['notes']); toast.success('Note deleted'); },
  });

  const handleSave = async (form, silent = false) => {
    if (modal?.id) {
      await updateMut.mutateAsync({ id: modal.id, data: form });
      if (!silent) { toast.success('Saved'); setModal(null); }
    } else {
      await createMut.mutateAsync(form);
      if (!silent) setModal(null);
    }
  };

  const handlePin = (note) => {
    updateMut.mutate({ id: note.id, data: { isPinned: !note.isPinned } });
  };

  const notes = data?.notes || [];
  const pinned = notes.filter(n => n.isPinned);
  const regular = notes.filter(n => !n.isPinned);

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notes</h1>
          <p className="page-subtitle">{notes.length} note{notes.length !== 1 ? 's' : ''} · Capture your thoughts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={16} /> New Note</button>
      </div>

      {/* Search & filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search notes..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Filter:</span>
            {allTags.map(t => (
              <button key={t} onClick={() => setFilterTag(filterTag === t ? '' : t)}
                className="tag" style={{ cursor: 'pointer', background: filterTag === t ? 'var(--accent-dim)' : undefined, borderColor: filterTag === t ? 'var(--accent)' : undefined, color: filterTag === t ? 'var(--accent)' : undefined }}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid-3">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}</div>
      ) : notes.length === 0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon"><FileText size={28} /></div>
          <div><p style={{ fontWeight: 600, marginBottom: 4 }}>No notes yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Capture your ideas, thoughts, and reminders</p></div>
          <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={15} /> New Note</button>
        </div></div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Pin size={14} color="var(--accent)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pinned</span>
              </div>
              <div className="grid-3">
                {pinned.map(n => <NoteCard key={n.id} note={n} onEdit={n => setModal(n)} onDelete={id => deleteMut.mutate(id)} onPin={handlePin} />)}
              </div>
            </div>
          )}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Notes</span>
                </div>
              )}
              <div className="grid-3">
                {regular.map(n => <NoteCard key={n.id} note={n} onEdit={n => setModal(n)} onDelete={id => deleteMut.mutate(id)} onPin={handlePin} />)}
              </div>
            </div>
          )}
        </>
      )}

      {modal !== null && <NoteEditor note={modal?.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
