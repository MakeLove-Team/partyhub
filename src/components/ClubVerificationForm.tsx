import { TextInput, Textarea, Button, Box, Title, Text, Container, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/auth';

interface ClubVerificationFormData {
  clubName: string;
  address: string;
  nip: string;
  regon: string;
  description: string;
  openingHours: string;
  phoneNumber: string;
}

interface ValidationErrors {
  [key: string]: string[];
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

export const ClubVerificationForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<boolean>(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Błąd połączenia z serwerem');
        
        const data = await response.json();
        setServerStatus(data.status === 'ok' && data.mongoConnection);
      } catch (err) {
        setServerStatus(false);
        console.error('Server check failed:', err);
      }
    };
    
    const interval = setInterval(checkServer, 30000);
    checkServer();
    
    return () => clearInterval(interval);
  }, []);

  const form = useForm({
    initialValues: {
      clubName: '',
      address: '',
      nip: '',
      regon: '',
      description: '',
      openingHours: '',
      phoneNumber: ''
    },
    validate: {
      clubName: (value) => (value.length >= 3 ? null : 'Nazwa klubu musi mieć minimum 3 znaki'),
      address: (value) => (value.length > 0 ? null : 'Adres jest wymagany'),
      nip: (value) => (/^\d{10}$/.test(value) ? null : 'Nieprawidłowy format NIP'),
      regon: (value) => (/^\d{9}$/.test(value) ? null : 'Nieprawidłowy format REGON'),
      description: (value) => (value.length >= 10 ? null : 'Opis musi mieć minimum 10 znaków'),
      openingHours: (value) => (value.length > 0 ? null : 'Godziny otwarcia są wymagane'),
      phoneNumber: (value) => (/^\d{9}$/.test(value) ? null : 'Nieprawidłowy format numeru telefonu')
    }
  });

  const handleSubmit = async (values: ClubVerificationFormData) => {
    try {
      setError('');
      setValidationErrors({});
      setIsLoading(true);

      if (!serverStatus) {
        throw new Error('Serwer jest niedostępny. Spróbuj ponownie później.');
      }

      const token = getToken();
      if (!token) {
        navigate('/login');
        throw new Error('Nie jesteś zalogowany. Przekierowuję do strony logowania...');
      }

      const response = await fetch('http://localhost:3001/api/club-verification', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.errors) {
          const formattedErrors: ValidationErrors = {};
          if (Array.isArray(data.errors)) {
            data.errors.forEach((error: string) => {
              const [field] = error.split(' ');
              if (!formattedErrors[field]) formattedErrors[field] = [];
              formattedErrors[field].push(error);
            });
          } else {
            Object.entries(data.errors).forEach(([key, value]) => {
              formattedErrors[key] = Array.isArray(value) ? value : [value as string];
            });
          }
          setValidationErrors(formattedErrors);
          throw new Error('Nieprawidłowe dane formularza');
        } else if (response.status === 401) {
          navigate('/login');
          throw new Error('Sesja wygasła. Przekierowuję do strony logowania...');
        } else {
          throw new Error(data.message || 'Wystąpił błąd podczas wysyłania formularza');
        }
      }

      // If we get here, the submission was successful
      navigate('/dashboard/pending-verification');
    } catch (err) {
      console.error('Club verification error:', err);
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas wysyłania formularza');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box style={{ position: 'relative', minHeight: '100vh' }}>
      <Container size="xs" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
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
          <Title 
            order={2} 
            ta="center" 
            mb={30}
            style={{ 
              color: '#FF0000',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Weryfikacja Klubu
          </Title>

          {!serverStatus && (
            <Alert color="red" mb="md">
              Serwer jest niedostępny. Spróbuj ponownie później.
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            {error && (
              <Alert color="red" mb="md">
                {error}
              </Alert>
            )}

            <TextInput
              label="Nazwa klubu"
              placeholder="Wprowadź nazwę klubu"
              {...form.getInputProps('clubName')}
              error={validationErrors.clubName?.[0]}
              mb="md"
              styles={inputStyles}
            />

            <TextInput
              label="Adres"
              placeholder="Wprowadź adres klubu"
              {...form.getInputProps('address')}
              error={validationErrors.address?.[0]}
              mb="md"
              styles={inputStyles}
            />

            <TextInput
              label="NIP"
              placeholder="Wprowadź NIP (10 cyfr)"
              {...form.getInputProps('nip')}
              error={validationErrors.nip?.[0]}
              mb="md"
              styles={inputStyles}
            />

            <TextInput
              label="REGON"
              placeholder="Wprowadź REGON (9 cyfr)"
              {...form.getInputProps('regon')}
              error={validationErrors.regon?.[0]}
              mb="md"
              styles={inputStyles}
            />

            <Textarea
              label="Opis klubu"
              placeholder="Wprowadź opis klubu"
              {...form.getInputProps('description')}
              error={validationErrors.description?.[0]}
              mb="md"
              minRows={4}
              styles={inputStyles}
            />

            <TextInput
              label="Godziny otwarcia"
              placeholder="np. Pon-Pt: 18:00-4:00, Sob-Nd: 20:00-6:00"
              {...form.getInputProps('openingHours')}
              error={validationErrors.openingHours?.[0]}
              mb="md"
              styles={inputStyles}
            />

            <TextInput
              label="Numer telefonu"
              placeholder="Wprowadź numer telefonu (9 cyfr)"
              {...form.getInputProps('phoneNumber')}
              error={validationErrors.phoneNumber?.[0]}
              mb="xl"
              styles={inputStyles}
            />

            <Button 
              type="submit"
              fullWidth
              mb="md"
              loading={isLoading}
              disabled={!serverStatus}
              styles={() => ({
                root: {
                  background: 'linear-gradient(45deg, #FF0000, #FF4444)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #FF4444, #FF0000)',
                  }
                }
              })}
            >
              WYŚLIJ FORMULARZ
            </Button>

            <Button 
              variant="subtle"
              fullWidth
              onClick={() => navigate(-1)}
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
              POWRÓT
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default ClubVerificationForm;
