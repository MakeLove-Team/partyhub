import { Container, Title, Button, Group, Card, Grid, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';

export const UserDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleClubVerification = () => {
    navigate('/club-verification');
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Użytkownika</Title>
        <Button onClick={handleLogout} variant="light">
          Wyloguj
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Zostań Właścicielem Klubu</Title>
            <Text mb="md">
              Prowadzisz klub nocny? Dołącz do naszej platformy i zarządzaj swoim klubem online!
            </Text>
            <Button 
              fullWidth 
              variant="filled" 
              color="red"
              onClick={handleClubVerification}
            >
              Zweryfikuj Klub
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Moje Bilety</Title>
            <Text mb="md">
              Przeglądaj swoje zakupione bilety na wydarzenia
            </Text>
            <Button fullWidth variant="filled" color="red">
              Zobacz Bilety
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Nadchodzące Wydarzenia</Title>
            <Text>Brak nadchodzących wydarzeń</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
