import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Phone, Calendar } from 'lucide-react';
import { patientAPI, careTeamAPI } from '../lib/api';
import { StatusBadge, Loading, ErrorState, MapLink, Value, apiError } from '../components/ui';

export default function PatientDetail() {
    const { patientUserId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({ name: '', role: '', phone: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [timelineFilter, setTimelineFilter] = useState('ALL');

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        patientAPI.getById(patientUserId)
            .then((res) => setData(res.data.data))
            .catch((err) => setError(apiError(err, 'Could not load this patient')))
            .finally(() => setLoading(false));
    }, [patientUserId]);

    useEffect(() => { load(); }, [load]);

    const addMember = async (e) => {
        e.preventDefault();
        if (!form.name || !form.role) return;
        setSaving(true);
        try {
            await patientAPI.addCareTeamMember(patientUserId, form);
            setForm({ name: '', role: '', phone: '' });
            setShowAddForm(false);
            await load();
        } finally {
            setSaving(false);
        }
    };

    const removeMember = async (memberId) => {
        await careTeamAPI.remove(memberId);
        await load();
    };

    if (loading) return <Loading />;
    if (error || !data) return <ErrorState message={error || 'Patient not found'} onRetry={load} />;

    const { patient, careTeam, serviceVisits, uploads, linkedFamilyAccounts, checkIns = [], healthReports = [], caregiverUploads = [], timeline = [], defaultAddress } = data;
    const TYPES = ['ALL', ...new Set(timeline.map((e) => e.type))];
    const shownTimeline = timelineFilter === 'ALL' ? timeline : timeline.filter((e) => e.type === timelineFilter);

    return (
        <>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
                <ArrowLeft size={14} /> Back
            </button>

            <div className="page-header">
                <h2>{patient.name || 'Patient'}</h2>
                <p>{patient.uniqueUserId} · <StatusBadge status={patient.status} /></p>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Patient</h3></div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-muted" /> {patient.phone}</div>
                        <div>Email: <Value>{patient.email}</Value></div>
                        <div className="flex items-center gap-2"><Calendar size={14} className="text-muted" /> DOB: {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}</div>
                        <div>Health Tag: {patient.healthTag}</div>
                        <div>Address: <Value missing="No saved address">{defaultAddress?.text}</Value> <MapLink address={defaultAddress?.text} /></div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Linked Family Accounts ({linkedFamilyAccounts.length})</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {linkedFamilyAccounts.length === 0 ? (
                            <div style={{ padding: 24, color: 'var(--text-muted)' }}>No family members linked yet.</div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Phone</th><th>Relation</th></tr></thead>
                                <tbody>
                                    {linkedFamilyAccounts.map((l) => (
                                        <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/family-accounts/${l.account.id}`)}>
                                            <td>{l.account.name || '—'}</td>
                                            <td>{l.account.phone}</td>
                                            <td>{l.relation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3>Care Team ({careTeam.length})</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm((v) => !v)}>
                        <Plus size={14} /> Add Member
                    </button>
                </div>
                {showAddForm && (
                    <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <form onSubmit={addMember} className="form-row-3" style={{ alignItems: 'end' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Name</label>
                                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Role</label>
                                <input className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Home Nurse" required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Phone</label>
                                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving} style={{ gridColumn: 'span 3', justifyContent: 'center' }}>
                                {saving ? 'Adding…' : 'Add to Care Team'}
                            </button>
                        </form>
                    </div>
                )}
                <div className="card-body" style={{ padding: 0 }}>
                    {careTeam.length === 0 ? (
                        <div style={{ padding: 24, color: 'var(--text-muted)' }}>No care team members yet.</div>
                    ) : (
                        <table className="data-table">
                            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th></th></tr></thead>
                            <tbody>
                                {careTeam.map((m) => (
                                    <tr key={m.id}>
                                        <td>{m.name}</td>
                                        <td>{m.role}</td>
                                        <td>{m.phone || '—'}</td>
                                        <td>
                                            <button className="btn btn-icon btn-secondary" onClick={() => removeMember(m.id)} title="Remove">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: 24 }}>
                <div className="card">
                    <div className="card-header"><h3>Service History ({serviceVisits.length})</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {serviceVisits.length === 0 ? (
                            <div style={{ padding: 24, color: 'var(--text-muted)' }}>No visits recorded.</div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Provider</th><th>Date</th></tr></thead>
                                <tbody>
                                    {serviceVisits.map((v) => (
                                        <tr key={v.id}>
                                            <td>{v.providerName}</td>
                                            <td>{new Date(v.visitDate).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Uploads ({uploads.length})</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {uploads.length === 0 ? (
                            <div style={{ padding: 24, color: 'var(--text-muted)' }}>No uploads yet.</div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>File</th><th>Category</th><th>Source</th></tr></thead>
                                <tbody>
                                    {uploads.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.fileName}</td>
                                            <td>{u.category}</td>
                                            <td>{u.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Visit history — check-ins ({checkIns.length})</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {checkIns.length === 0 ? (
                        <div style={{ padding: 24, color: 'var(--text-muted)' }}>No caregiver visits yet.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Status</th><th>Caregiver</th><th>Category</th><th>Shift</th><th>Checked in / out</th><th>Summary</th></tr></thead>
                                <tbody>
                                    {checkIns.map((c) => (
                                        <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/check-ins/${c.id}`)}>
                                            <td>{c.checkedIn ? <span className="badge badge-success">Checked In</span> : c.checkOutTime ? <span className="badge badge-default">Completed</span> : <span className="badge badge-warning">Scheduled</span>}</td>
                                            <td>{c.caregiverName}</td>
                                            <td>{c.caregiverRole || '—'}</td>
                                            <td className="text-xs" style={{ whiteSpace: 'nowrap' }}>{new Date(c.shiftStart).toLocaleString()}</td>
                                            <td className="text-xs">{c.checkInTime ? new Date(c.checkInTime).toLocaleString() : '—'}<br />{c.checkOutTime ? new Date(c.checkOutTime).toLocaleString() : '—'}</td>
                                            <td style={{ maxWidth: 260, overflowWrap: 'anywhere' }} className="text-xs">{c.careSummary || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: 24 }}>
                <div className="card">
                    <div className="card-header"><h3>Medical records ({healthReports.length})</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {healthReports.length === 0 ? (
                            <div style={{ padding: 24, color: 'var(--text-muted)' }}>No medical records on file.</div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Report</th><th>Type</th><th>Date</th><th>Flag</th></tr></thead>
                                <tbody>
                                    {healthReports.map((r) => (
                                        <tr key={r.id}>
                                            <td style={{ overflowWrap: 'anywhere' }}>{r.title}</td>
                                            <td>{r.fileType}</td>
                                            <td>{new Date(r.reportDate).toLocaleDateString()}</td>
                                            <td>{r.flagSeverity ? <span className="badge badge-warning" title={r.flagNote || ''}>{r.flagSeverity}</span> : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Documents from caregivers ({caregiverUploads.length})</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {caregiverUploads.length === 0 ? (
                            <div style={{ padding: 24, color: 'var(--text-muted)' }}>No documents uploaded by caregivers.</div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>File</th><th>Category</th><th>By</th><th>Date</th></tr></thead>
                                <tbody>
                                    {caregiverUploads.map((u) => (
                                        <tr key={u.id}>
                                            <td style={{ overflowWrap: 'anywhere' }}>{u.fileName}</td>
                                            <td>{u.category}</td>
                                            <td>{u.uploadedBy}</td>
                                            <td>{new Date(u.uploadedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
                    <h3>Activity timeline ({shownTimeline.length})</h3>
                    <select className="form-select" style={{ maxWidth: 220 }} value={timelineFilter} onChange={(e) => setTimelineFilter(e.target.value)}>
                        {TYPES.map((t) => <option key={t} value={t}>{t === 'ALL' ? 'All activity' : t.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div className="card-body">
                    {shownTimeline.length === 0 ? (
                        <span className="text-muted">No activity recorded yet.</span>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {shownTimeline.map((e, i) => (
                                <li key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                                    <div className="text-muted text-xs" style={{ width: 140, flexShrink: 0 }}>{new Date(e.at).toLocaleString()}</div>
                                    <div style={{ minWidth: 0 }}>
                                        <span className="badge badge-purple" style={{ marginRight: 8 }}>{e.type.replace(/_/g, ' ')}</span>
                                        <strong>{e.title}</strong>
                                        {e.detail && <div className="text-muted text-xs" style={{ overflowWrap: 'anywhere' }}>{e.detail}</div>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}
