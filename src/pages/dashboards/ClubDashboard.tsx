import { Container, Title, Button, Group, Card, Grid, Text, LoadingOverlay } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { logout, getToken } from '../../api/auth';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { API_URL } from '../../config/api';

interface ClubDetails {
  clubName: string;
  address: string;
  nip: string;
  regon: string;
  description: string;
  openingHours: string;
  phoneNumber: string;
  verificationDate: string;
}

export const ClubDashboard = () => {
  const navigate = useNavigate();
  const [clubDetails, setClubDetails] = useState<ClubDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        const token = getToken();
        if (!token) {
          notifications.show({
            title: 'Błąd',
            message: 'Brak autoryzacji. Zaloguj się ponownie.',
            color: 'red',
          });
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_URL}/club/details`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Nie udało się pobrać danych klubu');
        }

        const data = await response.json();
        setClubDetails(data);
      } catch (error) {
        console.error('Error fetching club details:', error);
        notifications.show({
          title: 'Błąd',
          message: error instanceof Error ? error.message : 'Nie udało się pobrać danych klubu',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClubDetails();
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Container size="lg" py="xl" pos="relative">
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Klubu</Title>
        <Button onClick={handleLogout} variant="light">
          Wyloguj
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Informacje o Klubie</Title>
            {loading ? (
              <Text>Ładowanie...</Text>
            ) : clubDetails ? (
              <>
                <Text><strong>Nazwa:</strong> {clubDetails.clubName}</Text>
                <Text><strong>Adres:</strong> {clubDetails.address}</Text>
                <Text><strong>NIP:</strong> {clubDetails.nip}</Text>
                <Text><strong>REGON:</strong> {clubDetails.regon}</Text>
                <Text><strong>Telefon:</strong> {clubDetails.phoneNumber}</Text>
                <Text><strong>Godziny otwarcia:</strong> {clubDetails.openingHours}</Text>
                <Text mt="md"><strong>Opis:</strong></Text>
                <Text>{clubDetails.description}</Text>
                <Text mt="md"><strong>Data weryfikacji:</strong> {new Date(clubDetails.verificationDate).toLocaleDateString()}</Text>
              </>
            ) : (
              <Text c="red">Nie udało się załadować danych klubu</Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Zarządzanie Wydarzeniami</Title>
            <Text mb="md">
              Twórz i zarządzaj wydarzeniami w swoim klubie
            </Text>
            <Button 
              fullWidth 
              variant="filled" 
              color="red"
              onClick={() => {
                notifications.show({
                  title: 'Info',
                  message: 'Funkcja dodawania wydarzeń będzie dostępna wkrótce',
                  color: 'blue',
                });
              }}
            >
              Dodaj Wydarzenie
            </Button>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Nadchodzące Wydarzenia</Title>
            <Text>Brak nadchodzących wydarzeń</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Statystyki</Title>
            <Text>Liczba wydarzeń: 0</Text>
            <Text>Sprzedane bilety: 0</Text>
            <Text>Średnia ocena: -</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Opinie</Title>
            <Text>Brak opinii</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
