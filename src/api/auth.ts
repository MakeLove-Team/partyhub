import { UserRole } from '../models/User';

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
    const response = await fetch('http://localhost:3001/api/auth/register', {
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
    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Przekroczono limit czasu połączenia. Sprawdź czy serwer jest uruchomiony.');
      }
      throw error;
    }
    throw new Error('Wystąpił nieznany błąd');
  }
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
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
    return responseData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Przekroczono limit czasu połączenia. Sprawdź czy serwer jest uruchomiony.');
      }
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
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
    window.location.href = '/login';
  }
};
