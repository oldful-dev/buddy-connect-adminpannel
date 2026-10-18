import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, ExternalLink } from 'lucide-react';
import { checkInAPI } from '../lib/api';
import { Loading, ErrorState, MapLink, Value, apiError } from '../components/ui';
import { CheckInStatusBadge } from './CheckIns';

const toLocalInput = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Row = ({ label, children }) => (
    <div style={{ display: 'flex', gap: 12, padding: '6px 0', flexWrap: 'wrap' }}>
        <div className="text-muted" style={{ width: 150, flexShrink: 0 }}>{label}</div>
        <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{children}</div>
    </div>
);

export default function CheckInDetail() {
    const { checkInId } = useParams();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const editing = params.get('edit') === '1';

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        checkInAPI.getById(checkInId)
            .then((res) => setData(res.data.data))
            .catch((err) => setError(apiError(err, 'Could not load this check-in')))
            .finally(() => setLoading(false));
    }, [checkInId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!data) return;
        const c = data.checkIn;
        setForm({
            address: c.address || '',
            caregiverRole: c.caregiverRole || '',
            scopeOfWork: c.scopeOfWork || '',
            shiftStart: toLocalInput(c.shiftStart),
            shiftEnd: toLocalInput(c.shiftEnd),
            tasks: (c.tasks || []).map((t) => t.title).join('\n'),
        });
    }, [data]);

    const setEditing = (on) => {
        const next = new URLSearchParams(params);
        if (on) next.set('edit', '1'); else next.delete('edit');
        setParams(next, { replace: true });
        setFormError('');
    };

    const save = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.address.trim()) { setFormError('Address is required.'); return; }
        if (new Date(form.shiftEnd) <= new Date(form.shiftStart)) { setFormError('Shift end must be after shift start.'); return; }
        setSaving(true);
        try {
            await checkInAPI.update(checkInId, {
                address: form.address, caregiverRole: form.caregiverRole, scopeOfWork: form.scopeOfWork,
                shiftStart: new Date(form.shiftStart).toISOString(), shiftEnd: new Date(form.shiftEnd).toISOString(),
                tasks: form.tasks.split('\n').map((t) => t.trim()).filter(Boolean),
            });
            setEditing(false);
            load();
        } catch (err) {
            setFormError(apiError(err, 'Could not save changes'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;
    if (error || !data) return <ErrorState message={error || 'Check-in not found'} onRetry={load} />;

    const { checkIn: c, caregiver, patient } = data;
    const locked = !!c.checkOutTime;

    return (
        <>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate('/check-ins')}>
                <ArrowLeft size={14} /> Back to check-ins
            </button>

            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h2>{c.patientName}</h2>
                    <p><CheckInStatusBadge c={c} /> · {c.patientCode}</p>
                </div>
                {!locked && !editing && (
                    <button className="btn btn-primary" onClick={() => setEditing(true)}><Pencil size={14} /> Edit</button>
                )}
            </div>

            {editing && form && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Edit assignment</h3></div>
                    <form className="card-body" onSubmit={save}>
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <textarea className="form-textarea" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Category / role</label>
                                <input className="form-input" value={form.caregiverRole} onChange={(e) => setForm({ ...form, caregiverRole: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Scope of work</label>
                                <input className="form-input" value={form.scopeOfWork} onChange={(e) => setForm({ ...form, scopeOfWork: e.target.value })} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Shift start</label>
                                <input type="datetime-local" className="form-input" value={form.shiftStart} onChange={(e) => setForm({ ...form, shiftStart: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Shift end</label>
                                <input type="datetime-local" className="form-input" value={form.shiftEnd} onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tasks (one per line)</label>
                            <textarea className="form-textarea" rows={4} value={form.tasks} onChange={(e) => setForm({ ...form, tasks: e.target.value })} />
                        </div>
                        {formError && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{formError}</div>}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Visit</h3></div>
                    <div className="card-body">
                        <Row label="Category"><Value missing="Not set">{c.caregiverRole}</Value></Row>
                        <Row label="Scope of work"><Value missing="Not set">{c.scopeOfWork}</Value></Row>
                        <Row label="Address"><Value missing="No address">{c.address}</Value> <MapLink address={c.address} /></Row>
                        <Row label="Shift">{new Date(c.shiftStart).toLocaleString()} → {new Date(c.shiftEnd).toLocaleString()}</Row>
                        <Row label="Checked in">{c.checkInTime ? new Date(c.checkInTime).toLocaleString() : '—'}</Row>
                        <Row label="Checked out">{c.checkOutTime ? new Date(c.checkOutTime).toLocaleString() : '—'}</Row>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>People</h3></div>
                    <div className="card-body">
                        <Row label="Caregiver">
                            {caregiver ? <a href={`/caregivers/${caregiver.id}`} onClick={(e) => { e.preventDefault(); navigate(`/caregivers/${caregiver.id}`); }}>{caregiver.name || 'Unnamed'}</a> : '—'}
                        </Row>
                        <Row label="Caregiver email"><Value>{caregiver?.email}</Value></Row>
                        <Row label="Caregiver phone">{caregiver?.phone || c.profile?.phone || '—'}</Row>
                        <Row label="Patient">
                            {patient ? <a href={`/patients/${patient.id}`} onClick={(e) => { e.preventDefault(); navigate(`/patients/${patient.id}`); }}>{patient.name}</a> : c.patientName}
                        </Row>
                        <Row label="Patient phone">{patient?.phone || c.mobile || '—'}</Row>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Tasks ({c.tasks?.filter((t) => t.done).length || 0} / {c.tasks?.length || 0} done)</h3></div>
                <div className="card-body">
                    {c.tasks?.length ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {c.tasks.map((t) => <li key={t.id} style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text-muted)' : undefined }}>{t.title}</li>)}
                        </ul>
                    ) : <span className="text-muted">No tasks assigned.</span>}
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: 24 }}>
                <div className="card">
                    <div className="card-header"><h3>Check-out report</h3></div>
                    <div className="card-body">
                        <Row label="Blood pressure">{c.vitalsBp || '—'}</Row>
                        <Row label="Pulse">{c.vitalsPulse || '—'}</Row>
                        <Row label="Temperature">{c.vitalsTemp || '—'}</Row>
                        <Row label="Care summary"><span style={{ whiteSpace: 'pre-wrap' }}>{c.careSummary || '—'}</span></Row>
                        <Row label="Comments">{c.checkoutComments || '—'}</Row>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Selfies</h3></div>
                    <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        {[['Check-in', c.checkInSelfieUrl], ['Check-out', c.checkOutSelfieUrl]].map(([label, url]) => (
                            <div key={label}>
                                <div className="text-muted text-xs" style={{ marginBottom: 6 }}>{label}</div>
                                {url ? (
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        <img src={url} alt={`${label} selfie`} style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border-color)' }} />
                                        <div className="text-xs"><ExternalLink size={11} /> Open</div>
                                    </a>
                                ) : <span className="text-muted">Not taken</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
