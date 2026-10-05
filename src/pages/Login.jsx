import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (res.success) navigate('/dashboard', { replace: true });
        else setError(res.message);
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--gradient-hero)', padding: 20,
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 400 }}>
                <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                        <img src="/onlylogo.png" alt="Ayuxa" width={56} height={56} style={{ objectFit: 'contain', marginBottom: 12 }} />
                        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-primary-dark)' }}>Ayuxa Admin</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sign in to manage Buddy &amp; Connect</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    style={{ paddingLeft: 40 }}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@ayuxa.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    style={{ paddingLeft: 40, paddingRight: 40 }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        display: 'flex', alignItems: 'center', color: 'var(--text-muted)',
                                        background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }} disabled={loading}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
