const API_URL = 'http://localhost:8000/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('ofis_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    console.error('Réponse erreur brute:', text);
    let error;
    try {
      error = JSON.parse(text);
    } catch {
      error = { detail: text };
    }
    throw new Error(error.detail || JSON.stringify(error));
  }
  return response.json();
};

export const rapportService = {
  // ===== RAPPORTS JOURNALIERS =====
  async getJournaliers() {
    const response = await fetch(`${API_URL}/rapports-journaliers/`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async getJournalier(id) {
    const response = await fetch(`${API_URL}/rapports-journaliers/${id}/`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async createJournalier(data) {
    const response = await fetch(`${API_URL}/rapports-journaliers/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async updateJournalier(id, data) {
    const response = await fetch(`${API_URL}/rapports-journaliers/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async deleteJournalier(id) {
    const response = await fetch(`${API_URL}/rapports-journaliers/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  // ===== RAPPORTS HEBDOMADAIRES (anciens) =====
  async getHebdomadaires() {
    const response = await fetch(`${API_URL}/rapports-hebdomadaires/`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async getHebdomadaire(id) {
    const response = await fetch(`${API_URL}/rapports-hebdomadaires/${id}/`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async createHebdomadaire(data) {
    const response = await fetch(`${API_URL}/rapports-hebdomadaires/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async updateHebdomadaire(id, data) {
    const response = await fetch(`${API_URL}/rapports-hebdomadaires/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async deleteHebdomadaire(id) {
    const response = await fetch(`${API_URL}/rapports-hebdomadaires/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  // ===== RAPPORTS DE PROJET (anciens) =====
  async getProjets() {
    const response = await fetch(`${API_URL}/rapports-projet/`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async getProjet(id) {
    const response = await fetch(`${API_URL}/rapports-projet/${id}/`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async createProjet(data) {
    const response = await fetch(`${API_URL}/rapports-projet/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async updateProjet(id, data) {
    const response = await fetch(`${API_URL}/rapports-projet/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async deleteProjet(id) {
    const response = await fetch(`${API_URL}/rapports-projet/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  // ===== RAPPORTS HEBDOMADAIRES CADRE (nouveaux) =====
  async getHebdoCadre(id = null) {
    const url = id ? `/rapports-hebdo-cadre/${id}/` : '/rapports-hebdo-cadre/';
    const response = await fetch(`${API_URL}${url}`, { headers: getHeaders() });
    return handleResponse(response);
  },
  async createHebdoCadre(data) {
    const response = await fetch(`${API_URL}/rapports-hebdo-cadre/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async updateHebdoCadre(id, data) {
    const response = await fetch(`${API_URL}/rapports-hebdo-cadre/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  async deleteHebdoCadre(id) {
    const response = await fetch(`${API_URL}/rapports-hebdo-cadre/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },
};