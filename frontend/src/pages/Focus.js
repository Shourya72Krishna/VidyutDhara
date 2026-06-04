import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Square, Timer, CheckCircle, Clock, TrendingUp, BarChart2, Coffee } from 'lucide-react';
import { focusAPI, tasksAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const PRESETS = [
  { label: '25 min', seconds: 25 * 60, type: 'focus', color: 'var(--accent)' },
  { label: '50 min', seconds: 50 * 60, type: 'focus', color: 'var(--accent)' },
  { label: '90 min', seconds: 90 * 60, type: 'focus', color: 'var(--accent)' },
  { label: '5 min', seconds: 5 * 60, type: 'break', color: 'var(--success)' },
  { label: '15 min', seconds: 15 * 60, type: 'break', color: 'var(--success)' },
];

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Focus() {
  const qc = useQueryClient();
  const [preset, setPreset] = useState(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].seconds);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const { data: statsData } = useQuery({ queryKey: ['focus-stats'], queryFn: () => focusAPI.stats().then(r => r.data) });
  const { data: sessionsData } = useQuery({ queryKey: ['focus-sessions'], queryFn: () => focusAPI.getSessions().then(r => r.data) });
  const { data: tasksData } = useQuery({ queryKey: ['tasks-focus'], queryFn: () => tasksAPI.getAll({ status: 'IN_PROGRESS', limit: 10 }).then(r => r.data) });

  const startMut = useMutation({
    mutationFn: focusAPI.start,
    onSuccess: (res) => setSessionId(res.data.session.id),
  });
  const endMut = useMutation({
    mutationFn: focusAPI.end,
    onSuccess: () => { qc.invalidateQueries(['focus-stats']); qc.invalidateQueries(['focus-sessions']); },
  });

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleStart = async () => {
    if (!sessionId) {
      const res = await startMut.mutateAsync({});
      setSessionId(res.data.session.id);
    }
    startTimeRef.current = Date.now();
    setRunning(true);
    toast.success('Focus session started!');
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleStop = async () => {
    setRunning(false);
    if (sessionId) {
      await endMut.mutateAsync(sessionId);
      setSessionId(null);
      toast.success(`Session ended · ${Math.round(elapsed / 60)} min focused`);
    }
    setTimeLeft(preset.seconds);
    setElapsed(0);
  };

  const handleComplete = async () => {
    if (sessionId) {
      await endMut.mutateAsync(sessionId);
      setSessionId(null);
    }
    toast.success('🎉 Focus session complete!');
    setElapsed(0);
  };

  const handlePreset = (p) => {
    if (running) return;
    setPreset(p);
    setTimeLeft(p.seconds);
    setElapsed(0);
  };

  const progress = ((preset.seconds - timeLeft) / preset.seconds) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const stats = statsData;
  const sessions = sessionsData?.sessions || [];

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Focus</h1>
          <p className="page-subtitle">Deep work sessions · Flow state training</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* Timer panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 32px' }}>
            {/* Circular timer */}
            <div style={{ position: 'relative', marginBottom: 32 }}>
              <svg width={260} height={260} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background ring */}
                <circle cx={130} cy={130} r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth={10} />
                {/* Progress ring */}
                <circle
                  cx={130} cy={130} r={radius} fill="none"
                  stroke={preset.type === 'break' ? 'var(--success)' : 'var(--accent)'}
                  strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease', filter: running ? `drop-shadow(0 0 8px ${preset.type === 'break' ? 'var(--success)' : 'var(--accent)'})` : 'none' }}
                />
              </svg>
              {/* Time display */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1 }}>
                  {formatTime(timeLeft)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>
                  {running ? (preset.type === 'break' ? '☕ Break time' : '🎯 Focused') : 'Ready'}
                </div>
                {running && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {Math.round(elapsed / 60)}m elapsed
                  </div>
                )}
              </div>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => handlePreset(p)} disabled={running}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid',
                    fontSize: '0.8rem', fontWeight: 500, cursor: running ? 'not-allowed' : 'pointer',
                    background: preset === p ? `${p.color}18` : 'var(--bg-elevated)',
                    color: preset === p ? p.color : 'var(--text-muted)',
                    borderColor: preset === p ? `${p.color}50` : 'var(--border)',
                    opacity: running ? 0.5 : 1, transition: 'all var(--transition)',
                  }}>
                  {p.label}
                  {p.type === 'break' && <Coffee size={11} style={{ marginLeft: 4, display: 'inline' }} />}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {!running ? (
                <button className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1rem', gap: 10 }} onClick={handleStart}>
                  <Play size={18} fill="currentColor" /> {sessionId ? 'Resume' : 'Start'}
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ padding: '14px 36px', fontSize: '1rem', gap: 10 }} onClick={handlePause}>
                  <Pause size={18} fill="currentColor" /> Pause
                </button>
              )}
              {(running || sessionId) && (
                <button className="btn btn-danger" style={{ padding: '14px 20px' }} onClick={handleStop}>
                  <Square size={16} fill="currentColor" />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Hours', value: Math.round((stats?.totalMinutes || 0) / 60), icon: Clock, color: 'var(--accent)' },
              { label: 'Sessions', value: stats?.totalSessions || 0, icon: Timer, color: 'var(--info)' },
              { label: 'Avg (min)', value: stats?.avgDuration || 0, icon: TrendingUp, color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <s.icon size={20} color={s.color} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* History panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Session History</h3>
            {sessions.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <Timer size={24} color="var(--text-muted)" />
                <span style={{ fontSize: '0.85rem' }}>No sessions yet. Start focusing!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                {sessions.slice(0, 15).map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: s.isCompleted ? 'var(--success-dim)' : 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.isCompleted ? <CheckCircle size={16} color="var(--success)" /> : <Clock size={16} color="var(--text-muted)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {s.duration ? `${s.duration} min session` : 'Incomplete session'}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                        {format(new Date(s.startTime), 'MMM d, h:mm a')}
                      </div>
                    </div>
                    {s.duration && (
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{s.duration}m</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="card" style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-glow)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 12, color: 'var(--accent)', fontSize: '0.95rem' }}>
              💡 Focus Tips
            </h3>
            <ul style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: 16 }}>
              <li>Put your phone in Do Not Disturb mode</li>
              <li>Close unrelated browser tabs</li>
              <li>Work on one task at a time</li>
              <li>Take short breaks every 25-50 minutes</li>
              <li>Stay hydrated and stretch between sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
