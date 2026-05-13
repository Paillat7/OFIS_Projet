import api from './api';

export const rapportService = {
  // ===== RAPPORTS JOURNALIERS =====
  async getJournaliers() {
    return api.getRapportsJournaliers();
  },
  async createJournalier(data) {
    return api.createRapportJournalier(data);
  },
  async updateJournalier(id, data) {
    return api.updateRapportJournalier(id, data);
  },
  async deleteJournalier(id) {
    return api.deleteRapportJournalier(id);
  },

  // ===== RAPPORTS HEBDOMADAIRES =====
  async getHebdomadaires() {
    return api.getRapportsHebdomadaires();
  },
  async createHebdomadaire(data) {
    return api.createRapportHebdomadaire(data);
  },
  async updateHebdomadaire(id, data) {
    return api.updateRapportHebdomadaire(id, data);
  },
  async deleteHebdomadaire(id) {
    return api.deleteRapportHebdomadaire(id);
  },

  // ===== RAPPORTS PROJET =====
  async getProjets() {
    return api.getRapportsProjet();
  },
  async createProjet(data) {
    return api.createRapportProjet(data);
  },
  async updateProjet(id, data) {
    return api.updateRapportProjet(id, data);
  },
  async deleteProjet(id) {
    return api.deleteRapportProjet(id);
  },

  // ===== RAPPORTS PROJET CADRE =====
  async getProjetCadre() {
    return api.getRapportsProjetCadre();
  },
  async createProjetCadre(data) {
    return api.createRapportProjetCadre(data);
  },
  async updateProjetCadre(id, data) {
    return api.updateRapportProjetCadre(id, data);
  },
  async deleteProjetCadre(id) {
    return api.deleteRapportProjetCadre(id);
  },

  // ===== RAPPORTS HEBDO CADRE =====
  async getHebdoCadre(id = null) {
    return api.getRapportsHebdoCadre(id);
  },
  async createHebdoCadre(data) {
    return api.createRapportHebdoCadre(data);
  },
  async updateHebdoCadre(id, data) {
    return api.updateRapportHebdoCadre(id, data);
  },
  async deleteHebdoCadre(id) {
    return api.deleteRapportHebdoCadre(id);
  }
};