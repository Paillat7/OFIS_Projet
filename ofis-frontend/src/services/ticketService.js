import api from './api';

export const ticketService = {
  async getAll(params = {}) {
    return api.get('/tickets/', params);
  },
  async getById(id) {
    return api.get(`/tickets/${id}/`);
  },
  async create(data) {
    return api.post('/tickets/', data);
  },
  async update(id, data) {
    return api.put(`/tickets/${id}/`, data);
  },
  async delete(id) {
    return api.delete(`/tickets/${id}/`);
  },
  async assigner(id, technicienId) {
    return api.post(`/tickets/${id}/assigner/`, { technicien_id: technicienId });
  },
  async changerStatut(id, statut) {
    return api.post(`/tickets/${id}/changer_statut/`, { statut });
  },
  async ajouterTemps(id, heures) {
    return api.post(`/tickets/${id}/ajouter_temps/`, { heures });
  },
  async ajouterSolution(id, solution) {
    return api.post(`/tickets/${id}/ajouter_solution/`, { solution });
  },
};