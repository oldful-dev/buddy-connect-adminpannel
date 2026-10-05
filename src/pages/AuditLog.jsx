import { useEffect, useState, useCallback } from 'react';
import { ScrollText } from 'lucide-react';
import { auditAPI } from '../lib/api';
import { Pagination, Loading, EmptyState } from '../components/ui';

export default function AuditLog() {
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);

    const load = useCallback((page = 1) => {
        setLoading(true);
        auditAPI.getAll({ page, limit: 30 })
            .then((res) => {
                setRows(res.data.data);
                setPagination(res.data.pagination);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(1); }, [load]);

    return (
        <>
            <div className="page-header">
                <h2>Audit Log</h2>
                <p>All administrative actions taken across Buddy &amp; Connect</p>
            </div>

            <div className="card">
                {loading ? (
                    <Loading />
                ) : rows.length === 0 ? (
                    <EmptyState icon={ScrollText} title="No audit entries yet" />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Admin</th><th>Action</th><th>Entity</th><th>IP</th><th>When</th></tr>
                            </thead>
                            <tbody>
                                {rows.map((log) => (
                                    <tr key={log.id}>
                                        <td>{log.admin?.name || '—'}</td>
                                        <td><span className="badge badge-purple">{log.action}</span></td>
                                        <td>{log.entity} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}</td>
                                        <td>{log.ipAddress || '—'}</td>
                                        <td>{new Date(log.createdAt).toLocaleString()}</td>
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
