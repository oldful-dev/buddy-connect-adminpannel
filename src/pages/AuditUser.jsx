import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { auditAPI } from '../lib/api';
import { Pagination, Loading, EmptyState, ErrorState, apiError } from '../components/ui';

/** Everything one user has done, newest first, with an action filter. */
export default function AuditUser() {
    const { adminId } = useParams();
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [action, setAction] = useState('');
    const [actions, setActions] = useState([]);

    const load = useCallback((page = 1) => {
        setLoading(true);
        setError('');
        auditAPI.getAll({ page, limit: 30, adminId, action: action || undefined })
            .then((res) => {
                setRows(res.data.data);
                setPagination(res.data.pagination);
                setActions((prev) => [...new Set([...prev, ...res.data.data.map((r) => r.action)])].sort());
            })
            .catch((err) => setError(apiError(err, 'Could not load this history')))
            .finally(() => setLoading(false));
    }, [adminId, action]);

    useEffect(() => { load(1); }, [load]);

    const who = rows[0]?.admin;

    return (
        <>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/audit')}>
                <ArrowLeft size={14} /> Back to audit log
            </button>

            <div className="page-header">
                <h2>{who?.name || 'User history'}</h2>
                <p>{who?.email} {who?.role ? `· ${who.role.replace(/_/g, ' ')}` : ''} · {pagination.total} action{pagination.total === 1 ? '' : 's'}</p>
            </div>

            <div className="filter-bar">
                <div className="form-group" style={{ margin: 0, minWidth: 220 }}>
                    <label className="form-label">Action</label>
                    <select className="form-select" value={action} onChange={(e) => setAction(e.target.value)}>
                        <option value="">All actions</option>
                        {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            <div className="card">
                {loading ? <Loading />
                    : error ? <ErrorState message={error} onRetry={() => load(1)} />
                    : rows.length === 0 ? <EmptyState icon={ScrollText} title="No actions recorded" />
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>When</th><th>Action</th><th>Entity</th><th>Details</th><th>IP</th></tr></thead>
                                <tbody>
                                    {rows.map((log) => (
                                        <tr key={log.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                                            <td><span className="badge badge-purple">{log.action}</span></td>
                                            <td>{log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}</td>
                                            <td className="text-xs" style={{ maxWidth: 280, overflowWrap: 'anywhere' }}>
                                                {log.newValue ? JSON.stringify(log.newValue) : '—'}
                                            </td>
                                            <td>{log.ipAddress || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
            </div>

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={load} />
        </>
    );
}
