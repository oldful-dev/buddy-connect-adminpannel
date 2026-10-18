import { useEffect, useState, useCallback } from 'react';
import { Plus, UserCog } from 'lucide-react';
import { staffAPI } from '../lib/api';
import useAuthStore from '../store/useAuthStore';
import { Loading, EmptyState } from '../components/ui';

export default function Staff() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SUPPORT_AGENT' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [rowError, setRowError] = useState('');
    const me = useAuthStore((st) => st.user);

    const load = useCallback(() => {
        setLoading(true);
        staffAPI.getAll().then((res) => setRows(res.data.data)).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (id, isActive) => {
        setRowError('');
        try {
            await staffAPI.setActive(id, !isActive);
            await load();
        } catch (err) {
            setRowError(err.response?.data?.message || 'Could not update this staff member');
        }
    };

    const createStaff = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await staffAPI.register(form);
            setForm({ name: '', email: '', password: '', role: 'SUPPORT_AGENT' });
            setShowForm(false);
            await load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create staff member');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>Staff</h2>
                <p>Admin users with access to this panel</p>
            </div>

            <div style={{ marginBottom: 20 }}>
                <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
                    <Plus size={14} /> New Staff Member
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body">
                        <form onSubmit={createStaff}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                        <option value="SUPPORT_AGENT">Support Agent</option>
                                        <option value="OPERATIONS_EXECUTIVE">Operations Executive</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>
                            </div>
                            {error && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Creating…' : 'Create Staff Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {rowError && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{rowError}</div>}

            <div className="card">
                {loading ? (
                    <Loading />
                ) : rows.length === 0 ? (
                    <EmptyState icon={UserCog} title="No staff members yet" />
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th></th></tr>
                        </thead>
                        <tbody>
                            {rows.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.email}</td>
                                    <td>{s.role.replace(/_/g, ' ')}</td>
                                    <td>{s.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Deactivated</span>}</td>
                                    <td>{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString() : 'Never'}</td>
                                    <td>
                                        {s.id === me?.id ? (
                                            <span className="text-muted text-xs">You</span>
                                        ) : (
                                            <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(s.id, s.isActive)}>
                                                {s.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
