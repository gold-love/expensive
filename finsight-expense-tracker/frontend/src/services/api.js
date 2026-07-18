import axios from 'axios';

const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const apiBase = rawApiBase.endsWith('/api') ? rawApiBase.replace(/\/api$/, '') : rawApiBase;

const api = axios.create({
    baseURL: `${apiBase}/api`,
});

export const getApiUrl = (path = '') => {
    if (!path) return apiBase;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiBase}${normalizedPath}`;
};

api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('user');
            // Avoid infinite loops if we are already on login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
