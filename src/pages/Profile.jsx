import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { profileAPI } from '../lib/api';
import useAuthStore from '../store/useAuthStore';
import { Loading, ErrorState, apiError } from '../components/ui';

const NAME_RE = /^[\p{L}][\p{L} .'-]{1,59}$/u;
const MOBILE_RE = /^[6-9]\d{9}$/;

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [form, setForm] = useState({ name: '', phone: '' });
    const [formMsg, setFormMsg] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
    const [showPw, setShowPw] = useState(false);
    const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
    const [changing, setChanging] = useState(false);

    useEffect(() => {
        profileAPI.get()
            .then((res) => {
                setProfile(res.data.data);
                setForm({ name: res.data.data.name || '', phone: res.data.data.phone || '' });
            })
            .catch((err) => setLoadError(apiError(err, 'Could not load your profile')))
            .finally(() => setLoading(false));
    }, []);

    const saveProfile = async (e) => {
        e.preventDefault();
        setFormMsg({ type: '', text: '' });
        if (!NAME_RE.test(form.name.trim())) { setFormMsg({ type: 'error', text: 'Please enter a valid name containing only letters.' }); return; }
        if (form.phone.trim() && !MOBILE_RE.test(form.phone)) { setFormMsg({ type: 'error', text: 'Please enter a valid 10-digit mobile number.' }); return; }
        setSaving(true);
        try {
            const res = await profileAPI.update({ name: form.name.trim(), phone: form.phone.trim() });
            setProfile(res.data.data);
            useAuthStore.setState((st) => ({ user: { ...(st.user || {}), name: res.data.data.name } }));
            setFormMsg({ type: 'ok', text: 'Profile updated.' });
        } catch (err) {
            setFormMsg({ type: 'error', text: apiError(err, 'Could not update your profile') });
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        setPwMsg({ type: '', text: '' });
        if (pw.next.length < 8 || !/[A-Za-z]/.test(pw.next) || !/\d/.test(pw.next)) { setPwMsg({ type: 'error', text: 'New password must be at least 8 characters with a letter and a number.' }); return; }
        if (pw.next !== pw.confirm) { setPwMsg({ type: 'error', text: 'The new passwords do not match.' }); return; }
        setChanging(true);
        try {
            await profileAPI.changePassword(pw.current, pw.next);
            setPw({ current: '', next: '', confirm: '' });
            setPwMsg({ type: 'ok', text: 'Password changed.' });
        } catch (err) {
            setPwMsg({ type: 'error', text: apiError(err, 'Could not change the password') });
        } finally {
            setChanging(false);
        }
    };

    if (loading) return <Loading />;
    if (loadError || !profile) return <ErrorState message={loadError || 'Profile not found'} />;

    const msg = (m) => m.text && (
        <div style={{ color: m.type === 'ok' ? 'var(--accent-success)' : 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{m.text}</div>
    );

    return (
        <>
            <div className="page-header">
                <h2>Profile Settings</h2>
                <p>{profile.email} · {profile.role.replace(/_/g, ' ')}</p>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Your details</h3></div>
                    <form className="card-body" onSubmit={saveProfile}>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input className="form-input" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email (your login ID)</label>
                            <input className="form-input" value={profile.email} disabled />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Mobile</label>
                            <input className="form-input" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                        </div>
                        {msg(formMsg)}
                        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                    </form>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Change password</h3></div>
                    <form className="card-body" onSubmit={changePassword}>
                        {[['current', 'Current password'], ['next', 'New password'], ['confirm', 'Confirm new password']].map(([key, label]) => (
                            <div className="form-group" key={key}>
                                <label className="form-label">{label}</label>
                                <input type={showPw ? 'text' : 'password'} className="form-input" value={pw[key]} onChange={(e) => setPw({ ...pw, [key]: e.target.value })} autoComplete={key === 'current' ? 'current-password' : 'new-password'} required />
                            </div>
                        ))}
                        <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }} onClick={() => setShowPw((v) => !v)}>
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />} {showPw ? 'Hide' : 'Show'} passwords
                        </button>
                        {msg(pwMsg)}
                        <div><button type="submit" className="btn btn-primary" disabled={changing}>{changing ? 'Changing…' : 'Change password'}</button></div>
                    </form>
                </div>
            </div>
        </>
    );
}
