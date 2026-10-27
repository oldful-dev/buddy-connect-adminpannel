import { useEffect, useState, useCallback } from 'react';
import { Plus, UserCog, Pencil, Trash2, MailCheck } from 'lucide-react';
import { staffAPI } from '../lib/api';
import useAuthStore from '../store/useAuthStore';
import { isValidName } from '../lib/validators';
import { Loading, EmptyState, ErrorState, Modal, ConfirmDialog, apiError } from '../components/ui';

const ROLES = [
    { id: 'SUPPORT_AGENT', label: 'Support Agent' },
    { id: 'OPERATIONS_EXECUTIVE', label: 'Operations Executive' },
    { id: 'SUPER_ADMIN', label: 'Super Admin' },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', role: 'SUPPORT_AGENT' };

export default function Staff() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [rowError, setRowError] = useState('');
    const me = useAuthStore((st) => st.user);

    // Add flow
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    // Edit / delete
    const [editing, setEditing] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', role: '' });
    const [editError, setEditError] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [deleteError, setDeleteError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        setLoadError('');
        staffAPI.getAll()
            .then((res) => setRows(res.data.data))
            .catch((err) => setLoadError(apiError(err, 'Could not load staff')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (id, isActive) => {
        setRowError('');
        try {
            await staffAPI.setActive(id, !isActive);
            await load();
        } catch (err) {
            setRowError(apiError(err, 'Could not update this staff member'));
        }
    };

    const validateNewStaff = () => {
        if (!isValidName(form.name.trim())) return 'Please enter a valid name containing only letters.';
        if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.';
        if (form.phone.trim() && !MOBILE_RE.test(form.phone.replace(/\D/g, '').slice(-10))) return 'Please enter a valid 10-digit mobile number.';
        if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return 'Password must be at least 8 characters with a letter and a number.';
        return '';
    };

    const sendOtp = async () => {
        const problem = validateNewStaff();
        if (problem) { setError(problem); return; }
        setBusy(true);
        setError('');
        setInfo('');
        try {
            await staffAPI.requestEmailOtp(form.email.trim());
            setOtpSent(true);
            setInfo(`A 4-digit code was sent to ${form.email.trim()}.`);
        } catch (err) {
            setError(apiError(err, 'Could not send the verification code'));
        } finally {
            setBusy(false);
        }
    };

    const createStaff = async (e) => {
        e.preventDefault();
        if (!otpSent) { await sendOtp(); return; }
        if (!/^\d{4}$/.test(otp)) { setError('Enter the 4-digit code sent to the email.'); return; }
        setBusy(true);
        setError('');
        try {
            await staffAPI.register({
                name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role,
                ...(form.phone.trim() && { phone: form.phone.replace(/\D/g, '').slice(-10) }),
                emailOtp: otp,
            });
            closeForm();
            await load();
        } catch (err) {
            setError(apiError(err, 'Failed to create staff member'));
        } finally {
            setBusy(false);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setForm(EMPTY_FORM);
        setOtp('');
        setOtpSent(false);
        setError('');
        setInfo('');
    };

    const openEdit = (s) => {
        setEditing(s);
        setEditForm({ name: s.name, phone: s.phone || '', role: s.role });
        setEditError('');
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!isValidName(editForm.name.trim())) { setEditError('Please enter a valid name containing only letters.'); return; }
        if (editForm.phone.trim() && !MOBILE_RE.test(editForm.phone.replace(/\D/g, '').slice(-10))) { setEditError('Please enter a valid 10-digit mobile number.'); return; }
        setBusy(true);
        setEditError('');
        try {
            await staffAPI.update(editing.id, { name: editForm.name.trim(), phone: editForm.phone.trim(), role: editForm.role });
            setEditing(null);
            await load();
        } catch (err) {
            setEditError(apiError(err, 'Could not save changes'));
        } finally {
            setBusy(false);
        }
    };

    const confirmDelete = async () => {
        setBusy(true);
        setDeleteError('');
        try {
            await staffAPI.remove(deleting.id);
            setDeleting(null);
            await load();
        } catch (err) {
            setDeleteError(apiError(err, 'Could not delete this staff member'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>Staff</h2>
                <p>Admin users with access to this panel</p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <button className="btn btn-primary" onClick={() => (showForm ? closeForm() : setShowForm(true))}>
                    <Plus size={14} /> New Staff Member
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body">
                        <form onSubmit={createStaff}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input className="form-input" value={form.name} maxLength={60} disabled={otpSent} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email * (will be verified)</label>
                                    <input type="email" className="form-input" value={form.email} disabled={otpSent} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Mobile (optional)</label>
                                    <input className="form-input" inputMode="numeric" maxLength={10} value={form.phone} disabled={otpSent} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={form.role} disabled={otpSent} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                        {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Temporary password *</label>
                                <input type="password" className="form-input" value={form.password} disabled={otpSent} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                            </div>

                            {otpSent && (
                                <div className="form-group">
                                    <label className="form-label"><MailCheck size={14} style={{ verticalAlign: -2 }} /> Verification code</label>
                                    <input className="form-input" inputMode="numeric" maxLength={4} placeholder="4-digit code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus />
                                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={sendOtp} disabled={busy}>Resend code</button>
                                </div>
                            )}

                            {info && <div style={{ color: 'var(--accent-success)', fontSize: 13, marginBottom: 12 }}>{info}</div>}
                            {error && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" className="btn btn-primary" disabled={busy}>
                                    {busy ? 'Please wait…' : otpSent ? 'Verify & create staff member' : 'Send verification code'}
                                </button>
                                {otpSent && (
                                    <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => { setOtpSent(false); setOtp(''); setInfo(''); }}>
                                        Change details
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {rowError && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{rowError}</div>}

            <div className="card">
                {loading ? <Loading />
                    : loadError ? <ErrorState message={loadError} onRetry={load} />
                    : rows.length === 0 ? <EmptyState icon={UserCog} title="No staff members yet" />
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {rows.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.name}</td>
                                            <td style={{ overflowWrap: 'anywhere' }}>{s.email}</td>
                                            <td>{s.role.replace(/_/g, ' ')}</td>
                                            <td>{s.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Deactivated</span>}</td>
                                            <td>{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : 'Never'}</td>
                                            <td>
                                                {s.id === me?.id ? (
                                                    <span className="text-muted text-xs">You</span>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}><Pencil size={13} /> Edit</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(s.id, s.isActive)}>
                                                            {s.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => { setDeleteError(''); setDeleting(s); }}><Trash2 size={13} /> Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
            </div>

            {editing && (
                <Modal
                    title={`Edit ${editing.name}`}
                    onClose={() => setEditing(null)}
                    footer={(
                        <>
                            <button className="btn btn-secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveEdit} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
                        </>
                    )}
                >
                    <form onSubmit={saveEdit}>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input className="form-input" value={editForm.name} maxLength={60} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email (login ID — cannot be changed)</label>
                            <input className="form-input" value={editing.email} disabled />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Mobile</label>
                                <input className="form-input" inputMode="numeric" maxLength={10} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select className="form-select" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>
                        {editError && <div style={{ color: 'var(--accent-danger)', fontSize: 13 }}>{editError}</div>}
                    </form>
                </Modal>
            )}

            {deleting && (
                <ConfirmDialog
                    title="Delete staff member?"
                    message={`This permanently removes ${deleting.name} (${deleting.email}) and ends their access. Their past actions stay in the audit log. This can't be undone.`}
                    confirmLabel="Delete"
                    danger
                    busy={busy}
                    error={deleteError}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleting(null)}
                />
            )}
        </>
    );
}
