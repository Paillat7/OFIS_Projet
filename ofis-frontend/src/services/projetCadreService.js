import api from './api';

const projetCadreService = {
    getAll: async () => {
        try {
            const response = await api.get('/rapports-projet-cadre/');
            console.log('📥 Chargement des rapports projet cadre réussi:', response);
            return response;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des rapports projet cadre:', error);
            throw error;
        }
    },
    getById: async (id) => {
        try {
            const response = await api.get(`/rapports-projet-cadre/${id}/`);
            console.log(`📥 Détail du rapport ${id} chargé:`, response);
            return response;
        } catch (error) {
            console.error(`❌ Erreur chargement rapport ${id}:`, error);
            throw error;
        }
    },
    create: async (data) => {
        try {
            const response = await api.post('/rapports-projet-cadre/', data);
            console.log('✅ Rapport projet cadre créé avec succès:', response);
            return response;
        } catch (error) {
            console.error('❌ Erreur création rapport projet cadre:', error);
            throw error;
        }
    },
    update: async (id, data) => {
        try {
            const response = await api.put(`/rapports-projet-cadre/${id}/`, data);
            console.log(`✅ Rapport ${id} mis à jour:`, response);
            return response;
        } catch (error) {
            console.error(`❌ Erreur mise à jour rapport ${id}:`, error);
            throw error;
        }
    },
    delete: async (id) => {
        try {
            const response = await api.delete(`/rapports-projet-cadre/${id}/`);
            console.log(`✅ Rapport ${id} supprimé`);
            return response;
        } catch (error) {
            console.error(`❌ Erreur suppression rapport ${id}:`, error);
            throw error;
        }
    },
};

export default projetCadreService;