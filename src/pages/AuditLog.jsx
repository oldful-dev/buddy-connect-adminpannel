import { useEffect, useState, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollText, ChevronDown, ChevronRight } from 'lucide-react';
import { auditAPI } from '../lib/api';
import { Loading, EmptyState, ErrorState, apiError } from '../components/ui';

/**
 * One row per user (instead of one row per action): action count, last
 * activity, and a collapsible list of their most recent actions. Clicking the
 * name opens that user's full history.
 */
export default function AuditLog() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [open, setOpen] = useState({});

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        auditAPI.users()
            .then((res) => setUsers(res.data.data))
            .catch((err) => setError(apiError(err, 'Could not load the audit log')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));
    const keyOf = (u) => u.adminId || 'system';

    return (
        <>
            <div className="page-header">
                <h2>Audit Log</h2>
                <p>Administrative actions grouped by user — expand a row for recent actions, or open a user for their full history</p>
            </div>

            <div className="card">
                {loading ? <Loading />
                    : error ? <ErrorState message={error} onRetry={load} />
                    : users.length === 0 ? <EmptyState icon={ScrollText} title="No audit entries yet" />
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th style={{ width: 36 }}></th><th>User</th><th>Role</th><th>Actions</th><th>Last activity</th></tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => {
                                        const key = keyOf(u);
                                        const isOpen = !!open[key];
                                        return (
                                            <Fragment key={key}>
                                                <tr style={{ cursor: 'pointer' }} onClick={() => toggle(key)}>
                                                    <td>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                                                    <td>
                                                        {u.adminId ? (
                                                            <a href={`/audit/users/${u.adminId}`} style={{ fontWeight: 600 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/audit/users/${u.adminId}`); }}>
                                                                {u.admin.name}
                                                            </a>
                                                        ) : <strong>{u.admin.name}</strong>}
                                                        <div className="text-muted text-xs">{u.admin.email}</div>
                                                    </td>
                                                    <td>{u.admin.role ? u.admin.role.replace(/_/g, ' ') : '—'}</td>
                                                    <td><span className="badge badge-purple">{u.actionCount}</span></td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(u.lastActionAt).toLocaleString()}</td>
                                                </tr>
                                                {isOpen && (
                                                    <tr>
                                                        <td></td>
                                                        <td colSpan={4} style={{ background: 'var(--bg-glass)' }}>
                                                            {u.recent.map((r) => (
                                                                <div key={r.id} style={{ display: 'flex', gap: 12, padding: '4px 0', flexWrap: 'wrap' }}>
                                                                    <span className="badge badge-purple">{r.action}</span>
                                                                    <span>{r.entity}{r.entityId ? ` #${r.entityId.slice(0, 8)}` : ''}</span>
                                                                    <span className="text-muted text-xs" style={{ marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                            {u.adminId && (
                                                                <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => navigate(`/audit/users/${u.adminId}`)}>
                                                                    View full history ({u.actionCount})
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
            </div>
        </>
    );
}
