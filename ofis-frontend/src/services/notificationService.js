import axiosInstance from './axiosConfig';

export const getNotifications = () => {
  return axiosInstance.get('/notifications/');  // plus de /api/
};

export const markAsRead = (id) => {
  return axiosInstance.post(`/notifications/${id}/mark-read/`);
};

export const getUnreadCount = () => {
  return axiosInstance.get('/notifications/unread-count/');
};