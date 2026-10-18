import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { familyAccountAPI } from '../lib/api';
import { SearchBar, Pagination, Loading, EmptyState, Value } from '../components/ui';

export default function FamilyAccounts() {
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const load = useCallback((page = 1) => {
        setLoading(true);
        familyAccountAPI.getAll({ page, limit: 20, search })
            .then((res) => {
                setRows(res.data.data);
                setPagination(res.data.pagination);
            })
            .finally(() => setLoading(false));
    }, [search]);

    useEffect(() => { load(1); }, [load]);

    return (
        <>
            <div className="page-header">
                <h2>Family Accounts</h2>
                <p>Ayuxa Connect — family members linked to patients</p>
            </div>

            <div className="filter-bar">
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email…" />
            </div>

            <div className="card">
                {loading ? (
                    <Loading />
                ) : rows.length === 0 ? (
                    <EmptyState icon={Users} title="No family accounts found" />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Email</th>
                                    <th>Linked Patients</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((a) => (
                                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/family-accounts/${a.id}`)}>
                                        <td><Value>{a.name}</Value></td>
                                        <td>{a.phone}</td>
                                        <td><Value>{a.email}</Value></td>
                                        <td>{a.links?.length || 0}</td>
                                        <td>{new Date(a.createdAt).toLocaleDateString()}</td>
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
