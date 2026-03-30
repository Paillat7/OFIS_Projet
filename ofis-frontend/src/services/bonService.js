import api from './api';

export const bonService = {
  // Récupérer la liste des bons (avec filtres optionnels)
  async getBons(params = {}) {
    return api.getBons(params);
  },

  // Récupérer un bon par son ID
  async getBon(id) {
    return api.getBon(id);
  },

  // Créer un nouveau bon
  async createBon(data) {
    return api.createBon(data);
  },

  // Mettre à jour un bon
  async updateBon(id, data) {
    return api.updateBon(id, data);
  },

  // Supprimer un bon
  async deleteBon(id) {
    return api.deleteBon(id);
  },

  // Valider un bon
  async validerBon(id) {
    return api.validerBon(id);
  },

  // Rejeter un bon
  async rejeterBon(id) {
    return api.rejeterBon(id);
  },

  // Obtenir le QR code d'un bon
  async getQR(id) {
    return api.getBonQR(id);
  }
};