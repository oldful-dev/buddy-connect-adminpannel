import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Calendar, Pencil, Bell } from 'lucide-react';
import { familyAccountAPI } from '../lib/api';
import { isValidName } from '../lib/validators';
import { Loading, ErrorState, Value, apiError } from '../components/ui';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function FamilyAccountDetail() {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', email: '' });
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        familyAccountAPI.getById(accountId)
            .then((res) => setData(res.data.data))
            .catch((err) => setError(apiError(err, 'Could not load this account')))
            .finally(() => setLoading(false));
    }, [accountId]);

    useEffect(() => { load(); }, [load]);

    const startEdit = () => {
        setForm({ name: data.account.name || '', email: data.account.email || '' });
        setFormError('');
        setEditing(true);
    };

    const save = async (e) => {
        e.preventDefault();
        if (!isValidName(form.name.trim())) { setFormError('Name is required and must contain only letters.'); return; }
        if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) { setFormError('Please enter a valid email address.'); return; }
        setSaving(true);
        setFormError('');
        try {
            await familyAccountAPI.update(accountId, { name: form.name.trim(), email: form.email.trim() });
            setEditing(false);
            load();
        } catch (err) {
            setFormError(apiError(err, 'Could not save'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;
    if (error || !data) return <ErrorState message={error || 'Account not found'} onRetry={load} />;

    const { account, patients } = data;

    return (
        <>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/family-accounts')}>
                <ArrowLeft size={14} /> Back to family accounts
            </button>

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h2>{account.name || 'Unnamed family account'}</h2>
                    <p>{account.phone}</p>
                </div>
                {!editing && <button className="btn btn-primary" onClick={startEdit}><Pencil size={14} /> Edit</button>}
            </div>

            {editing && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Edit account</h3></div>
                    <form className="card-body" onSubmit={save}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Name *</label>
                                <input className="form-input" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                        </div>
                        <p className="text-muted text-xs" style={{ marginTop: 0 }}>The phone number is the account's login ID and can't be changed here.</p>
                        {formError && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{formError}</div>}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="card-header"><h3>Account</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="flex items-center gap-2"><Phone size={14} className="text-muted" /> {account.phone}</div>
                    <div className="flex items-center gap-2"><Mail size={14} className="text-muted" /> <Value>{account.email}</Value></div>
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-muted" /> Joined {new Date(account.createdAt).toLocaleDateString()}</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Linked Patients ({patients.length})</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {patients.length === 0 ? (
                        <div style={{ padding: 24, color: 'var(--text-muted)' }}>No patients linked yet.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Patient</th><th>Ayuxa ID</th><th>Relation</th><th>Can Edit</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {patients.map(({ link, patient }) => (
                                        <tr key={link.id} style={{ cursor: patient ? 'pointer' : 'default' }} onClick={() => patient && navigate(`/patients/${patient.id}`)}>
                                            <td>{patient?.name || 'Deleted / not found'}</td>
                                            <td>{patient?.uniqueUserId || '—'}</td>
                                            <td>{link.relation}</td>
                                            <td>{link.canEdit ? 'Yes' : 'No'}</td>
                                            <td>{patient?.status || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3><Bell size={15} style={{ verticalAlign: -2 }} /> Recent notifications</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {account.notifications?.length ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>When</th><th>Title</th><th>Message</th><th>Read</th></tr></thead>
                                <tbody>
                                    {account.notifications.map((n) => (
                                        <tr key={n.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(n.createdAt).toLocaleString()}</td>
                                            <td>{n.title}</td>
                                            <td style={{ overflowWrap: 'anywhere' }}>{n.body}</td>
                                            <td>{n.read ? 'Yes' : 'No'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <div style={{ padding: 24, color: 'var(--text-muted)' }}>No notifications yet.</div>}
                </div>
            </div>
        </>
    );
}
