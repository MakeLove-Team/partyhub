import { Container, Title, Grid, Card, Text, Button, Group, Tabs } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';
import { ClubVerificationManagement } from '../../components/ClubVerificationManagement';
import { useState } from 'react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('verifications');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Administratora</Title>
        <Button onClick={handleLogout} variant="light">
          Wyloguj
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'verifications')} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="overview">Przegląd</Tabs.Tab>
          <Tabs.Tab value="verifications">Weryfikacje Klubów</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview">
          <Grid mt="md">
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
        </Tabs.Panel>

        <Tabs.Panel value="verifications">
          <Card shadow="sm" p="lg" mt="md">
            <Title order={3} mb="xl">Weryfikacje Klubów</Title>
            <ClubVerificationManagement />
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
