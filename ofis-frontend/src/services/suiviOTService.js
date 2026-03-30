import api from './api';

const suiviOTService = {
    getAll: (params) => api.get('/suivis-ot/', params),   // ← PAS d'objet { params }
    getById: (id) => api.get(`/suivis-ot/${id}/`),
    create: (data) => api.post('/suivis-ot/', data),
    update: (id, data) => api.put(`/suivis-ot/${id}/`, data),
    delete: (id) => api.delete(`/suivis-ot/${id}/`),
};

export default suiviOTService;