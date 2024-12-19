import { Container, Title, Grid, Card, Text, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Administratora</Title>
        <Button onClick={logout} variant="light">
          Wyloguj
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Użytkownicy</Title>
            <Text mb="md">Zarządzaj użytkownikami systemu</Text>
            <Button fullWidth variant="filled" color="red">
              Lista Użytkowników
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Kluby</Title>
            <Text mb="md">Zarządzaj klubami w systemie</Text>
            <Button fullWidth variant="filled" color="red">
              Lista Klubów
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Wydarzenia</Title>
            <Text mb="md">Przeglądaj wszystkie wydarzenia</Text>
            <Button fullWidth variant="filled" color="red">
              Lista Wydarzeń
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Statystyki Systemu</Title>
            <Text>Liczba użytkowników: 0</Text>
            <Text>Liczba klubów: 0</Text>
            <Text>Aktywne wydarzenia: 0</Text>
            <Text>Łączna sprzedaż biletów: 0</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Logi Systemowe</Title>
            <Text>Brak logów do wyświetlenia</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
