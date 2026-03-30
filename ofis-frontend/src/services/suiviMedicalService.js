import api from './api';

export const suiviMedicalService = {
  async getAll() {
    return api.getSuiviMedical(); // retourne directement les données
  },
  async getById(id) {
    // Si tu as besoin de cette méthode, il faut l'ajouter dans api.js
    // Pour l'instant, on peut laisser, mais elle ne fonctionnera pas sans méthode correspondante.
    // Tu peux l'implémenter plus tard.
    throw new Error('Méthode non implémentée');
  },
  async create(data) {
    throw new Error('Méthode non implémentée');
  },
  async update(id, data) {
    throw new Error('Méthode non implémentée');
  },
  async delete(id) {
    throw new Error('Méthode non implémentée');
  }
};