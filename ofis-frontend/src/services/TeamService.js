// src/services/teamService.js
const API_URL = 'http://localhost:8000/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('ofis_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export const teamService = {
  // Services
  async getServices() {
    const response = await fetch(`${API_URL}/services/`, { headers: getHeaders() });
    return response.json();
  },

  // Équipes
  async getTeams(filters = {}) {
    let url = `${API_URL}/teams/`;
    const params = new URLSearchParams();
    if (filters.service) params.append('service', filters.service);
    if (params.toString()) url += '?' + params.toString();
    const response = await fetch(url, { headers: getHeaders() });
    return response.json();
  },

  async createTeam(data) {
    const response = await fetch(`${API_URL}/teams/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateTeam(id, data) {
    const response = await fetch(`${API_URL}/teams/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteTeam(id) {
    const response = await fetch(`${API_URL}/teams/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  // Matériel
  async getEquipment(filters = {}) {
    let url = `${API_URL}/equipment/`;
    const params = new URLSearchParams();
    if (filters.service) params.append('service', filters.service);
    if (filters.team) params.append('team', filters.team);
    if (params.toString()) url += '?' + params.toString();
    const response = await fetch(url, { headers: getHeaders() });
    return response.json();
  },

  async createEquipment(data) {
    const response = await fetch(`${API_URL}/equipment/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteEquipment(id) {
    const response = await fetch(`${API_URL}/equipment/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  // Missions
  async getMissions(filters = {}) {
    let url = `${API_URL}/missions-v2/`;
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.service) params.append('service', filters.service);
    if (filters.team) params.append('team', filters.team);
    if (params.toString()) url += '?' + params.toString();
    const response = await fetch(url, { headers: getHeaders() });
    return response.json();
  },

  async createMission(data) {
    const response = await fetch(`${API_URL}/missions-v2/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async updateMission(id, data) {
    const response = await fetch(`${API_URL}/missions-v2/${id}/`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteMission(id) {
    const response = await fetch(`${API_URL}/missions-v2/${id}/`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  async startMission(id) {
    const response = await fetch(`${API_URL}/missions-v2/${id}/start/`, {
      method: 'POST',
      headers: getHeaders()
    });
    return response.json();
  },

  async completeMission(id, actualHours) {
    const response = await fetch(`${API_URL}/missions-v2/${id}/complete/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ actual_hours: actualHours })
    });
    return response.json();
  }
};