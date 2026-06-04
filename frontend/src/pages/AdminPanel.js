import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, Activity, FileText, Search, Ban, Clock, CheckCircle, XCircle, AlertTriangle, BarChart2 } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'activity', label: 'Activity Logs', icon: Activity },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
];

function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: () => adminAPI.getUsers({ search, role, page, limit: 15 }).then(r => r.data),
  });

  const banMut = useMutation({
    mutationFn: adminAPI.banUser,
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Done!'); },
  });
  const suspendMut = useMutation({
    mutationFn: ({ id, until }) => adminAPI.suspendUser(id, { until }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Done!'); },
  });

  const handleSuspend = (id) => {
    const date = prompt('Suspend until (YYYY-MM-DD):');
    if (date) suspendMut.mutate({ id, until: date });
  };

  const roleColor = { SUPER_ADMIN: 'var(--accent)', ADMIN: 'var(--info)', USER: 'var(--success)' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search users..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-input" style={{ width: 140 }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 58, borderRadius: 10 }} />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.users?.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: u.isBanned ? '1px solid var(--danger-dim)' : '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.avatar ? `url(${u.avatar}) center/cover` : 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0, backgroundSize: 'cover' }}>
                  {!u.avatar && u.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                    <span className="badge" style={{ background: `${roleColor[u.role]}18`, color: roleColor[u.role], fontSize: '0.68rem' }}>{u.role}</span>
                    {u.isBanned && <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>Banned</span>}
                    {u.isSuspended && <span className="badge" style={{ background: 'var(--warning-dim)', color: 'var(--warning)', fontSize: '0.68rem' }}>Suspended</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {u.email} · Joined {format(new Date(u.createdAt), 'MMM d, yyyy')} · {u.lastLogin ? `Last seen ${format(new Date(u.lastLogin), 'MMM d')}` : 'Never logged in'}
                  </div>
                </div>
                {u.role !== 'SUPER_ADMIN' && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleSuspend(u.id)} title="Suspend">
                      <Clock size={13} />
                    </button>
                    <button className={`btn btn-sm ${u.isBanned ? 'btn-secondary' : 'btn-danger'}`} onClick={() => banMut.mutate(u.id)} title={u.isBanned ? 'Unban' : 'Ban'}>
                      {u.isBanned ? <CheckCircle size={13} /> : <Ban size={13} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Pagination */}
          {data?.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Page {page} of {data.pages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ActivityTab() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-activity', search],
    queryFn: () => adminAPI.getActivity({ action: search }).then(r => r.data),
  });

  const actionColor = (a) => {
    if (a.includes('DELETE') || a.includes('BAN')) return 'var(--danger)';
    if (a.includes('CREATE') || a.includes('REGISTER')) return 'var(--success)';
    if (a.includes('LOGIN')) return 'var(--info)';
    return 'var(--text-muted)';
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input className="form-input" placeholder="Filter by action..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
      </div>
      {isLoading ? <div className="skeleton" style={{ height: 400, borderRadius: 12 }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data?.logs?.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: 14, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: actionColor(log.action), flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: actionColor(log.action), minWidth: 140 }}>{log.action}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{log.user?.name || 'System'} ({log.user?.email || '—'})</span>
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', flexShrink: 0 }}>{format(new Date(log.createdAt), 'MMM d, HH:mm')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => adminAPI.getAudit().then(r => r.data),
  });

  return (
    <div>
      {isLoading ? <div className="skeleton" style={{ height: 400, borderRadius: 12 }} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data?.logs?.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: 14, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color="var(--warning)" style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{log.action}</span>
                  {log.target && <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.68rem' }}>{log.target}</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  By {log.user?.name || 'System'} · {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('users');

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage users, monitor activity, review audit logs</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(116,185,255,0.1)', border: '1px solid rgba(116,185,255,0.2)', borderRadius: 'var(--radius-full)' }}>
          <Shield size={14} color="var(--info)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--info)', fontWeight: 600 }}>Admin Access</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--info)' : 'var(--text-muted)', borderBottom: tab === t.id ? '2px solid var(--info)' : '2px solid transparent', marginBottom: -1, transition: 'all var(--transition)' }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'users' && <UsersTab />}
        {tab === 'activity' && <ActivityTab />}
        {tab === 'audit' && <AuditTab />}
      </div>
    </div>
  );
}
