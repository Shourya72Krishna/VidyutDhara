import React, { useState } from 'react';
import { Outlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, Target, Zap, FileText, Timer,
  Bot, User, Settings, LogOut, Bell, Search, Menu, X,
  Shield, Crown, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../context/AuthStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI, searchAPI } from '../../services/api';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/habits', icon: Zap, label: 'Habits' },
  { path: '/notes', icon: FileText, label: 'Notes' },
  { path: '/focus', icon: Timer, label: 'Focus' },
  { path: '/ai', icon: Bot, label: 'AI Assistant' },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: searchData } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => searchAPI.search(searchQuery).then(r => r.data),
    enabled: searchQuery.length > 1,
    staleTime: 500,
  });

  const unread = notifData?.notifications?.filter(n => !n.isRead).length || 0;

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
  };

  const getTypeIcon = (type) => {
    const map = { task: '✓', goal: '◎', note: '✎', habit: '⚡' };
    return map[type] || '•';
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-260px', bottom: 0,
        width: 'var(--sidebar-width)', background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)', zIndex: 100,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'var(--gradient-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(250, 189, 47, 0.3)',
            }}>
              <Zap size={18} color="#0a0b0f" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                VidyutDhar
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Productivity OS
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8, fontWeight: 700 }}>
            Workspace
          </div>

          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                marginBottom: 2, transition: 'all var(--transition)',
                fontSize: '0.875rem', fontWeight: isActive ? 600 : 400,
                textDecoration: 'none', border: isActive ? '1px solid rgba(250, 189, 47, 0.15)' : '1px solid transparent',
              })}
            >
              <Icon size={17} />
              {label}
              {path === '/ai' && (
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  AI
                </span>
              )}
            </NavLink>
          ))}

          {/* Admin links */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 8px 8px', fontWeight: 700, marginTop: 8, borderTop: '1px solid var(--border)' }}>
                Admin
              </div>
              <NavLink to="/admin" style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--info)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(116, 185, 255, 0.1)' : 'transparent',
                marginBottom: 2, transition: 'all var(--transition)', fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                border: '1px solid transparent',
              })}>
                <Shield size={17} />
                Admin Panel
              </NavLink>
            </>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <NavLink to="/superadmin" style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              marginBottom: 2, transition: 'all var(--transition)', fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400, textDecoration: 'none',
              border: '1px solid transparent',
            })}>
              <Crown size={17} />
              Super Admin
            </NavLink>
          )}
        </nav>

        {/* User profile at bottom */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--gradient-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-inverse)',
              flexShrink: 0, backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
              {!user?.avatar && user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role?.toLowerCase().replace('_', ' ')}
              </div>
            </div>
            <button onClick={handleLogout} className="btn-ghost btn-icon" title="Sign out">
              <LogOut size={16} color="var(--text-muted)" />
            </button>
          </div>
        </div>
      </aside>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: sidebarOpen ? 'var(--sidebar-width)' : 0, right: 0,
        height: 'var(--header-height)', background: 'rgba(10, 11, 15, 0.9)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
        zIndex: 99, display: 'flex', alignItems: 'center', padding: '0 24px',
        gap: 16, transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <button
          className="btn-ghost btn-icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, height: 38, fontSize: '0.875rem' }}
            placeholder="Search tasks, goals, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />

          {/* Search results dropdown */}
          {searchOpen && searchQuery.length > 1 && searchData?.results?.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)', zIndex: 200,
            }}>
              {searchData.results.map(item => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => navigate(`/${item.type}s`)}
                  style={{
                    width: '100%', padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'transparent', color: 'var(--text-primary)',
                    textAlign: 'left', transition: 'background var(--transition)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '1rem', opacity: 0.6 }}>{getTypeIcon(item.type)}</span>
                  <span style={{ flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button className="btn-ghost btn-icon" style={{ position: 'relative' }} onClick={() => setNotifOpen(!notifOpen)}>
              <Bell size={18} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--accent)', border: '2px solid var(--bg-base)',
                }} />
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 340, background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)', zIndex: 200,
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                  {unread > 0 && <span className="badge badge-accent">{unread} new</span>}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifData?.notifications?.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No notifications
                    </div>
                  ) : (
                    notifData?.notifications?.slice(0, 10).map(n => (
                      <div key={n.id} style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
                        background: n.isRead ? 'transparent' : 'var(--accent-dim)',
                      }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: n.isRead ? 400 : 600 }}>{n.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile link */}
          <NavLink to="/profile" className="btn-ghost btn-icon">
            <User size={18} />
          </NavLink>
        </div>
      </header>

      {/* Main content */}
      <main className="main-content" style={{ marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 0, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
