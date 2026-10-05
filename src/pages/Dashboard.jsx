import { useEffect, useState } from 'react';
import { Users, ShieldCheck, HeartHandshake, ClipboardList, UploadCloud, Link2, CheckCircle2, XCircle } from 'lucide-react';
import { dashboardAPI } from '../lib/api';
import { StatCard, Loading } from '../components/ui';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardAPI.get()
            .then((res) => setData(res.data.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;
    if (!data) return null;

    return (
        <>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview across Ayuxa Buddy &amp; Ayuxa Connect</p>
            </div>

            <div className="stats-grid">
                <StatCard icon={HeartHandshake} color="purple" label="Total Caregivers" value={data.totalCaregiverProfiles} />
                <StatCard icon={ShieldCheck} color="yellow" label="Pending KYC" value={data.pendingKyc} />
                <StatCard icon={CheckCircle2} color="green" label="KYC Accepted" value={data.kycAccepted} />
                <StatCard icon={XCircle} color="red" label="KYC Rejected" value={data.kycRejected} />
                <StatCard icon={ClipboardList} color="blue" label="Active Check-Ins" value={data.activeCheckIns} />
                <StatCard icon={Users} color="purple" label="Family Accounts" value={data.totalFamilyAccounts} />
                <StatCard icon={Link2} color="green" label="Patient Links" value={data.totalPatientLinks} />
                <StatCard icon={UploadCloud} color="blue" label="Uploads (7d)" value={data.recentUploads} />
            </div>
        </>
    );
}
