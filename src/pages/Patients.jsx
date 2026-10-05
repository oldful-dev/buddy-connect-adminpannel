import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import { patientAPI } from '../lib/api';
import { SearchBar, StatusBadge, Pagination, Loading, EmptyState } from '../components/ui';

export default function Patients() {
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const load = useCallback((page = 1) => {
        setLoading(true);
        patientAPI.getAll({ page, limit: 20, search })
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
                <h2>Patients</h2>
                <p>Medico patients — Ayuxa Connect's family linking source of truth</p>
            </div>

            <div className="filter-bar">
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, or Ayuxa ID…" />
            </div>

            <div className="card">
                {loading ? (
                    <Loading />
                ) : rows.length === 0 ? (
                    <EmptyState icon={HeartHandshake} title="No patients found" />
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Ayuxa ID</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((p) => (
                                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${p.id}`)}>
                                        <td>{p.name || '—'}</td>
                                        <td>{p.uniqueUserId}</td>
                                        <td>{p.phone}</td>
                                        <td><StatusBadge status={p.status} /></td>
                                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
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
