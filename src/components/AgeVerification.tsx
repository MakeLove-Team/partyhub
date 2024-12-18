// src/components/AgeVerification.tsx
import { Button, Container, Title, Text, Space, Box } from '@mantine/core';

const AGE_VERIFICATION_KEY = 'ageVerified';

interface AgeVerificationProps {
  onVerify: () => void;
}

export const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerify }) => {
  const handleVerify = (): void => {
    localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
    onVerify();
  };

  const handleLeave = (): void => {
    window.location.href = 'https://google.com';
  };

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
      }}
    >
      <Container
        size="xs"
        style={{
          backgroundColor: '#1A1B1E',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 0, 0, 0.2)',
        }}
      >
        <Title 
          order={2} 
          ta="center"
          style={{
            color: '#FF0000',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Weryfikacja wieku
        </Title>
        
        <Space h="md" />
        
        <Text ta="center" style={{ color: '#fff' }}>
          Musisz mieć ukończone 18 lat, aby korzystać z tej aplikacji.
        </Text>
        
        <Space h="xl" />
        
        <Button 
          onClick={handleVerify} 
          size="lg" 
          fullWidth
          styles={{
            root: {
              background: 'linear-gradient(45deg, #FF0000, #FF4444)',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF4444, #FF0000)',
              }
            }
          }}
        >
          Mam ukończone 18 lat
        </Button>
        
        <Space h="md" />
        
        <Button 
          variant="subtle"
          onClick={handleLeave}
          fullWidth
          styles={{
            root: {
              color: '#FF4444',
              '&:hover': {
                background: 'transparent',
                color: '#FF0000'
              }
            }
          }}
        >
          Opuść stronę
        </Button>
      </Container>
    </Box>
  );
};
