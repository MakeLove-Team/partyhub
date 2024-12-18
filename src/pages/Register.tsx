// src/pages/Register.tsx
import { TextInput, PasswordInput, Button, Box, Title } from '@mantine/core';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });

  const sharedInputStyles = {
    root: {
      width: '100%'
    },
    input: {
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 0, 0, 0.2)',
      borderRadius: 0,
      color: 'white',
      padding: '0 20px',
      fontSize: '16px',
      height: '50px',
      width: '100%',
      lineHeight: '50px',
      transition: 'all 0.3s ease',
      '&:focus': {
        border: '1px solid rgba(255, 0, 0, 0.5)',
        boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)'
      },
      '&::placeholder': {
        color: '#666'
      }
    },
    wrapper: {
      width: '100%'
    }
  };

  return (
    <Box style={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatedBackground />
      <Box
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1
        }}
      >
        <Box
          style={{
            width: '100%',
            maxWidth: 450,
            padding: '50px 40px',
            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95), rgba(30, 30, 30, 0.9))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 0, 0, 0.1)',
            boxShadow: '0 0 30px rgba(255, 0, 0, 0.1)',
            position: 'relative',
          }}
        >
          <Box 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, #FF0000, transparent)',
            }}
          />
          
          <Title 
            order={1} 
            ta="center" 
            mb={50}
            style={{ 
              color: '#FF0000',
              fontSize: '3.5rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '4px',
              fontFamily: '"Orbitron", sans-serif',
              textShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
            }}
          >
            PARTYHUB
          </Title>

          <Box style={{ width: '100%' }}>
            <TextInput
              placeholder="Nazwa użytkownika"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              mb={25}
              styles={sharedInputStyles}
            />

            <TextInput
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              mb={25}
              styles={sharedInputStyles}
            />

            <PasswordInput
              placeholder="Hasło"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              mb={25}
              styles={sharedInputStyles}
            />

            <PasswordInput
              placeholder="Powtórz hasło"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              mb={40}
              styles={sharedInputStyles}
            />
          </Box>

          <Button 
            fullWidth
            style={{
              background: 'linear-gradient(45deg, #FF0000, #FF4444)',
              border: 'none',
              borderRadius: 0,
              padding: '10px 30px',
              height: 45,
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '1px',
              marginBottom: '20px',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF4444, #FF0000)',
                boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)'
              }
            }}
          >
            ZAREJESTRUJ SIĘ
          </Button>

          <Button 
            variant="subtle"
            fullWidth
            onClick={() => navigate('/')}
            style={{
              color: '#FF4444',
              '&:hover': {
                background: 'transparent',
                color: '#FF0000'
              }
            }}
          >
            POWRÓT DO LOGOWANIA
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;