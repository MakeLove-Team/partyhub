// src/pages/Register.tsx
import { TextInput, PasswordInput, Button, Box, Title, Text, Container } from '@mantine/core';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { register } from '../api/auth';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
}

const inputStyles = {
  input: {
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 0, 0, 0.2)',
    color: '#ffffff',
    '&:focus': {
      border: '1px solid rgba(255, 0, 0, 0.5)',
    }
  },
  label: {
    color: '#ffffff'
  }
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      username: ''
    },
    validate: {
      email: (value: string) => (/^\S+@\S+$/.test(value) ? null : 'Nieprawidłowy adres email'),
      username: (value: string) => (
        value.length >= 3 ? null : 'Nazwa użytkownika musi mieć minimum 3 znaki'
      ),
      password: (value: string) => (
        value.length >= 6 ? null : 'Hasło musi mieć minimum 6 znaków'
      ),
      confirmPassword: (value: string, values: RegisterForm) => (
        value === values.password ? null : 'Hasła nie są identyczne'
      ),
    }
  });

  const handleSubmit = async (values: RegisterForm) => {
    try {
      setError('');
      setIsLoading(true);

      await register({
        username: values.username,
        email: values.email,
        password: values.password
      });

      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas rejestracji. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box style={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatedBackground />
      <Container size="xs" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box
          style={{
            width: '100%',
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
              height: 4,
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

          <form onSubmit={form.onSubmit(handleSubmit)}>
            {error && (
              <Text color="red" mb="md" ta="center" style={{ color: '#ff0000' }}>
                {error}
              </Text>
            )}

            <TextInput
              label="Nazwa użytkownika"
              placeholder="Nazwa użytkownika"
              {...form.getInputProps('username')}
              mb="md"
              styles={inputStyles}
            />

            <TextInput
              label="Email"
              placeholder="Email"
              {...form.getInputProps('email')}
              mb="md"
              styles={inputStyles}
            />

            <PasswordInput
              label="Hasło"
              placeholder="Hasło"
              {...form.getInputProps('password')}
              mb="md"
              styles={inputStyles}
            />

            <PasswordInput
              label="Powtórz hasło"
              placeholder="Powtórz hasło"
              {...form.getInputProps('confirmPassword')}
              mb="xl"
              styles={inputStyles}
            />

            <Container p={0}>
              <Button 
                type="submit"
                fullWidth
                mb="md"
                loading={isLoading}
                styles={() => ({
                  root: {
                    background: 'linear-gradient(45deg, #FF0000, #FF4444)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #FF4444, #FF0000)',
                    }
                  }
                })}
              >
                ZAREJESTRUJ SIĘ
              </Button>

              <Button 
                variant="subtle"
                fullWidth
                onClick={() => navigate('/')}
                disabled={isLoading}
                styles={() => ({
                  root: {
                    color: '#FF4444',
                    '&:hover': {
                      background: 'transparent',
                      color: '#FF0000'
                    }
                  }
                })}
              >
                POWRÓT DO LOGOWANIA
              </Button>
            </Container>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
