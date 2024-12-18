interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const register = async (data: RegisterData): Promise<any> => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      // Add error handling for network issues
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      if (response.status === 0) {
        throw new Error('Nie można połączyć się z serwerem. Sprawdź czy serwer jest uruchomiony.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Błąd rejestracji');
    }

    return response.json();
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

export const login = async (data: LoginData): Promise<any> => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      // Add error handling for network issues
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      if (response.status === 0) {
        throw new Error('Nie można połączyć się z serwerem. Sprawdź czy serwer jest uruchomiony.');
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Błąd logowania');
    }

    return response.json();
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
