import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token and ensure Content-Type is set for all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('vibecheck_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure Content-Type is always set for POST/PUT/PATCH requests
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
        config.headers['Content-Type'] = 'application/json';
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('vibecheck_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API functions
export const apiClient = {
    // Auth
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (data: { name: string; email: string; phone?: string; password: string }) =>
        api.post('/auth/signup', data),
    getProfile: () => api.get('/auth/me'),
    updateSettings: (settings: Record<string, unknown>) =>
        api.put('/auth/settings', settings),

    // Forms
    getActiveForm: (tenantId: string) =>
        api.get(`/forms/public/${tenantId}`),
    getForms: () => api.get('/forms'),
    createForm: (data: { name: string; schema: unknown[]; setActive?: boolean }) =>
        api.post('/forms', data),
    updateForm: (formId: string, data: Record<string, unknown>) =>
        api.put(`/forms/${formId}`, data),

    // Submit
    submitResponse: (data: {
        tenantId: string;
        formId?: string;
        answers: Array<{ questionId: string; value: number | string }>;
        metadata?: { phone?: string; orderId?: string; storeId?: string; source?: string };
        honeypot?: string;
    }) => api.post('/submit', data),

    // Analytics
    getAnalytics: (tenantId: string, range: string = '30d') =>
        api.get(`/analytics/${tenantId}`, { params: { range } }),
    getResponses: (tenantId: string, page: number = 1, limit: number = 20) =>
        api.get(`/analytics/${tenantId}/responses`, { params: { page, limit } }),

    // QR
    generateQR: (tenantId: string, orderId?: string, amount?: number) =>
        api.get('/qr/generate', { params: { tenantId, orderId, amount } }),

    // Export
    getExportResponses: (params: { page?: number; limit?: number; startDate?: string; endDate?: string }) =>
        api.get('/export/responses', { params }),
    getExportCSV: (params: { startDate?: string; endDate?: string }) =>
        api.get('/export/csv', { params, responseType: 'blob' }),
    getExportStats: () =>
        api.get('/export/stats'),

    // Tasks
    getTasks: (params?: { status?: string; priority?: string }) => api.get('/tasks', { params }),
    resolveTask: (id: string, note?: string) => api.post(`/tasks/${id}/resolve`, { note }),

    // Integrations
    connectIntegration: (data: { provider: string; apiKey: string; active: boolean }) => api.post('/integrations/connect', data),
    syncIntegration: (provider: string) => api.post('/integrations/sync', { provider }),

    reassignTask: (id: string, data: { newEmail: string; newDueDate?: string; reason?: string }) =>
        api.post(`/tasks/${id}/reassign`, data),

    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Raw access for custom requests
    get: api.get.bind(api),
    post: api.post.bind(api),
};

export default apiClient;
