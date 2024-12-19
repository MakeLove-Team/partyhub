import { Box, Container, Title, Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '../components/AnimatedBackground';

export const PendingVerification: React.FC = () => {
  const navigate = useNavigate();

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
            Weryfikacja w toku
          </Title>

          <Text 
            ta="center" 
            mb={30}
            style={{ color: '#ffffff' }}
          >
            Twój wniosek o weryfikację klubu został przesłany do administratora. 
            Zostaniesz powiadomiony o decyzji poprzez email.
          </Text>

          <Text 
            ta="center" 
            mb={50}
            style={{ color: '#ffffff' }}
          >
            W międzyczasie możesz korzystać z konta użytkownika z ograniczonymi uprawnieniami.
          </Text>

          <Button 
            fullWidth
            onClick={() => navigate('/dashboard/user')}
            styles={() => ({
              root: {
                background: 'linear-gradient(45deg, #FF0000, #FF4444)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FF4444, #FF0000)',
                }
              }
            })}
          >
            PRZEJDŹ DO PANELU UŻYTKOWNIKA
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default PendingVerification;
