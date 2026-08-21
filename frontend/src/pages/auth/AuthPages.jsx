import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const role = await login(email, password);
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err || 'Failed to login');
    }
  };

  return (
    <main className="auth-page landing-interactive">
      <div className="brand auth-brand">Katalyst</div>
      <section className="landing-panel">
        <form className="card auth-card landing-copy" onSubmit={handleSubmit}>
          <div className="eyebrow">Momentum Learning</div>
          <h1 className="title-lg">Learn. Grow. Level Up.</h1>
          <p className="lead">A gamified learning platform that turns learning into progress, challenges and achievement.</p>
          
          <div className="form-grid" style={{ marginTop: 28, gap: 12, textAlign: 'left' }}>
            <input className="input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {error && <div className="label" style={{ color: 'var(--danger)', marginTop: 12 }}>{error}</div>}

          <button className="btn btn-primary full" type="submit" style={{ marginTop: 20 }}>
            Login to Katalyst
          </button>
          
          <button type="button" className="btn btn-ghost full" onClick={() => navigate('/role')} style={{ marginTop: 12 }}>
            <span style={{ color: '#4285f4', fontWeight: 900 }}>G</span>
            Continue with Google
          </button>
          <div className="label muted" style={{ marginTop: 28 }}>Secure, single-click access</div>
        </form>
        <div className="landing-visual" aria-hidden="true">
          <div className="landing-cubes-fallback">
            {Array.from({ length: 36 }).map((_, index) => (
              <span key={index} style={{ animationDelay: `${index * 40}ms` }} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export const RoleSelectionPage = () => {
  const navigate = useNavigate();
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="title-lg primary">Welcome to Katalyst</h1>
        <p className="lead">How will you use Katalyst?</p>
        <div className="role-options">
          <button className="role-card" onClick={() => navigate('/student/home')}>
            <div className="eyebrow">Student</div>
            <h2>Build momentum</h2>
            <p className="muted">Learn, practice, track progress, earn certificates and work with your AI Coach.</p>
          </button>
          <button className="role-card" onClick={() => navigate('/admin/dashboard')}>
            <div className="eyebrow">Admin</div>
            <h2>Manage Katalyst</h2>
            <p className="muted">Create activities, review submissions, support students and monitor platform progress.</p>
          </button>
        </div>
      </section>
    </main>
  );
};
