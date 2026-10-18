import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Caregivers from './pages/Caregivers';
import CaregiverDetail from './pages/CaregiverDetail';
import CheckIns from './pages/CheckIns';
import FamilyAccounts from './pages/FamilyAccounts';
import FamilyAccountDetail from './pages/FamilyAccountDetail';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Sessions from './pages/Sessions';
import Staff from './pages/Staff';
import AuditLog from './pages/AuditLog';
import AuditUser from './pages/AuditUser';
import Kyc from './pages/Kyc';
import CheckInDetail from './pages/CheckInDetail';
import Profile from './pages/Profile';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<AdminLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/caregivers" element={<Caregivers />} />
                    <Route path="/caregivers/:caregiverId" element={<CaregiverDetail />} />
                    <Route path="/kyc" element={<Kyc />} />
                    <Route path="/check-ins" element={<CheckIns />} />
                    <Route path="/check-ins/:checkInId" element={<CheckInDetail />} />
                    <Route path="/family-accounts" element={<FamilyAccounts />} />
                    <Route path="/family-accounts/:accountId" element={<FamilyAccountDetail />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/patients/:patientUserId" element={<PatientDetail />} />
                    <Route path="/sessions" element={<Sessions />} />
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/audit" element={<AuditLog />} />
                    <Route path="/audit/users/:adminId" element={<AuditUser />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
