import api from './api';

const rapportHebdoCadreService = {
    getAll: () => api.get('/rapports-hebdo-cadre/'),
    getById: (id) => api.get(`/rapports-hebdo-cadre/${id}/`),
    create: (data) => api.post('/rapports-hebdo-cadre/', data),
    update: (id, data) => api.put(`/rapports-hebdo-cadre/${id}/`, data),
    delete: (id) => api.delete(`/rapports-hebdo-cadre/${id}/`),
    ajouterLigne: (rapportId, data) => api.post(`/rapports-hebdo-cadre/${rapportId}/ajouter_ligne/`, data),
    modifierLigne: (rapportId, ligneId, data) => api.put(`/rapports-hebdo-cadre/${rapportId}/lignes/${ligneId}/`, data),
    supprimerLigne: (rapportId, ligneId) => api.delete(`/rapports-hebdo-cadre/${rapportId}/lignes/${ligneId}/`),
};

export default rapportHebdoCadreService;