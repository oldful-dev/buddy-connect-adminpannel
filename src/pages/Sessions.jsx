import { useEffect, useState, useCallback, Fragment } from 'react';
import { LogOut, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { sessionAPI } from '../lib/api';
import { Loading, EmptyState, ErrorState, Value, apiError } from '../components/ui';

/** Sessions of one user collapse into a single row; expand to see each device. */
function groupByUser(rows) {
    const map = new Map();
    for (const s of rows) {
        const key = s.user?.email || s.user?.phone || s.user?.name || s.id;
        if (!map.has(key)) map.set(key, { key, user: s.user || {}, sessions: [] });
        map.get(key).sessions.push(s);
    }
    return [...map.values()];
}

export default function Sessions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [open, setOpen] = useState({});

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        sessionAPI.getAll()
            .then((res) => setData(res.data.data))
            .catch((err) => setError(apiError(err, 'Could not load sessions')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const terminate = async (model, id) => {
        try {
            await sessionAPI.terminate(model, id);
            await load();
        } catch (err) {
            setError(apiError(err, 'Could not end the session'));
        }
    };

    if (loading) return <Loading />;
    if (error && !data) return <ErrorState message={error} onRetry={load} />;
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
                <p>{data.totalActive} active session{data.totalActive === 1 ? '' : 's'} across all apps — one row per user</p>
            </div>
            {error && <div style={{ color: 'var(--accent-danger)', marginBottom: 12 }}>{error}</div>}

            {groups.map((g) => {
                const users = groupByUser(g.rows);
                return (
                    <div key={g.key} className="card" style={{ marginBottom: 24 }}>
                        <div className="card-header"><h3>{g.label}</h3></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {users.length === 0 ? (
                                <EmptyState icon={Activity} title="No active sessions" />
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr><th style={{ width: 36 }}></th><th>Name</th><th>Email</th><th>Phone</th><th>Sessions</th><th>Last Active</th></tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => {
                                                const id = `${g.key}:${u.key}`;
                                                const isOpen = !!open[id];
                                                const last = u.sessions.reduce((a, s) => (new Date(s.lastActiveAt) > new Date(a) ? s.lastActiveAt : a), u.sessions[0].lastActiveAt);
                                                return (
                                                    <Fragment key={id}>
                                                        <tr style={{ cursor: 'pointer' }} onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}>
                                                            <td>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
                                                            <td><Value>{u.user.name}</Value></td>
                                                            <td style={{ overflowWrap: 'anywhere' }}><Value>{u.user.email}</Value></td>
                                                            <td>{g.key === 'admin' ? <span className="text-muted">—</span> : <Value>{u.user.phone}</Value>}</td>
                                                            <td><span className="badge badge-purple">{u.sessions.length}</span></td>
                                                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(last).toLocaleString()}</td>
                                                        </tr>
                                                        {isOpen && u.sessions.map((s) => (
                                                            <tr key={s.id} style={{ background: 'var(--bg-glass)' }}>
                                                                <td></td>
                                                                <td colSpan={2}>{s.deviceType || '—'} · {s.ipAddress || '—'}</td>
                                                                <td colSpan={2} className="text-muted text-xs">Started {new Date(s.createdAt || s.lastActiveAt).toLocaleString()}</td>
                                                                <td>
                                                                    <button className="btn btn-secondary btn-sm" title="Force logout" onClick={(e) => { e.stopPropagation(); terminate(g.key, s.id); }}>
                                                                        <LogOut size={13} /> End
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
