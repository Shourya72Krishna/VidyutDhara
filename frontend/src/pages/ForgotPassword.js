import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(250,189,47,0.3)' }}>
            <Zap size={22} color="#0a0b0f" strokeWidth={2.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>VidyutDhar</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={32} color="var(--success)" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: 12 }}>Check your inbox</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 28 }}>
              If an account exists for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, we've sent a reset link.
            </p>
            <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Reset password</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" className="form-input" style={{ paddingLeft: 38 }} placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', padding: '13px' }} disabled={loading}>
                {loading ? <div className="animate-spin" style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%' }} /> : 'Send reset link'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={15} /> Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
