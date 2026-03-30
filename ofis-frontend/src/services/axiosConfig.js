import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Configuration de base
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token automatiquement
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ofis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;