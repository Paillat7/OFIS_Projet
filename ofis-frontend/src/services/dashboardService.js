import api from './api';

export const dashboardService = {
  async getStats() {
    return api.getDashboardStats(); // Appelle la méthode de api.js
  }
};