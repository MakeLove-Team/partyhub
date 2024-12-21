// src/App.tsx
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AgeVerification } from './components/AgeVerification';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { UserDashboard } from './pages/dashboards/UserDashboard';
import { ClubDashboard } from './pages/dashboards/ClubDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { ClubVerificationForm } from './components/ClubVerificationForm';
import { PendingVerification } from './pages/PendingVerification';
import theme from './theme';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('authToken');
  const userDataStr = localStorage.getItem('userData');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);
      if (!allowedRoles.includes(userData.role)) {
        return <Navigate to="/dashboard" replace />;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

const App = () => {
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(false);

  useEffect(() => {
    const verified = localStorage.getItem('ageVerified') === 'true';
    setIsAgeVerified(verified);
  }, []);

  if (!isAgeVerified) {
    return (
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <ModalsProvider>
          <Notifications position="top-right" />
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
        </ModalsProvider>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-right" />
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
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/user" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/club" 
              element={
                <ProtectedRoute allowedRoles={['club']}>
                  <ClubDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/club-verification" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <ClubVerificationForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pending-verification" 
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <PendingVerification />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
      </ModalsProvider>
    </MantineProvider>
  );
};

export default App;
