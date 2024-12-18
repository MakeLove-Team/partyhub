// src/App.tsx
import { MantineProvider } from '@mantine/core';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AgeVerification } from './components/AgeVerification';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import theme from './theme';
import { useState, useEffect } from 'react';

const App = () => {
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(false);

  useEffect(() => {
    const verified = localStorage.getItem('ageVerified') === 'true';
    setIsAgeVerified(verified);
  }, []);

  if (!isAgeVerified) {
    return (
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <div 
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(145deg, #0A0A0A 0%, #1A1A1A 100%)',
            position: 'relative',
            zIndex: 0
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AgeVerification onVerify={() => setIsAgeVerified(true)} />
          </div>
        </div>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <div 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #0A0A0A 0%, #1A1A1A 100%)',
          position: 'relative',
          zIndex: 0
        }}
      >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </MantineProvider>
  );
};

export default App;
