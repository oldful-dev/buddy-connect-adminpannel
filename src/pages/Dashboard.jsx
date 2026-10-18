import { useEffect, useState, useCallback } from 'react';
import { Users, ShieldCheck, HeartHandshake, ClipboardList, UploadCloud, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { dashboardAPI } from '../lib/api';
import { StatCard, Loading, ErrorState, apiError } from '../components/ui';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setLoading(true);
        setError('');
        dashboardAPI.get()
            .then((res) => setData(res.data.data))
            .catch((err) => setError(apiError(err, 'Could not load the dashboard')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    // Refresh the live numbers every 30 seconds while the page is open.
    useEffect(() => {
        const timer = setInterval(() => {
            dashboardAPI.get().then((res) => setData(res.data.data)).catch(() => {});
        }, 30000);
        return () => clearInterval(timer);
    }, []);

    if (loading) return <Loading />;
    if (error || !data) return <ErrorState message={error || 'No dashboard data'} onRetry={load} />;

    return (
        <>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Live overview across Ayuxa Buddy &amp; Ayuxa Connect — click a card to open it</p>
            </div>

            <div className="stats-grid">
                <StatCard icon={HeartHandshake} color="purple" label="Total Caregivers" value={data.totalCaregiverProfiles} to="/caregivers" />
                <StatCard icon={ShieldCheck} color="yellow" label="Pending KYC" value={data.pendingKyc} to="/kyc" />
                <StatCard icon={CheckCircle2} color="green" label="KYC Accepted" value={data.kycAccepted} to="/caregivers?kycStatus=ACCEPTED" />
                <StatCard icon={XCircle} color="red" label="KYC Rejected" value={data.kycRejected} to="/caregivers?kycStatus=REJECTED" />
                <StatCard icon={ClipboardList} color="blue" label="Active Check-Ins" value={data.activeCheckIns} to="/check-ins?status=checked_in" />
                <StatCard icon={Users} color="purple" label="Family Accounts" value={data.totalFamilyAccounts} to="/family-accounts" />
                <StatCard icon={Link2} color="green" label="Patient Links" value={data.totalPatientLinks} to="/family-accounts?filter=linked" />
                <StatCard icon={UploadCloud} color="blue" label="Uploads (7d)" value={data.recentUploads} to="/patients" />
            </div>
        </>
    );
}
