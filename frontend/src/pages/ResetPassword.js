import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (!token) return toast.error('Invalid reset link');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} color="#0a0b0f" strokeWidth={2.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>VidyutDhar</div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} color="var(--success)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 12 }}>Password reset!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Redirecting to login...</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Set new password</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>Choose a strong password for your account.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type={showPass ? 'text' : 'password'} className="form-input" style={{ paddingLeft: 38, paddingRight: 40 }}
                    placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 28 }}>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" className="form-input" style={{ paddingLeft: 38 }}
                    placeholder="Repeat password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: '13px' }} disabled={loading}>
                {loading ? <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }} /> : 'Reset password'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
