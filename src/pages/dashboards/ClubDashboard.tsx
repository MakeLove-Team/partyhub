import { Container, Title, Grid, Card, Text, Button, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';

export const ClubDashboard = () => {
  const navigate = useNavigate();

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Klubu</Title>
        <Button onClick={logout} variant="light">
          Wyloguj
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Moje Wydarzenia</Title>
            <Text mb="md">Brak utworzonych wydarzeń</Text>
            <Button fullWidth variant="filled" color="red">
              Dodaj Wydarzenie
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Statystyki</Title>
            <Text>Sprzedane bilety: 0</Text>
            <Text>Aktywne wydarzenia: 0</Text>
            <Text>Przychód: 0 PLN</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={4}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Profil Klubu</Title>
            <Text mb="md">Uzupełnij informacje o swoim klubie</Text>
            <Button fullWidth variant="light" color="red">
              Edytuj Profil
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Rezerwacje</Title>
            <Text>Brak aktywnych rezerwacji</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
