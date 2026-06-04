import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Shield, Clock, Monitor, Smartphone, Globe, Edit2, Save, X, LogOut } from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuthStore } from '../context/AuthStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Profile() {
  const { user, setUser, logout } = useAuthStore();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });

  const { data: sessionsData } = useQuery({ queryKey: ['user-sessions'], queryFn: () => usersAPI.sessions().then(r => r.data) });

  const updateMut = useMutation({
    mutationFn: usersAPI.updateMe,
    onSuccess: (res) => {
      setUser(res.data.user);
      qc.invalidateQueries(['me']);
      toast.success('Profile updated!');
      setEditing(false);
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed to update'),
  });

  const roleColors = { SUPER_ADMIN: 'var(--accent)', ADMIN: 'var(--info)', USER: 'var(--success)' };
  const roleLabels = { SUPER_ADMIN: '👑 Super Admin', ADMIN: '🛡️ Admin', USER: '✅ User' };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Profile card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--gradient-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-inverse)',
                margin: '0 auto', boxShadow: '0 4px 20px rgba(250,189,47,0.25)',
                backgroundSize: 'cover', backgroundPosition: 'center',
              }}>
                {!user?.avatar && user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-card)' }} />
            </div>

            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Avatar URL</label>
                  <input className="form-input" placeholder="https://..." value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateMut.mutate(form)} disabled={updateMut.isPending}>
                    <Save size={14} /> Save
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}><X size={14} /></button>
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>{user?.name}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>{user?.email}</p>
                <span style={{ display: 'inline-block', padding: '4px 14px', background: `${roleColors[user?.role]}18`, color: roleColors[user?.role], borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, marginBottom: 16 }}>
                  {roleLabels[user?.role]}
                </span>
                <button className="btn btn-secondary btn-sm w-full" style={{ justifyContent: 'center' }} onClick={() => setEditing(true)}>
                  <Edit2 size={14} /> Edit Profile
                </button>
              </>
            )}
          </div>

          {/* Account info */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Account Info</h3>
            {[
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Shield, label: 'Role', value: user?.role?.replace('_', ' ') },
              { icon: Clock, label: 'Joined', value: user?.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—' },
              { icon: Clock, label: 'Last login', value: user?.lastLogin ? format(new Date(user.lastLogin), 'MMM d, h:mm a') : '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <item.icon size={16} color="var(--text-muted)" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                  <div style={{ fontSize: '0.85rem', marginTop: 1 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-danger w-full" style={{ justifyContent: 'center' }} onClick={logout}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Sessions */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Login History</h3>
          {sessionsData?.sessions?.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px' }}>
              <Monitor size={24} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem' }}>No session history</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessionsData?.sessions?.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: s.isActive ? '1px solid rgba(163,230,53,0.2)' : '1px solid transparent' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.deviceType === 'mobile' ? <Smartphone size={18} color="var(--text-muted)" /> : <Monitor size={18} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{s.browser || 'Unknown'} on {s.os || 'Unknown'}</span>
                      {s.isActive && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={11} /> {s.ipAddress || 'Unknown IP'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {format(new Date(s.loginTime), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
