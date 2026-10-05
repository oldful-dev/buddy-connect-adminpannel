import { useEffect, useState, useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
import { checkInAPI } from '../lib/api';
import { Pagination, Loading, EmptyState } from '../components/ui';

export default function CheckIns() {
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [activeOnly, setActiveOnly] = useState(false);

    const load = useCallback((page = 1) => {
        setLoading(true);
        checkInAPI.getAll({ page, limit: 20, active: activeOnly ? 'true' : undefined })
            .then((res) => {
                setRows(res.data.data);
                setPagination(res.data.pagination);
            })
            .finally(() => setLoading(false));
    }, [activeOnly]);

    useEffect(() => { load(1); }, [load]);

    return (
        <>
            <div className="page-header">
                <h2>Check-Ins</h2>
                <p>Ayuxa Buddy — live and historical caregiver shifts</p>
            </div>

            <div className="filter-bar">
                <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <span className="toggle-switch">
                        <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} />
                        <span className="toggle-slider" />
                    </span>
                    <span className="text-sm">Active check-ins only</span>
                </label>
            </div>

            <div className="card">
                {loading ? (
                    <Loading />
                ) : rows.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="No check-ins found" />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th><span className="status-dot live" style={{ marginRight: 6 }} />Status</th>
                                    <th>Caregiver</th>
                                    <th>Patient</th>
                                    <th>Address</th>
                                    <th>Shift Start</th>
                                    <th>Shift End</th>
                                    <th>Tasks Done</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((c) => (
                                    <tr key={c.id}>
                                        <td>
                                            {c.checkedIn ? (
                                                <span className="badge badge-success">Checked In</span>
                                            ) : c.checkOutTime ? (
                                                <span className="badge badge-default">Completed</span>
                                            ) : (
                                                <span className="badge badge-warning">Scheduled</span>
                                            )}
                                        </td>
                                        <td>{c.profile?.employeeId || c.profile?.phone || '—'}</td>
                                        <td>{c.patientName}</td>
                                        <td>{c.address}</td>
                                        <td>{new Date(c.shiftStart).toLocaleString()}</td>
                                        <td>{new Date(c.shiftEnd).toLocaleString()}</td>
                                        <td>{c.tasks?.filter((t) => t.done).length || 0} / {c.tasks?.length || 0}</td>
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
