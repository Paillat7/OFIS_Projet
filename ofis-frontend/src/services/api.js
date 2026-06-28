const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ===== HEADERS AVEC TOKEN =====
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('ofis_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// ===== GESTION DES ERREURS =====
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Erreur API');
  }
  if (response.status === 204) return {};
  return response.json();
};

const api = {
  // ===== MÉTHODES GÉNÉRIQUES =====
  async get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${API_URL}${url}?${queryString}` : `${API_URL}${url}`;
    const response = await fetch(fullUrl, { headers: getHeaders() });
    return handleResponse(response);
  },

  async post(url, data = {}, isMultipart = false) {
    const headers = getHeaders();
    if (isMultipart) delete headers['Content-Type'];
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers,
      body: isMultipart ? data : JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async put(url, data = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async patch(url, data = {}) {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async delete(url) {
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // ===== AUTHENTIFICATION =====
  async login(credentials) {
    try {
      // ✅ Correction : URL sans slash final pour éviter 405
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `Erreur ${response.status}`
        };
      }
      
      const data = await response.json();
      
      localStorage.setItem('ofis_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('ofis_user', JSON.stringify({
        username: data.username,
        role: data.role,
        id: data.user_id
      }));
      
      return {
        success: true,
        user: {
          username: data.username,
          role: data.role,
          access: data.access,
          refresh: data.refresh,
          user_id: data.user_id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Serveur inaccessible.'
      };
    }
  },

  async logout() {
    localStorage.removeItem('ofis_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('ofis_user');
    return { success: true };
  },

  // ===== UTILISATEURS =====
  async getUsers() { return this.get('/users/'); },
  async getUser(id) { return this.get(`/users/${id}/`); },
  async createUser(userData) { return this.post('/users/', userData); },
  async updateUser(id, userData) { return this.put(`/users/${id}/`, userData); },
  async deleteUser(id) { return this.delete(`/users/${id}/`); },

  // ===== MISSIONS =====
  async getMissions() { return this.get('/missions/'); },

  // ===== CLIENTS =====
  async getClients() { return this.get('/clients/'); },
  async createClient(data) { return this.post('/clients/', data); },
  async updateClient(id, data) { return this.put(`/clients/${id}/`, data); },
  async deleteClient(id) { return this.delete(`/clients/${id}/`); },

  // ===== RAPPORTS =====
  async getRapportsJournaliers() { return this.get('/rapports-journaliers/'); },
  async createRapportJournalier(data) { return this.post('/rapports-journaliers/', data); },
  async updateRapportJournalier(id, data) { return this.put(`/rapports-journaliers/${id}/`, data); },
  async deleteRapportJournalier(id) { return this.delete(`/rapports-journaliers/${id}/`); },
  
  async getRapportsHebdomadaires() { return this.get('/rapports-hebdomadaires/'); },
  async createRapportHebdomadaire(data) { return this.post('/rapports-hebdomadaires/', data); },
  async updateRapportHebdomadaire(id, data) { return this.put(`/rapports-hebdomadaires/${id}/`, data); },
  async deleteRapportHebdomadaire(id) { return this.delete(`/rapports-hebdomadaires/${id}/`); },
  
  async getRapportsProjet() { return this.get('/rapports-projet/'); },
  async createRapportProjet(data) { return this.post('/rapports-projet/', data); },
  async updateRapportProjet(id, data) { return this.put(`/rapports-projet/${id}/`, data); },
  async deleteRapportProjet(id) { return this.delete(`/rapports-projet/${id}/`); },

  // ===== RAPPORTS PROJET CADRE =====
  async getRapportsProjetCadre() { return this.get('/rapports-projet-cadre/'); },
  async createRapportProjetCadre(data) { return this.post('/rapports-projet-cadre/', data); },
  async updateRapportProjetCadre(id, data) { return this.put(`/rapports-projet-cadre/${id}/`, data); },
  async deleteRapportProjetCadre(id) { return this.delete(`/rapports-projet-cadre/${id}/`); },

  // ===== RAPPORTS HEBDOMADAIRES CADRE =====
  async getRapportsHebdoCadre(id = null) {
    const url = id ? `/rapports-hebdo-cadre/${id}/` : '/rapports-hebdo-cadre/';
    return this.get(url);
  },
  async createRapportHebdoCadre(data) { return this.post('/rapports-hebdo-cadre/', data); },
  async updateRapportHebdoCadre(id, data) { return this.put(`/rapports-hebdo-cadre/${id}/`, data); },
  async deleteRapportHebdoCadre(id) { return this.delete(`/rapports-hebdo-cadre/${id}/`); },

  // ===== BONS DE COMMANDE =====
  async getBons(params = {}) { return this.get('/bons/', params); },
  async getBon(id) { return this.get(`/bons/${id}/`); },
  async createBon(data) { return this.post('/bons/', data); },
  async updateBon(id, data) { return this.put(`/bons/${id}/`, data); },
  async deleteBon(id) { return this.delete(`/bons/${id}/`); },
  async validerBon(id) { return this.post(`/bons/${id}/valider/`); },
  async rejeterBon(id) { return this.post(`/bons/${id}/rejeter/`); },
  async getBonQR(id) { return this.get(`/bons/${id}/qr/`); },

  // ===== SUIVI MÉDICAL =====
  async getSuiviMedical() { return this.get('/suivi-medical/'); },
  async createSuiviMedical(data) { return this.post('/suivi-medical/', data); },
  async updateSuiviMedical(id, data) { return this.put(`/suivi-medical/${id}/`, data); },
  async deleteSuiviMedical(id) { return this.delete(`/suivi-medical/${id}/`); },

  // ===== SERVICES =====
  async getServices() { return this.get('/services/'); },
  async createService(data) { return this.post('/services/', data); },
  async updateService(id, data) { return this.put(`/services/${id}/`, data); },
  async deleteService(id) { return this.delete(`/services/${id}/`); },

  // ===== ÉQUIPEMENTS =====
  async getEquipements() { return this.get('/equipment/'); },
  async createEquipement(data) { return this.post('/equipment/', data); },
  async updateEquipement(id, data) { return this.put(`/equipment/${id}/`, data); },
  async deleteEquipement(id) { return this.delete(`/equipment/${id}/`); },

  // ===== ÉQUIPES =====
  async getTeams() { return this.get('/teams/'); },
  async createTeam(data) { return this.post('/teams/', data); },
  async updateTeam(id, data) { return this.put(`/teams/${id}/`, data); },
  async deleteTeam(id) { return this.delete(`/teams/${id}/`); },

  // ===== DASHBOARD =====
  async getDashboardStats() { return this.get('/dashboard/stats/'); },

  // ===== POSITIONS =====
  async getPositions() { return this.get('/positions/'); },
  async createPosition(data) { return this.post('/positions/', data); },

  // ===== NOTIFICATIONS =====
  async getNotifications() { 
    return this.get('/notifications/'); 
  },
  async markNotificationAsRead(id) { 
    return this.post(`/notifications/${id}/marquer_lue/`); 
  },
  async getUnreadNotificationsCount() { 
    return this.get('/notifications/unread-count/'); 
  },

  // ===== ADMIN =====
  async getAdminTables() { return this.get('/admin/tables/'); },
  async getAdminBackups() { return this.get('/admin/backups/'); },
  async postAdminBackup() { return this.post('/admin/backup/'); },
  async postAdminRestore(formData) {
    const headers = getHeaders();
    delete headers['Content-Type'];
    const response = await fetch(`${API_URL}/admin/restore/`, {
      method: 'POST',
      headers,
      body: formData
    });
    return response.json();
  },
  async postAdminOptimize() { return this.post('/admin/optimize/'); },
  async getAdminTable(tableName) { return this.get(`/admin/table/${tableName}/`); },
  async getAdminTableExport(tableName) {
    const response = await fetch(`${API_URL}/admin/table/${tableName}/export/`, {
      headers: getHeaders()
    });
    return response;
  },

  // ===== TECHNICIENS =====
  async getTechnicians() { 
    return this.get('/technicians/'); 
  },
  async updateTechnician(id, data) { 
    return this.patch(`/technicians/${id}/`, data); 
  },

  // ===== TICKETS =====
  async getTickets(params = {}) {
    return this.get('/tickets/', params);
  },
  async getTicket(id) {
    return this.get(`/tickets/${id}/`);
  },
  async createTicket(data) {
    return this.post('/tickets/', data);
  },
  async updateTicket(id, data) {
    return this.put(`/tickets/${id}/`, data);
  },
  async deleteTicket(id) {
    return this.delete(`/tickets/${id}/`);
  },
  async assignerTicket(id, technicienId) {
    return this.post(`/tickets/${id}/assigner/`, { technicien_id: technicienId });
  },
  async changerStatutTicket(id, statut) {
    return this.post(`/tickets/${id}/changer_statut/`, { statut });
  },
  async ajouterTempsTicket(id, heures) {
    return this.post(`/tickets/${id}/ajouter_temps/`, { heures });
  },
  async ajouterSolutionTicket(id, solution) {
    return this.post(`/tickets/${id}/ajouter_solution/`, { solution });
  },
};

export default api;