import {
    LayoutDashboard, HeartHandshake, Users, ShieldCheck, ClipboardList,
    Activity, UserCog, ScrollText,
} from 'lucide-react';

export const NAV_SECTIONS = [
    {
        title: 'Overview',
        items: [
            { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OPERATIONS_EXECUTIVE', 'SUPPORT_AGENT'] },
        ],
    },
    {
        title: 'Ayuxa Buddy',
        items: [
            { id: 'caregivers', label: 'Caregivers', href: '/caregivers', icon: HeartHandshake, roles: ['SUPER_ADMIN', 'OPERATIONS_EXECUTIVE', 'SUPPORT_AGENT'] },
            { id: 'kyc', label: 'KYC Queue', href: '/caregivers?kycStatus=PENDING_VERIFICATION', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'OPERATIONS_EXECUTIVE'] },
            { id: 'check-ins', label: 'Check-Ins', href: '/check-ins', icon: ClipboardList, roles: ['SUPER_ADMIN', 'OPERATIONS_EXECUTIVE', 'SUPPORT_AGENT'] },
        ],
    },
    {
        title: 'Ayuxa Connect',
        items: [
            { id: 'family-accounts', label: 'Family Accounts', href: '/family-accounts', icon: Users, roles: ['SUPER_ADMIN', 'OPERATIONS_EXECUTIVE', 'SUPPORT_AGENT'] },
            { id: 'patients', label: 'Patients', href: '/patients', icon: HeartHandshake, roles: ['SUPER_ADMIN', 'OPERATIONS_EXECUTIVE', 'SUPPORT_AGENT'] },
        ],
    },
    {
        title: 'System',
        items: [
            { id: 'sessions', label: 'Active Sessions', href: '/sessions', icon: Activity, roles: ['SUPER_ADMIN'] },
            { id: 'staff', label: 'Staff', href: '/staff', icon: UserCog, roles: ['SUPER_ADMIN'] },
            { id: 'audit', label: 'Audit Log', href: '/audit', icon: ScrollText, roles: ['SUPER_ADMIN'] },
        ],
    },
];
