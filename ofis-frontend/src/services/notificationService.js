import axiosInstance from './axiosConfig';

export const getNotifications = () => {
  return axiosInstance.get('/notifications/');
};

export const markAsRead = (id) => {
  return axiosInstance.post(`/notifications/${id}/marquer_lue/`);  // ← corrigé
};

export const getUnreadCount = () => {
  return axiosInstance.get('/notifications/unread_count/');  // ← corrigé (tiret bas)
};