const API_URL = 'http://localhost:8000/api';

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
    console.log('📡 GET:', fullUrl);   // ← pour vérifier
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
    console.log('🔐 Tentative de connexion pour:', credentials.username);
    try {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });
      console.log('📡 Statut réponse:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.detail || `Erreur ${response.status}`
        };
      }
      const data = await response.json();
      console.log('✅ Token reçu', data);
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
      console.error('💥 Erreur réseau:', error);
      return {
        success: false,
        error: 'Serveur inaccessible. Vérifie que Django tourne (localhost:8000)'
      };
    }
  },

  async logout() {
    console.log('🚪 Déconnexion');
    return { success: true };
  },

  // ===== UTILISATEURS =====
  async getUsers() {
    return this.get('/users/');
  },
  async getUser(id) {
    return this.get(`/users/${id}/`);
  },
  async createUser(userData) {
    return this.post('/users/', userData);
  },
  async updateUser(id, userData) {
    return this.put(`/users/${id}/`, userData);
  },
  async deleteUser(id) {
    return this.delete(`/users/${id}/`);
  },

  // ===== MISSIONS =====
  async getMissions() {
    return this.get('/missions/');
  },

  // ===== CLIENTS =====
  async getClients() {
    return this.get('/clients/');
  },
  async createClient(data) {
    return this.post('/clients/', data);
  },
  async updateClient(id, data) {
    return this.put(`/clients/${id}/`, data);
  },
  async deleteClient(id) {
    return this.delete(`/clients/${id}/`);
  },

  // ===== RAPPORTS =====
  async getRapportsJournaliers() {
    return this.get('/rapports-journaliers/');
  },
  async getRapportsHebdomadaires() {
    return this.get('/rapports-hebdomadaires/');
  },
  async getRapportsProjet() {
    return this.get('/rapports-projet/');
  },

  // ===== BONS DE COMMANDE =====
  async getBons(params = {}) {
    return this.get('/bons/', params);
  },
  async getBon(id) {
    return this.get(`/bons/${id}/`);
  },
  async createBon(data) {
    return this.post('/bons/', data);
  },
  async updateBon(id, data) {
    return this.put(`/bons/${id}/`, data);
  },
  async deleteBon(id) {
    return this.delete(`/bons/${id}/`);
  },
  async validerBon(id) {
    return this.post(`/bons/${id}/valider/`);
  },
  async rejeterBon(id) {
    return this.post(`/bons/${id}/rejeter/`);
  },
  async getBonQR(id) {
    return this.get(`/bons/${id}/qr/`);
  },

  // ===== SUIVI MÉDICAL =====
  async getSuiviMedical() {
    return this.get('/suivi-medical/');
  },

  // ===== SERVICES =====
  async getServices() {
    return this.get('/services/');
  },

  // ===== DASHBOARD =====
  async getDashboardStats() {
    return this.get('/dashboard/stats/');
  },

  // ===== NOTIFICATIONS =====
  async getNotifications() {
    return this.get('/notifications/api/');
  },
  async markNotificationAsRead(id) {
    return this.post(`/notifications/api/${id}/mark-read/`);
  },
  async getUnreadCount() {
    return this.get('/notifications/api/unread-count/');
  },

  // ===== ADMIN =====
  async getAdminTables() {
    return this.get('/admin/tables/');
  },
  async getAdminBackups() {
    return this.get('/admin/backups/');
  },
  async postAdminBackup() {
    const response = await fetch(`${API_URL}/admin/backup/`, {
      method: 'POST',
      headers: getHeaders()
    });
    return response;
  },
  async postAdminRestore(formData) {
    const response = await fetch(`${API_URL}/admin/restore/`, {
      method: 'POST',
      headers: {
        'Authorization': getHeaders()['Authorization']
      },
      body: formData
    });
    return response.json();
  },
  async postAdminOptimize() {
    return this.post('/admin/optimize/');
  },
  async getAdminTable(tableName) {
    return this.get(`/admin/table/${tableName}/`);
  },
  async getAdminTableExport(tableName) {
    const response = await fetch(`${API_URL}/admin/table/${tableName}/export/`, {
      headers: getHeaders()
    });
    return response;
  }
};

export default api;