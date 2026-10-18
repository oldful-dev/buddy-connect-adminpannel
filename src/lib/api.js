import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || 'https://buddy-connect-api.ayuxacare.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const refreshToken = Cookies.get('adminRefreshToken');
            if (refreshToken && !error.config._retry) {
                error.config._retry = true;
                try {
                    const res = await axios.post(`${API_URL}/auth/admin/refresh`, { refreshToken });
                    if (res.data.success) {
                        Cookies.set('adminToken', res.data.data.accessToken, { expires: 1 });
                        error.config.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
                        return api(error.config);
                    }
                } catch (_) { /* fall through to logout */ }
            }
            Cookies.remove('adminToken');
            Cookies.remove('adminRefreshToken');
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth ─────────────────────────────────────────────
export const authAPI = {
    login: (email, password) => api.post('/auth/admin/login', { email, password }),
    refresh: (refreshToken) => api.post('/auth/admin/refresh', { refreshToken }),
    logout: () => api.post('/auth/logout'),
};

// ── Dashboard ────────────────────────────────────────
export const dashboardAPI = {
    get: () => api.get('/admin/dashboard'),
};

// ── Buddy: caregivers ────────────────────────────────
export const caregiverAPI = {
    getAll: (params) => api.get('/admin/caregivers', { params }),
    getById: (id) => api.get(`/admin/caregivers/${id}`),
    setKyc: (id, status) => api.put(`/admin/caregivers/${id}/kyc`, { status }),
    createAssignment: (id, data) => api.post(`/admin/caregivers/${id}/assignments`, data),
    update: (id, data) => api.put(`/admin/caregivers/${id}`, data),
};

export const checkInAPI = {
    getAll: (params) => api.get('/admin/check-ins', { params }),
    getById: (id) => api.get(`/admin/check-ins/${id}`),
    update: (id, data) => api.put(`/admin/check-ins/${id}`, data),
    remove: (id) => api.delete(`/admin/check-ins/${id}`),
};

// ── Connect: family accounts & patients ──────────────
export const familyAccountAPI = {
    getAll: (params) => api.get('/admin/family-accounts', { params }),
    getById: (id) => api.get(`/admin/family-accounts/${id}`),
    update: (id, data) => api.put(`/admin/family-accounts/${id}`, data),
};

export const patientAPI = {
    getAll: (params) => api.get('/admin/patients', { params }),
    getById: (id) => api.get(`/admin/patients/${id}`),
    addCareTeamMember: (id, data) => api.post(`/admin/patients/${id}/care-team`, data),
};

export const careTeamAPI = {
    remove: (id) => api.delete(`/admin/care-team/${id}`),
};

// ── Staff ─────────────────────────────────────────────
export const staffAPI = {
    getAll: () => api.get('/admin/staff'),
    register: (data) => api.post('/auth/admin/register', data),
    setActive: (id, isActive) => api.put(`/admin/staff/${id}/status`, { isActive }),
    update: (id, data) => api.put(`/admin/staff/${id}`, data),
    remove: (id) => api.delete(`/admin/staff/${id}`),
    requestEmailOtp: (email) => api.post('/admin/staff/verify-email/request-otp', { email }),
};

// ── My profile ────────────────────────────────────────
export const profileAPI = {
    get: () => api.get('/admin/me'),
    update: (data) => api.put('/admin/me', data),
    changePassword: (currentPassword, newPassword) => api.put('/admin/me/password', { currentPassword, newPassword }),
};

// ── Sessions ──────────────────────────────────────────
export const sessionAPI = {
    getAll: () => api.get('/sessions'),
    terminate: (model, id) => api.delete(`/sessions/${model}/${id}`),
};

// ── Audit logs ────────────────────────────────────────
export const auditAPI = {
    getAll: (params) => api.get('/audit-logs', { params }),
    users: () => api.get('/audit-logs/users'),
};

export default api;
