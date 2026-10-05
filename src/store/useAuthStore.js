import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authAPI } from '../lib/api';

const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    loading: true,

    login: async (email, password) => {
        try {
            const res = await authAPI.login(email, password);
            if (res.data.success) {
                const { accessToken, refreshToken, admin } = res.data.data;
                Cookies.set('adminToken', accessToken, { expires: 1 });
                Cookies.set('adminRefreshToken', refreshToken, { expires: 7 });
                set({ user: admin, isAuthenticated: true, loading: false });
                return { success: true };
            }
            return { success: false, message: 'Invalid response' };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    },

    logout: async () => {
        try {
            await authAPI.logout();
        } catch (_) { /* best effort */ }
        Cookies.remove('adminToken');
        Cookies.remove('adminRefreshToken');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: () => {
        const token = Cookies.get('adminToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                set({ user: { id: payload.id, role: payload.role }, isAuthenticated: true, loading: false });
            } catch (_) {
                Cookies.remove('adminToken');
                set({ user: null, isAuthenticated: false, loading: false });
            }
        } else {
            set({ user: null, isAuthenticated: false, loading: false });
        }
    },
}));

export default useAuthStore;
