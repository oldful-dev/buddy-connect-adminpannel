import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Check, X, ExternalLink } from 'lucide-react';
import { caregiverAPI } from '../lib/api';
import { SearchBar, Pagination, Loading, EmptyState, ErrorState, StatusBadge, Value, ConfirmDialog, apiError } from '../components/ui';

const TABS = [
    { id: 'PENDING_VERIFICATION', label: 'Pending' },
    { id: 'ACCEPTED', label: 'Approved' },
    { id: 'REJECTED', label: 'Rejected' },
];

function DocButton({ label, url, uploaded }) {
    if (!uploaded && !url) return <span className="badge badge-default" title={`${label} not uploaded`}>{label}: —</span>;
    if (!url) return <span className="badge badge-warning" title="Marked uploaded but no file is stored">{label}: no file</span>;
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" onClick={(e) => e.stopPropagation()}>
            <ExternalLink size={12} /> {label}
        </a>
    );
}

/** Hours a submission has been waiting for review (since its last change). */
const hoursWaiting = (profile) => Math.max(0, Math.floor((Date.now() - new Date(profile.updatedAt).getTime()) / 3600000));

function Waiting({ profile }) {
    if (profile.kycStatus !== 'PENDING_VERIFICATION') return null;
    const h = hoursWaiting(profile);
    const late = h >= 4;
    return (
        <div style={{ marginTop: 4 }}>
            <span className={`badge ${late ? 'badge-danger' : 'badge-default'}`} title="Time since this submission was last updated">
                {h < 1 ? 'Waiting < 1h' : `Waiting ${h}h`}{late ? ' — review now' : ''}
            </span>
        </div>
    );
}

export default function Kyc() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('PENDING_VERIFICATION');
    const [search, setSearch] = useState('');
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [confirm, setConfirm] = useState(null); // { row, status }
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState('');

    const load = useCallback((page = 1) => {
        setLoading(true);
        setError('');
        caregiverAPI.getAll({ page, limit: 20, search: search || undefined, kycStatus: tab })
            .then((res) => {
                // Oldest submissions first so nothing sits unreviewed.
                const data = res.data.data;
                setRows(tab === 'PENDING_VERIFICATION' ? [...data].sort((a, b) => new Date(a.profile.updatedAt) - new Date(b.profile.updatedAt)) : data);
                setPagination(res.data.pagination);
            })
            .catch((err) => setError(apiError(err, 'Could not load the KYC queue')))
            .finally(() => setLoading(false));
    }, [tab, search]);

    useEffect(() => { load(1); }, [load]);

    const decide = async () => {
        setBusy(true);
        setActionError('');
        try {
            await caregiverAPI.setKyc(confirm.row.caregiver?.id || confirm.row.profile.caregiverId, confirm.status);
            setConfirm(null);
            await load(1);
        } catch (err) {
            setActionError(apiError(err, 'Could not update KYC status'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>KYC Queue</h2>
                <p>Review caregiver identity documents, then approve or reject</p>
            </div>

            <div className="tabs">
                {TABS.map((t) => (
                    <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</div>
                ))}
            </div>

            <div className="filter-bar">
                <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email…" />
            </div>

            <div className="card">
                {loading ? <Loading />
                    : error ? <ErrorState message={error} onRetry={() => load(1)} />
                    : rows.length === 0 ? <EmptyState icon={ShieldCheck} title="Nothing here" subtitle={tab === 'PENDING_VERIFICATION' ? 'No KYC submissions are waiting for review.' : undefined} />
                    : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr><th>Caregiver</th><th>Job Role</th><th>Aadhaar / PAN</th><th>Documents</th><th>Status</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => {
                                        const { profile, caregiver } = row;
                                        return (
                                            <tr key={profile.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}><Value>{caregiver?.name}</Value></div>
                                                    <div className="text-muted text-xs">{caregiver?.phone || profile.phone}</div>
                                                    <div className="text-muted text-xs" style={{ wordBreak: 'break-all' }}>{caregiver?.email}</div>
                                                </td>
                                                <td><Value missing="Role missing">{profile.jobRole}</Value></td>
                                                <td className="text-xs">
                                                    <div>{profile.aadhaarNumber || '—'}</div>
                                                    <div>{profile.panNumber || '—'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        <DocButton label="Aadhaar" url={profile.aadhaarDocUrl} uploaded={profile.aadhaarUploaded} />
                                                        <DocButton label="PAN" url={profile.panDocUrl} uploaded={profile.panUploaded} />
                                                        <DocButton label="Other" url={profile.otherDocsUrl} uploaded={profile.otherDocsUploaded} />
                                                        <DocButton label="PCC" url={profile.pccDocUrl} uploaded={profile.pccUploaded} />
                                                    </div>
                                                </td>
                                                <td><StatusBadge status={profile.kycStatus} /><Waiting profile={profile} /></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {profile.kycStatus !== 'ACCEPTED' && (
                                                            <button className="btn btn-success btn-sm" onClick={() => { setActionError(''); setConfirm({ row, status: 'ACCEPTED' }); }}>
                                                                <Check size={13} /> {profile.kycStatus === 'REJECTED' ? 'Approve instead' : 'Approve'}
                                                            </button>
                                                        )}
                                                        {profile.kycStatus === 'PENDING_VERIFICATION' && (
                                                            <button className="btn btn-danger btn-sm" onClick={() => { setActionError(''); setConfirm({ row, status: 'REJECTED' }); }}>
                                                                <X size={13} /> Reject
                                                            </button>
                                                        )}
                                                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/caregivers/${caregiver?.id || profile.caregiverId}`)}>Profile</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
            </div>

            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={load} />

            {confirm && (
                <ConfirmDialog
                    title={confirm.status === 'ACCEPTED' ? 'Approve KYC?' : 'Reject KYC?'}
                    message={`${confirm.status === 'ACCEPTED' ? 'Approve' : 'Reject'} the KYC submission of ${confirm.row.caregiver?.name || 'this caregiver'}?`}
                    confirmLabel={confirm.status === 'ACCEPTED' ? 'Approve' : 'Reject'}
                    danger={confirm.status === 'REJECTED'}
                    busy={busy}
                    error={actionError}
                    onConfirm={decide}
                    onCancel={() => setConfirm(null)}
                />
            )}
        </>
    );
}
