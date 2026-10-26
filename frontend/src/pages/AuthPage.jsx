import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole]       = useState('student');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await loginUser({ email, password, role });
      login(data, data.token);
      navigate(data.role === 'tpo' ? '/tpo' : data.role === 'company' ? '/company' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--beige)' }}
    >
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-8 text-sm font-medium transition-colors"
        style={{ color: 'var(--text-mid)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ← Home
      </button>

      <div
        className="w-full rounded-2xl p-10"
        style={{
          maxWidth: '420px',
          background: 'var(--glass)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 20px 60px rgba(176,196,222,0.25)',
        }}
      >
        <h2 className="font-serif text-3xl mb-1" style={{ color: 'var(--text-dark)' }}>
          Welcome Back
        </h2>
        <p className="text-sm font-light mb-7" style={{ color: 'var(--text-mid)' }}>
          Sign in to your CareerConnect account
        </p>

        {/* Role tabs */}
        <div
          className="flex rounded-full p-1 mb-7"
          style={{ background: 'rgba(176,196,222,0.15)' }}
        >
          {['student', 'tpo', 'company'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className="flex-1 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: role === r ? '#fff' : 'transparent',
                color: role === r ? 'var(--text-dark)' : 'var(--text-mid)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: role === r ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {r === 'tpo' ? 'TPO Officer' : r === 'company' ? 'Company Recruiter' : 'Student'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-5">
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-mid)' }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1.5px solid rgba(176,196,222,0.4)',
                color: 'var(--text-dark)',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--pastel-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(176,196,222,0.4)')}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              className="block text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--text-mid)' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.6)',
                border: '1.5px solid rgba(176,196,222,0.4)',
                color: 'var(--text-dark)',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--pastel-blue)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(176,196,222,0.4)')}
            />
          </div>

          {error && (
            <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: '#fce4e4', color: '#9a2a2a' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full text-white font-medium transition-opacity"
            style={{ background: 'var(--matte)', opacity: loading ? 0.7 : 1, fontFamily: 'inherit', border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
