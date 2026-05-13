import api from './api';

export const projetService = {
  async getAll(params = {}) {
    return api.get('/projets/', params);
  },
  async getById(id) {
    return api.get(`/projets/${id}/`);
  },
  async create(data) {
    const dataToSend = {
      ...data,
      intervenants_ids: data.intervenants_ids || []
    };
    return api.post('/projets/', dataToSend);
  },
  async update(id, data) {
    const dataToSend = {
      ...data,
      intervenants_ids: data.intervenants_ids || []
    };
    return api.put(`/projets/${id}/`, dataToSend);
  },
  async delete(id) {
    return api.delete(`/projets/${id}/`);
  },
  async ajouterHeures(projetId, data) {
    return api.post(`/projets/${projetId}/ajouter_heures/`, data);
  },
  async getHeures(projetId) {
    return api.get(`/projets/${projetId}/heures/`);
  },
  async ajouterIntervenant(projetId, intervenantId) {
    return api.post(`/projets/${projetId}/ajouter_intervenant/`, { intervenant_id: intervenantId });
  },
  async ajouterIntervenants(projetId, intervenantsIds) {
    return api.post(`/projets/${projetId}/ajouter_intervenants/`, { intervenants_ids: intervenantsIds });
  },
  async retirerIntervenant(projetId, intervenantId) {
    return api.post(`/projets/${projetId}/retirer_intervenant/`, { intervenant_id: intervenantId });
  },
  async getHistorique(projetId) {
  return api.get(`/projets/${projetId}/historique/`);
    }
};

