import api from './api';

const suiviOTService = {
    getAll: (params) => api.get('/suivi-ot/', params),   // ← Enlève le 's'
    getById: (id) => api.get(`/suivi-ot/${id}/`),       // ← Enlève le 's'
    create: (data) => api.post('/suivi-ot/', data),     // ← Enlève le 's'
    update: (id, data) => api.put(`/suivi-ot/${id}/`, data),  // ← Enlève le 's'
    delete: (id) => api.delete(`/suivi-ot/${id}/`),     // ← Enlève le 's'
};

export default suiviOTService;