import { UserRole } from '../models/User';
import { notifications } from '@mantine/notifications';
import { API_URL } from '../config/api';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

// Store token in localStorage
const setToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

// Store user data in localStorage
const setUserData = (user: AuthResponse['user']) => {
  localStorage.setItem('userData', JSON.stringify(user));
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('authToken');
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      if (response.status === 0) {
        throw new Error('Nie można połączyć się z serwerem. Sprawdź czy serwer jest uruchomiony.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Błąd rejestracji');
    }

    const responseData = await response.json();
    setToken(responseData.token);
    setUserData(responseData.user);
    notifications.show({
      title: 'Sukces',
      message: 'Rejestracja zakończona pomyślnie',
      color: 'green',
    });
    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Przekroczono limit czasu połączenia. Sprawdź czy serwer jest uruchomiony.');
      }
      notifications.show({
        title: 'Błąd',
        message: error.message,
        color: 'red',
      });
      throw error;
    }
    throw new Error('Wystąpił nieznany błąd');
  }
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      if (response.status === 0) {
        throw new Error('Nie można połączyć się z serwerem. Sprawdź czy serwer jest uruchomiony.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Błąd logowania');
    }

    const responseData = await response.json();
    setToken(responseData.token);
    setUserData(responseData.user);
    notifications.show({
      title: 'Sukces',
      message: 'Logowanie zakończone pomyślnie',
      color: 'green',
    });
    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Przekroczono limit czasu połączenia. Sprawdź czy serwer jest uruchomiony.');
      }
      notifications.show({
        title: 'Błąd',
        message: error.message,
        color: 'red',
      });
      throw error;
    }
    throw new Error('Wystąpił nieznany błąd');
  }
};

// Function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

// Function to get user role from token
export const getUserRole = (): UserRole | null => {
  const userDataStr = localStorage.getItem('userData');
  if (!userDataStr) return null;
  
  try {
    const userData = JSON.parse(userDataStr);
    return userData.role;
  } catch {
    return null;
  }
};

// Logout function with server call
export const logout = async () => {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
    notifications.show({
      title: 'Sukces',
      message: 'Wylogowano pomyślnie',
      color: 'green',
    });
  } catch (error) {
    console.error('Logout error:', error);
    notifications.show({
      title: 'Błąd',
      message: 'Wystąpił błąd podczas wylogowywania',
      color: 'red',
    });
  } finally {
    removeToken();
    window.location.href = '/login';
  }
};
