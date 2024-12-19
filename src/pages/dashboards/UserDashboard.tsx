import { Container, Title, Grid, Card, Text, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';

export const UserDashboard = () => {
  const navigate = useNavigate();

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Użytkownika</Title>
        <Button onClick={logout} variant="light">
          Wyloguj
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Nadchodzące Wydarzenia</Title>
            <Text>Brak nadchodzących wydarzeń</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Popularne Kluby</Title>
            <Text>Brak klubów do wyświetlenia</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Moje Bilety</Title>
            <Text>Brak zakupionych biletów</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
