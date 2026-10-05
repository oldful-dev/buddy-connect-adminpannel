import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Calendar } from 'lucide-react';
import { familyAccountAPI } from '../lib/api';
import { Loading } from '../components/ui';

export default function FamilyAccountDetail() {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        familyAccountAPI.getById(accountId).then((res) => setData(res.data.data)).finally(() => setLoading(false));
    }, [accountId]);

    useEffect(() => { load(); }, [load]);

    if (loading) return <Loading />;
    if (!data) return null;

    const { account, patients } = data;

    return (
        <>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
                <ArrowLeft size={14} /> Back
            </button>

            <div className="page-header">
                <h2>{account.name || 'Family Account'}</h2>
                <p>{account.phone}</p>
            </div>

            <div className="card">
                <div className="card-header"><h3>Account</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="flex items-center gap-2"><Phone size={14} className="text-muted" /> {account.phone}</div>
                    <div className="flex items-center gap-2"><Mail size={14} className="text-muted" /> {account.email || '—'}</div>
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-muted" /> Joined {new Date(account.createdAt).toLocaleDateString()}</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Linked Patients ({patients.length})</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {patients.length === 0 ? (
                        <div style={{ padding: 24, color: 'var(--text-muted)' }}>No patients linked yet.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr><th>Patient</th><th>Ayuxa ID</th><th>Relation</th><th>Can Edit</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {patients.map(({ link, patient }) => (
                                    <tr
                                        key={link.id}
                                        style={{ cursor: patient ? 'pointer' : 'default' }}
                                        onClick={() => patient && navigate(`/patients/${patient.id}`)}
                                    >
                                        <td>{patient?.name || 'Deleted / not found'}</td>
                                        <td>{patient?.uniqueUserId || '—'}</td>
                                        <td>{link.relation}</td>
                                        <td>{link.canEdit ? 'Yes' : 'No'}</td>
                                        <td>{patient?.status || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
