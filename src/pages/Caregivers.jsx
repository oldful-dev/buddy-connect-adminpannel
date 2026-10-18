import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { caregiverAPI } from '../lib/api';
import { SearchBar, StatusBadge, Pagination, Loading, EmptyState, Value } from '../components/ui';
import { HeartHandshake } from 'lucide-react';

export default function Caregivers() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const kycStatus = searchParams.get('kycStatus') || '';
    const navigate = useNavigate();

    const load = useCallback((page = 1) => {
        setLoading(true);
        caregiverAPI.getAll({ page, limit: 20, search, kycStatus: kycStatus || undefined })
            .then((res) => {
                setRows(res.data.data);
                setPagination(res.data.pagination);
            })
            .finally(() => setLoading(false));
    }, [search, kycStatus]);

    useEffect(() => { load(1); }, [load]);

    return (
        <>
            <div className="page-header">
                <h2>Caregivers</h2>
                <p>Ayuxa Buddy — caregiver directory &amp; KYC status</p>
            </div>

            <div className="filter-bar">
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email…" />
                <select
                    className="form-select"
                    value={kycStatus}
                    onChange={(e) => setSearchParams(e.target.value ? { kycStatus: e.target.value } : {})}
                >
                    <option value="">All KYC statuses</option>
                    <option value="NOT_SUBMITTED">Not Submitted</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <div className="card">
                {loading ? (
                    <Loading />
                ) : rows.length === 0 ? (
                    <EmptyState icon={HeartHandshake} title="No caregivers found" subtitle="Try a different search or filter." />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Employee ID</th>
                                    <th>Job Role</th>
                                    <th>KYC Status</th>
                                    <th>City</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(({ caregiver, profile }) => (
                                    <tr key={profile.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/caregivers/${caregiver?.id || profile.caregiverId}`)}>
                                        <td><Value>{caregiver?.name}</Value></td>
                                        <td>{caregiver?.phone || profile.phone}</td>
                                        <td>{profile.employeeId || '—'}</td>
                                        <td><Value missing="Role missing">{profile.jobRole}</Value></td>
                                        <td><StatusBadge status={profile.kycStatus} /></td>
                                        <td><Value>{caregiver?.cities?.name}</Value></td>
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
