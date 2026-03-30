import api from './api';

const projetService = {
    // Récupérer tous les rapports projet (avec filtres possibles)
    getAll: (params) => api.get('/rapports-projet/', { params }),

    // Récupérer un rapport par ID
    getById: (id) => api.get(`/rapports-projet/${id}/`),

    // Créer un nouveau rapport
    create: (data) => api.post('/rapports-projet/', data),

    // Mettre à jour un rapport
    update: (id, data) => api.put(`/rapports-projet/${id}/`, data),

    // Supprimer un rapport
    delete: (id) => api.delete(`/rapports-projet/${id}/`),

    // Ajouter une ligne à un rapport existant
    ajouterLigne: (rapportId, data) => api.post(`/rapports-projet/${rapportId}/ajouter_ligne/`, data),

    // Modifier une ligne
    modifierLigne: (rapportId, ligneId, data) => api.put(`/rapports-projet/${rapportId}/lignes/${ligneId}/`, data),

    // Supprimer une ligne
    supprimerLigne: (rapportId, ligneId) => api.delete(`/rapports-projet/${rapportId}/lignes/${ligneId}/`),
};

export default projetService;