import { useEffect, useState, useCallback } from 'react';
import { LogOut, Activity } from 'lucide-react';
import { sessionAPI } from '../lib/api';
import { Loading, EmptyState } from '../components/ui';

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
        { key: 'admin', label: 'Admin Sessions', rows: data.adminSessions, nameFn: (s) => s.admin?.name, subFn: (s) => s.admin?.email },
        { key: 'caregiver', label: 'Caregiver Sessions (Buddy)', rows: data.caregiverSessions, nameFn: (s) => s.profile?.acknowledgementId, subFn: (s) => s.profile?.phone },
        { key: 'family', label: 'Family Sessions (Connect)', rows: data.familyAccountSessions, nameFn: (s) => s.account?.name || 'Unnamed', subFn: (s) => s.account?.phone },
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
                                    <tr><th>User</th><th>Device</th><th>IP</th><th>Last Active</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {g.rows.map((s) => (
                                        <tr key={s.id}>
                                            <td>{g.nameFn(s) || '—'} <span className="text-muted text-xs">{g.subFn(s)}</span></td>
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
