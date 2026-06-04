import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Crown, UserPlus, UserMinus, BarChart2, Settings, Users, Activity, Bot, Shield } from 'lucide-react';
import { superAdminAPI } from '../services/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'admins', label: 'Manage Admins', icon: Shield },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

function AnalyticsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['superadmin-analytics'],
    queryFn: () => superAdminAPI.getAnalytics().then(r => r.data),
  });

  if (isLoading) return <div className="skeleton" style={{ height: 400, borderRadius: 12 }} />;

  const metrics = [
    { label: 'Total Users', value: data?.totals?.users, icon: Users, color: 'var(--accent)', bg: 'var(--accent-dim)' },
    { label: 'Daily Active', value: data?.activity?.dau, icon: Activity, color: 'var(--success)', bg: 'var(--success-dim)' },
    { label: 'Monthly Active', value: data?.activity?.mau, icon: Activity, color: 'var(--info)', bg: 'rgba(116,185,255,0.1)' },
    { label: 'Active Sessions', value: data?.activity?.activeSessions, icon: Users, color: 'var(--warning)', bg: 'var(--warning-dim)' },
    { label: 'Total Tasks', value: data?.totals?.tasks, icon: BarChart2, color: 'var(--accent)', bg: 'var(--accent-dim)' },
    { label: 'Total Goals', value: data?.totals?.goals, icon: BarChart2, color: 'var(--info)', bg: 'rgba(116,185,255,0.1)' },
    { label: 'AI Interactions', value: data?.totals?.aiInteractions, icon: Bot, color: 'var(--success)', bg: 'var(--success-dim)' },
    { label: 'New Today', value: data?.growth?.newUsersToday, icon: Users, color: 'var(--warning)', bg: 'var(--warning-dim)' },
  ];

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Platform Overview</h3>
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', border: '1px solid var(--border)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <m.icon size={18} color={m.color} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800 }}>{m.value ?? '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Role breakdown */}
      {data?.roles && (
        <div>
          <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14, fontSize: '0.95rem' }}>User Role Breakdown</h4>
          <div style={{ display: 'flex', gap: 12 }}>
            {data.roles.map(r => (
              <div key={r.role} style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800 }}>{r._count}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>{r.role.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: '', name: '', password: '' });
  const [showForm, setShowForm] = useState(false);

  const { data: usersData } = useQuery({
    queryKey: ['superadmin-admins'],
    queryFn: () => superAdminAPI.getAnalytics().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: superAdminAPI.createAdmin,
    onSuccess: () => {
      qc.invalidateQueries(['superadmin-admins']);
      qc.invalidateQueries(['admin-users']);
      toast.success('Admin created!');
      setForm({ email: '', name: '', password: '' });
      setShowForm(false);
    },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });

  const { data: adminListData } = useQuery({
    queryKey: ['admin-list'],
    queryFn: () => import('../services/api').then(m => m.adminAPI.getUsers({ role: 'ADMIN', limit: 50 }).then(r => r.data)),
  });

  const removeMut = useMutation({
    mutationFn: superAdminAPI.removeAdmin,
    onSuccess: () => { qc.invalidateQueries(['admin-list']); toast.success('Admin removed'); },
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Admin Accounts</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus size={14} /> Create Admin
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, background: 'var(--bg-elevated)' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>New Admin Account</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="admin@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary btn-sm" onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.email || !form.name || !form.password}>
              Create Admin
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {adminListData?.users?.map(a => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(116,185,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
              {a.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.email}</div>
            </div>
            <span className="badge" style={{ background: 'rgba(116,185,255,0.1)', color: 'var(--info)' }}>Admin</span>
            <button className="btn btn-danger btn-sm" onClick={() => removeMut.mutate(a.id)} title="Remove admin role">
              <UserMinus size={13} /> Demote
            </button>
          </div>
        ))}
        {adminListData?.users?.length === 0 && (
          <div className="empty-state" style={{ padding: '32px' }}>
            <Shield size={24} color="var(--text-muted)" />
            <span style={{ fontSize: '0.85rem' }}>No admins created yet</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState([
    { key: 'maintenance_mode', value: 'false' },
    { key: 'allow_registrations', value: 'true' },
    { key: 'ai_enabled', value: 'true' },
    { key: 'max_tasks_per_user', value: '500' },
  ]);

  const updateMut = useMutation({
    mutationFn: superAdminAPI.updateSettings,
    onSuccess: () => toast.success('Settings saved!'),
    onError: e => toast.error(e.response?.data?.error || 'Failed'),
  });

  const toggleBool = (key) => {
    setSettings(s => s.map(item => item.key === key ? { ...item, value: item.value === 'true' ? 'false' : 'true' } : item));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>System Configuration</h3>
        <button className="btn btn-primary btn-sm" onClick={() => updateMut.mutate(settings)}>
          Save Settings
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {settings.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 2 }}>{s.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>key: {s.key}</div>
            </div>
            {s.value === 'true' || s.value === 'false' ? (
              <button onClick={() => toggleBool(s.key)}
                style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: s.value === 'true' ? 'var(--success)' : 'var(--bg-card)', transition: 'all 0.2s', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'all 0.2s', left: s.value === 'true' ? 25 : 3 }} />
              </button>
            ) : (
              <input className="form-input" style={{ width: 100, textAlign: 'center' }} value={s.value}
                onChange={e => setSettings(settings.map(item => item.key === s.key ? { ...item, value: e.target.value } : item))} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuperAdminPanel() {
  const [tab, setTab] = useState('analytics');

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Super Admin</h1>
          <p className="page-subtitle">Full platform control · System-wide management</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--accent-dim)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-full)' }}>
          <Crown size={14} color="var(--accent)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>Super Admin</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, transition: 'all var(--transition)' }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'admins' && <AdminsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
