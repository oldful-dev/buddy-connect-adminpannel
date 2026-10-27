import { useEffect, useState, useCallback } from 'react';
import { isValidName } from '../lib/validators';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Phone, Mail, MapPin, Calendar, CreditCard, UserPlus, Trash2, FileText, ExternalLink } from 'lucide-react';
import { caregiverAPI, checkInAPI } from '../lib/api';
import { StatusBadge, Loading } from '../components/ui';
import PatientPicker from '../components/PatientPicker';
import { apiError } from '../components/ui';

function DocLink({ label, uploaded, url }) {
    return (
        <div className="flex items-center gap-2" style={{ justifyContent: 'space-between' }}>
            <span className="flex items-center gap-2">
                <FileText size={14} className="text-muted" />
                {label}: {uploaded ? <span className="badge badge-success">Uploaded</span> : <span className="badge badge-default">Not uploaded</span>}
            </span>
            {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    <ExternalLink size={12} /> View
                </a>
            )}
        </div>
    );
}

const toLocalInputValue = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function AssignPatientForm({ caregiverId, defaultRole, onDone, onCancel }) {
    const [patient, setPatient] = useState(null);
    const [address, setAddress] = useState('');
    const [caregiverRole, setCaregiverRole] = useState(defaultRole || '');
    const [scopeOfWork, setScopeOfWork] = useState('');
    const now = new Date();
    const [shiftStart, setShiftStart] = useState(toLocalInputValue(now));
    const [shiftEnd, setShiftEnd] = useState(toLocalInputValue(new Date(now.getTime() + 8 * 3600 * 1000)));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (!patient) { setError('Select a patient first'); return; }
        setSaving(true);
        setError('');
        try {
            await caregiverAPI.createAssignment(caregiverId, {
                patientUserId: patient.id,
                address, caregiverRole, scopeOfWork,
                shiftStart: new Date(shiftStart).toISOString(),
                shiftEnd: new Date(shiftEnd).toISOString(),
            });
            onDone();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign patient');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Patient</label>
                <PatientPicker selected={patient} onSelect={setPatient} />
            </div>
            <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Caregiver Role</label>
                    <input className="form-input" value={caregiverRole} onChange={(e) => setCaregiverRole(e.target.value)} placeholder="e.g. Home Nurse" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Address</label>
                    <input className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Patient's visit address" />
                </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Scope of Work</label>
                <textarea className="form-textarea" style={{ minHeight: 70 }} value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} placeholder="e.g. Vitals monitoring, medication reminder, mobility assistance" />
            </div>
            <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Shift Start</label>
                    <input type="datetime-local" className="form-input" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Shift End</label>
                    <input type="datetime-local" className="form-input" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} required />
                </div>
            </div>
            {error && <div style={{ color: 'var(--accent-danger)', fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Assigning…' : 'Assign Patient'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}

export default function CaregiverDetail() {
    const { caregiverId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [editingContact, setEditingContact] = useState(false);
    const [contact, setContact] = useState({ name: '', email: '', jobRole: '' });
    const [contactError, setContactError] = useState('');
    const [savingContact, setSavingContact] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        caregiverAPI.getById(caregiverId).then((res) => setData(res.data.data)).finally(() => setLoading(false));
    }, [caregiverId]);

    useEffect(() => { load(); }, [load]);

    const setKyc = async (status) => {
        setUpdating(true);
        try {
            await caregiverAPI.setKyc(caregiverId, status);
            await load();
        } finally {
            setUpdating(false);
        }
    };

    const startEditContact = () => {
        setContact({ name: data.caregiver?.name || '', email: data.caregiver?.email || '', jobRole: data.profile.jobRole || '' });
        setContactError('');
        setEditingContact(true);
    };

    const saveContact = async (e) => {
        e.preventDefault();
        if (!isValidName(contact.name.trim())) { setContactError('Please enter a valid name containing only letters.'); return; }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.email.trim())) { setContactError('Please enter a valid email address.'); return; }
        if (!contact.jobRole) { setContactError('Please select a job role.'); return; }
        setSavingContact(true);
        setContactError('');
        try {
            await caregiverAPI.update(caregiverId, { name: contact.name.trim(), email: contact.email.trim(), jobRole: contact.jobRole });
            setEditingContact(false);
            await load();
        } catch (err) {
            setContactError(apiError(err, 'Could not save changes'));
        } finally {
            setSavingContact(false);
        }
    };

    const removeAssignment = async (checkInId) => {
        await checkInAPI.remove(checkInId);
        await load();
    };

    if (loading) return <Loading />;
    if (!data) return null;

    const { caregiver, profile, bookings } = data;

    return (
        <>
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
                <ArrowLeft size={14} /> Back
            </button>

            <div className="page-header">
                <h2>{caregiver?.name || 'Caregiver'}</h2>
                <p>Employee ID: {profile.employeeId || 'Not assigned yet'} · Acknowledgement: {profile.acknowledgementId}</p>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header">
                        <h3>Profile</h3>
                        {!editingContact && <button className="btn btn-secondary btn-sm" onClick={startEditContact}>Edit contact</button>}
                    </div>
                    {editingContact && (
                        <form className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }} onSubmit={saveContact}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" value={contact.name} maxLength={60} onChange={(e) => setContact({ ...contact, name: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Job role</label>
                                <select className="form-select" value={contact.jobRole} onChange={(e) => setContact({ ...contact, jobRole: e.target.value })} required>
                                    <option value="">Select a role</option>
                                    {['Nurse', 'Caregiver', 'Attendant', 'Physiotherapist', 'Home Health Aide'].map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            {contactError && <div style={{ color: 'var(--accent-danger)', fontSize: 13, marginBottom: 12 }}>{contactError}</div>}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={savingContact}>{savingContact ? 'Saving…' : 'Save'}</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingContact(false)} disabled={savingContact}>Cancel</button>
                            </div>
                        </form>
                    )}
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-muted" /> {caregiver?.phone || profile.phone}</div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-muted" /> {caregiver?.email || '—'}</div>
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-muted" /> {profile.presentAddress || '—'}</div>
                        <div className="flex items-center gap-2"><Calendar size={14} className="text-muted" /> DOB: {profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'}</div>
                        <div className="flex items-center gap-2"><CreditCard size={14} className="text-muted" /> Aadhaar: {profile.aadhaarNumber || '—'} {profile.aadhaarUploaded && <StatusBadge status="ACCEPTED" />}</div>
                        <div className="flex items-center gap-2"><CreditCard size={14} className="text-muted" /> PAN: {profile.panNumber || '—'} {profile.panUploaded && <StatusBadge status="ACCEPTED" />}</div>
                        <div>Job Role: <strong>{profile.jobRole || '—'}</strong></div>
                        <div>City: <strong>{caregiver?.cities?.name || '—'}</strong></div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>KYC Review</h3>
                        <StatusBadge status={profile.kycStatus} />
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <DocLink label="Aadhaar card" uploaded={profile.aadhaarUploaded} url={profile.aadhaarDocUrl} />
                        <DocLink label="PAN card" uploaded={profile.panUploaded} url={profile.panDocUrl} />
                        <DocLink label="Other documents" uploaded={profile.otherDocsUploaded} url={profile.otherDocsUrl} />
                        <DocLink label="PCC document" uploaded={profile.pccUploaded} url={profile.pccDocUrl} />
                        <div>Agreement accepted: {profile.agreementAccepted ? 'Yes' : 'No'}</div>
                        {profile.kycStatus === 'ACCEPTED' ? (
                            <div style={{ marginTop: 12 }}><span className="badge badge-success">KYC approved</span></div>
                        ) : (
                            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                <button className="btn btn-success" disabled={updating} onClick={() => setKyc('ACCEPTED')}>
                                    <Check size={14} /> {profile.kycStatus === 'REJECTED' ? 'Approve instead' : 'Approve'}
                                </button>
                                {profile.kycStatus !== 'REJECTED' && (
                                    <button className="btn btn-danger" disabled={updating} onClick={() => setKyc('REJECTED')}>
                                        <X size={14} /> Reject
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3>Assignments &amp; Check-Ins</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAssignForm((v) => !v)}>
                        <UserPlus size={14} /> Assign Patient
                    </button>
                </div>
                {showAssignForm && (
                    <div className="card-body" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <AssignPatientForm
                            caregiverId={caregiverId}
                            defaultRole={profile.jobRole}
                            onDone={() => { setShowAssignForm(false); load(); }}
                            onCancel={() => setShowAssignForm(false)}
                        />
                    </div>
                )}
                <div className="card-body" style={{ padding: 0 }}>
                    {profile.checkIns?.length ? (
                        <table className="data-table">
                            <thead>
                                <tr><th>Patient</th><th>Address</th><th>Shift Start</th><th>Status</th><th></th></tr>
                            </thead>
                            <tbody>
                                {profile.checkIns.map((c) => {
                                    const notStarted = !c.checkedIn && !c.checkOutTime;
                                    return (
                                        <tr key={c.id}>
                                            <td>{c.patientName}</td>
                                            <td>{c.address}</td>
                                            <td>{new Date(c.shiftStart).toLocaleString()}</td>
                                            <td>
                                                {c.checkedIn ? (
                                                    <span className="badge badge-success">Checked In</span>
                                                ) : c.checkOutTime ? (
                                                    <span className="badge badge-default">Completed</span>
                                                ) : (
                                                    <span className="badge badge-warning">Assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                {notStarted && (
                                                    <button className="btn btn-icon btn-secondary" title="Remove assignment" onClick={() => removeAssignment(c.id)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: 24, color: 'var(--text-muted)' }}>No check-ins yet. Assign a patient to get started.</div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Medico Bookings</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {bookings?.length ? (
                        <table className="data-table">
                            <thead>
                                <tr><th>Patient</th><th>Scheduled</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => (
                                    <tr key={b.id}>
                                        <td>{b.users?.name || '—'}</td>
                                        <td>{b.scheduledDate ? new Date(b.scheduledDate).toLocaleString() : '—'}</td>
                                        <td>{b.status || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: 24, color: 'var(--text-muted)' }}>No bookings yet.</div>
                    )}
                </div>
            </div>
        </>
    );
}
