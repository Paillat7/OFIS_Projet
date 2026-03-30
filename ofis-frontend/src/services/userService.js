// src/services/userService.js
import api from './api';

export const userService = {
  // Récupérer tous les utilisateurs
  async getAll() {
    console.log('🟢 [userService] getAll() appelé');
    console.log('🟢 [userService] Token:', localStorage.getItem('ofis_token'));
    
    const result = await api.getUsers();
    
    console.log('🟢 [userService] Résultat brut:', result);
    return result;
  },

  // Récupérer un utilisateur par ID
  async getById(id) {
    console.log('🟢 [userService] getById() appelé avec id:', id);
    const result = await api.getUser(id);
    console.log('🟢 [userService] Résultat:', result);
    return result;
  },

  // Créer un utilisateur
  async create(userData) {
    console.log('🟢 [userService] create() appelé avec:', userData);
    const result = await api.createUser(userData);
    console.log('🟢 [userService] Résultat:', result);
    return result;
  },

  // Modifier complètement un utilisateur
  async update(id, userData) {
    console.log('🟢 [userService] update() appelé - id:', id, 'data:', userData);
    const result = await api.updateUser(id, userData);
    console.log('🟢 [userService] Résultat:', result);
    return result;
  },

  // Mise à jour partielle
  async patch(id, data) {
    console.log('🟢 [userService] patch() appelé - id:', id, 'data:', data);
    const result = await api.patchUser(id, data);
    console.log('🟢 [userService] Résultat:', result);
    return result;
  },

  // Supprimer un utilisateur
  async delete(id) {
    console.log('🟢 [userService] delete() appelé avec id:', id);
    const result = await api.deleteUser(id);
    console.log('🟢 [userService] Résultat:', result);
    return result;
  }
};