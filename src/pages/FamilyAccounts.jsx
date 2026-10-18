import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Eye, X } from 'lucide-react';
import { familyAccountAPI } from '../lib/api';
import { SearchBar, Pagination, Loading, EmptyState, ErrorState, Value, apiError } from '../components/ui';

const FILTERS = [
    { id: '', label: 'All accounts' },
    { id: 'linked', label: 'Linked to a patient' },
    { id: 'unlinked', label: 'Not linked yet' },
    { id: 'missing_name', label: 'Missing name' },
    { id: 'missing_email', label: 'Missing email' },
];

const SORTS = [
    { id: 'newest', label: 'Newest first' },
    { id: 'oldest', label: 'Oldest first' },
    { id: 'name_asc', label: 'Name A–Z' },
    { id: 'name_desc', label: 'Name Z–A' },
    { id: 'patients', label: 'Most linked patients' },
];

export default function FamilyAccounts() {
    const [params] = useSearchParams();
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(params.get('filter') || '');
    const [sort, setSort] = useState('newest');
    const navigate = useNavigate();

    const load = useCallback((page = 1) => {
        setLoading(true);
        setError('');
        familyAccountAPI.getAll({ page, limit: 20, search: search || undefined, filter: filter || undefined, sort })
            .then((res) => {
                setRows(res.data.data);
                setPagination(res.data.pagination);
            })
            .catch((err) => setError(apiError(err, 'Could not load family accounts')))
            .finally(() => setLoading(false));
    }, [search, filter, sort]);

    useEffect(() => { load(1); }, [load]);

    const hasFilters = !!(search || filter || sort !== 'newest');

    return (
        <>
            <div className="page-header">
                <h2>Family Accounts</h2>
                <p>Ayuxa Connect — family members linked to patients</p>
            </div>

            <div className="filter-bar" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: '2 1 240px' }}>
                    <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email…" />
                </div>
                <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
                    <label className="form-label">Filter</label>
                    <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                        {FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
                    <label className="form-label">Sort by</label>
                    <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                        {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
                {hasFilters && (
                    <button className="btn btn-secondary" onClick={() => { setSearch(''); setFilter(''); setSort('newest'); }}>
                        <X size={14} /> Clear
                    </button>
                )}
            </div>

            <div className="card">
                {loading ? <Loading />
                    : error ? <ErrorState message={error} onRetry={() => load(1)} />
                    : rows.length === 0 ? <EmptyState icon={Users} title="No family accounts found" />
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Email</th>
                                        <th>Linked Patients</th>
                                        <th>Joined</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((a) => (
                                        <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/family-accounts/${a.id}`)}>
                                            <td><Value>{a.name}</Value></td>
                                            <td>{a.phone}</td>
                                            <td style={{ overflowWrap: 'anywhere', maxWidth: 220 }}><Value>{a.email}</Value></td>
                                            <td>{a.links?.length || 0}</td>
                                            <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/family-accounts/${a.id}`)}>
                                                    <Eye size={13} /> View
                                                </button>
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
