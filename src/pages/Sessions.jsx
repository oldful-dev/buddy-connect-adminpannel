import { useEffect, useState, useCallback } from 'react';
import { LogOut, Activity } from 'lucide-react';
import { sessionAPI } from '../lib/api';
import { Loading, EmptyState, Value } from '../components/ui';

export default function Sessions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        sessionAPI.getAll().then((res) => setData(res.data.data)).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const terminate = async (model, id) => {
        await sessionAPI.terminate(model, id);
        await load();
    };

    if (loading) return <Loading />;
    if (!data) return null;

    const groups = [
        { key: 'admin', label: 'Admin Sessions', rows: data.adminSessions },
        { key: 'caregiver', label: 'Caregiver Sessions (Buddy)', rows: data.caregiverSessions },
        { key: 'family', label: 'Family Sessions (Connect)', rows: data.familyAccountSessions },
    ];

    return (
        <>
            <div className="page-header">
                <h2>Active Sessions</h2>
                <p>{data.totalActive} active session{data.totalActive === 1 ? '' : 's'} across all apps</p>
            </div>

            {groups.map((g) => (
                <div key={g.key} className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>{g.label}</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {g.rows.length === 0 ? (
                            <EmptyState icon={Activity} title="No active sessions" />
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr><th>Name</th><th>Email</th><th>Phone</th><th>Device</th><th>IP</th><th>Last Active</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {g.rows.map((s) => (
                                        <tr key={s.id}>
                                            <td><Value>{s.user?.name}</Value></td>
                                            <td><Value>{s.user?.email}</Value></td>
                                            <td>{g.key === 'admin' ? <span className="text-muted">—</span> : <Value>{s.user?.phone}</Value>}</td>
                                            <td>{s.deviceType || '—'}</td>
                                            <td>{s.ipAddress || '—'}</td>
                                            <td>{new Date(s.lastActiveAt).toLocaleString()}</td>
                                            <td>
                                                <button className="btn btn-icon btn-secondary" title="Force logout" onClick={() => terminate(g.key, s.id)}>
                                                    <LogOut size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
}
