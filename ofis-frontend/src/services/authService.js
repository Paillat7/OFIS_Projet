import api from './api';

export const authService = {
  isAuthenticated() {
    return localStorage.getItem('ofis_token') !== null;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('ofis_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  async login(credentials) {
    try {
      const result = await api.login(credentials);
      if (result.success) {
        const { access, refresh, role, username, user_id } = result.user;
        localStorage.setItem('ofis_token', access);
        if (refresh) localStorage.setItem('refresh_token', refresh);
        const userInfo = { username, role, id: user_id };
        localStorage.setItem('ofis_user', JSON.stringify(userInfo));
        return { success: true, user: userInfo };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Erreur login:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  },

  logout() {
    localStorage.removeItem('ofis_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('ofis_user');
  },

  getRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }
};