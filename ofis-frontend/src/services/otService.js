import api from './api';

export const otService = {
  async getAll(params = {}) {
    // Appel correct : passer params directement
    return api.get('/ordres-travail/', params);
  },
  async getById(id) {
    return api.get(`/ordres-travail/${id}/`);
  },
  async create(data) {
    return api.post('/ordres-travail/', data);
  },
  async update(id, data) {
    return api.put(`/ordres-travail/${id}/`, data);
  },
  async patch(id, data) {
    return api.patch(`/ordres-travail/${id}/`, data);
  },
  async demarrer(id) {
    return api.post(`/ordres-travail/${id}/demarrer/`);
  },
  async terminer(id, rapportData) {
    return api.post(`/ordres-travail/${id}/terminer/`, rapportData);
  },
  async uploadDocument(id, formData) {
    return api.post(`/ordres-travail/${id}/upload_document/`, formData, true);
  },
  async valider(id) {
    return api.post(`/ordres-travail/${id}/valider/`);
  },
  async rejeter(id) {
    return api.post(`/ordres-travail/${id}/rejeter/`);
  },
  async delete(id) {
    return api.delete(`/ordres-travail/${id}/`);
  }
};