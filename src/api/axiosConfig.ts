import axios from 'axios';
import { API_URL } from '../config/api';
import { notifications } from '@mantine/notifications';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          notifications.show({
            title: 'Błąd autoryzacji',
            message: 'Sesja wygasła. Zaloguj się ponownie.',
            color: 'red',
          });
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/login';
          break;
        case 403:
          notifications.show({
            title: 'Brak uprawnień',
            message: 'Nie masz uprawnień do wykonania tej operacji.',
            color: 'red',
          });
          break;
        default:
          notifications.show({
            title: 'Błąd',
            message: error.response.data.message || 'Wystąpił błąd podczas komunikacji z serwerem.',
            color: 'red',
          });
      }
    } else if (error.request) {
      notifications.show({
        title: 'Błąd połączenia',
        message: 'Nie można połączyć się z serwerem.',
        color: 'red',
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
