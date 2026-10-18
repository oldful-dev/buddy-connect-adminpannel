import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Eye, Pencil, X } from 'lucide-react';
import { checkInAPI } from '../lib/api';
import { Pagination, Loading, EmptyState, ErrorState, SearchBar, MapLink, Value, apiError } from '../components/ui';

const TABS = [
    { id: '', label: 'All' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'checked_in', label: 'Checked In' },
    { id: 'completed', label: 'Completed' },
];

const ROLES = ['Nurse', 'Caregiver', 'Attendant', 'Physiotherapist', 'Home Health Aide'];

export function CheckInStatusBadge({ c }) {
    if (c.checkedIn) return <span className="badge badge-success">Checked In</span>;
    if (c.checkOutTime) return <span className="badge badge-default">Completed</span>;
    return <span className="badge badge-warning">Scheduled</span>;
}

// A cell that never forces the table wider: long values wrap on small screens
// and are clamped on wide ones, with the full text on hover.
const cellStyle = { maxWidth: 220, overflowWrap: 'anywhere', whiteSpace: 'normal' };

export default function CheckIns() {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState({});
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const status = params.get('status') || '';
    const [search, setSearch] = useState(params.get('search') || '');
    const [from, setFrom] = useState(params.get('from') || '');
    const [to, setTo] = useState(params.get('to') || '');
    const [category, setCategory] = useState(params.get('category') || '');

    const load = useCallback((page = 1) => {
        setLoading(true);
        setError('');
        checkInAPI.getAll({
            page, limit: 20,
            status: status || undefined, search: search || undefined,
            from: from || undefined, to: to || undefined, category: category || undefined,
        })
            .then((res) => {
                setRows(res.data.data);
                setCounts(res.data.counts || {});
                setPagination(res.data.pagination);
            })
            .catch((err) => setError(apiError(err, 'Could not load check-ins')))
            .finally(() => setLoading(false));
    }, [status, search, from, to, category]);

    useEffect(() => { load(1); }, [load]);

    const setStatus = (id) => {
        const next = new URLSearchParams(params);
        if (id) next.set('status', id); else next.delete('status');
        setParams(next, { replace: true });
    };

    const hasFilters = !!(search || from || to || category);
    const clearFilters = () => { setSearch(''); setFrom(''); setTo(''); setCategory(''); };

    return (
        <>
            <div className="page-header">
                <h2>Check-Ins</h2>
                <p>Ayuxa Buddy — live and historical caregiver shifts</p>
            </div>

            <div className="tabs" style={{ flexWrap: 'wrap' }}>
                {TABS.map((t) => (
                    <div key={t.id || 'all'} className={`tab ${status === t.id ? 'active' : ''}`} onClick={() => setStatus(t.id)}>
                        {t.label}{counts[t.id || 'all'] !== undefined ? ` (${counts[t.id || 'all']})` : ''}
                    </div>
                ))}
            </div>

            <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: '2 1 240px' }}>
                    <SearchBar value={search} onChange={setSearch} placeholder="Search patient, caregiver name, email, phone, address…" />
                </div>
                <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
                    <label className="form-label">From</label>
                    <input type="date" className="form-input" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
                    <label className="form-label">To</label>
                    <input type="date" className="form-input" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0, flex: '1 1 170px' }}>
                    <label className="form-label">Category</label>
                    <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">All roles</option>
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                {hasFilters && (
                    <button className="btn btn-secondary" onClick={clearFilters}><X size={14} /> Clear filters</button>
                )}
            </div>

            <div className="card">
                {loading ? <Loading />
                    : error ? <ErrorState message={error} onRetry={() => load(1)} />
                    : rows.length === 0 ? <EmptyState icon={ClipboardList} title="No check-ins found" subtitle={hasFilters ? 'Try clearing the filters.' : undefined} />
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Caregiver</th>
                                        <th>Patient</th>
                                        <th>Category</th>
                                        <th>Address</th>
                                        <th>Shift</th>
                                        <th>Tasks</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((c) => (
                                        <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/check-ins/${c.id}`)}>
                                            <td><CheckInStatusBadge c={c} /></td>
                                            <td style={cellStyle}>
                                                <div style={{ fontWeight: 600 }}><Value>{c.caregiver?.name}</Value></div>
                                                <div className="text-muted text-xs" title={c.caregiver?.email || ''}>{c.caregiver?.email || c.profile?.phone}</div>
                                            </td>
                                            <td style={cellStyle}>
                                                <div>{c.patientName}</div>
                                                <div className="text-muted text-xs">{c.patientCode}</div>
                                            </td>
                                            <td><Value missing="Not set">{c.caregiverRole}</Value></td>
                                            <td style={cellStyle} title={c.address}>
                                                <Value missing="No address">{c.address}</Value>
                                                {c.address && <MapLink address={c.address} />}
                                            </td>
                                            <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>
                                                <div>{new Date(c.shiftStart).toLocaleString()}</div>
                                                <div className="text-muted">→ {new Date(c.shiftEnd).toLocaleString()}</div>
                                            </td>
                                            <td>{c.tasks?.filter((t) => t.done).length || 0} / {c.tasks?.length || 0}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/check-ins/${c.id}`)} title="View"><Eye size={13} /> View</button>
                                                    {!c.checkOutTime && (
                                                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/check-ins/${c.id}?edit=1`)} title="Edit"><Pencil size={13} /> Edit</button>
                                                    )}
                                                </div>
                                            </td>
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
