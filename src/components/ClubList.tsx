import { useEffect, useState } from 'react';
import { Card, Text, Button, Title, Box, Loader, Grid, Badge, Group, Stack, Paper, LoadingOverlay, Modal } from '@mantine/core';
import axiosInstance from '../api/axiosConfig';

interface Club {
  _id: string;
  clubName: string;
  address: string;
  description: string;
  openingHours: string;
  phoneNumber: string;
  nip: string;
  regon: string;
  status: 'approved' | 'rejected' | 'pending';
  isBanned: boolean;
  rating?: number;
  upcomingEvents?: number;
}

interface ClubListProps {
  isAdmin?: boolean;
}

export const ClubList = ({ isAdmin: isAdminProp = true }: ClubListProps) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(isAdminProp);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clubToDelete, setClubToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsAdmin(isAdminProp);
  }, [isAdminProp]);

  const fetchClubs = async () => {
    try {
      const response = await axiosInstance.get('/clubs/public');
      setClubs(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('Wystąpił błąd podczas pobierania listy klubów. Spróbuj odświeżyć stronę.');
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchClubs();
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'yellow';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'approved': return 'ZATWIERDZONY';
      case 'rejected': return 'ODRZUCONY';
      default: return 'OCZEKUJĄCY';
    }
  };

  const handleBanClub = async (clubId: string) => {
    setLoadingClubId(clubId);
    try {
      await axiosInstance.post(`/clubs/${clubId}/ban`);
      await fetchClubs();
    } catch (error) {
      console.error('Error banning club:', error);
      setError('Wystąpił błąd podczas blokowania klubu.');
    } finally {
      setLoadingClubId(null);
    }
  };

  const handleUnbanClub = async (clubId: string) => {
    setLoadingClubId(clubId);
    try {
      await axiosInstance.post(`/clubs/${clubId}/unban`);
      await fetchClubs();
    } catch (error) {
      console.error('Error unbanning club:', error);
      setError('Wystąpił błąd podczas odblokowania klubu.');
    } finally {
      setLoadingClubId(null);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    setClubToDelete(clubId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!clubToDelete) return;
    
    setLoadingClubId(clubToDelete);
    try {
      await axiosInstance.delete(`/clubs/${clubToDelete}`);
      await fetchClubs();
      setShowDeleteConfirm(false);
      setClubToDelete(null);
      if (selectedClub?._id === clubToDelete) {
        setSelectedClub(null);
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      setError('Wystąpił błąd podczas usuwania klubu.');
    } finally {
      setLoadingClubId(null);
    }
  };

  const handleViewDetails = (club: Club) => {
    setSelectedClub(club);
  };

  const handleBack = () => {
    setSelectedClub(null);
  };

  const renderClubDetails = (club: Club) => {
    return (
      <Paper p="xl" radius="md" withBorder>
        <Group mb={30}>
          <Button variant="light" onClick={handleBack}>
            Cofnij
          </Button>
          <Text size="xl" fw={700}>Szczegóły Klubu</Text>
        </Group>
        <Box pos="relative">
          <LoadingOverlay visible={loadingClubId === club._id} overlayProps={{ blur: 2 }} />
          <Stack gap={8} mb={30}>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Nazwa Klubu</Text>
                <Text>{club.clubName}</Text>
              </Group>
            </Box>

            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Status</Text>
                <Group gap={8}>
                  <Badge color={getStatusColor(club.status)}>
                    {getStatusText(club.status)}
                  </Badge>
                  {club.isBanned && (
                    <Badge color="red">
                      Zablokowany
                    </Badge>
                  )}
                </Group>
              </Group>
            </Box>

            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Adres</Text>
                <Text>{club.address}</Text>
              </Group>
            </Box>

            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>NIP</Text>
                <Text>{club.nip}</Text>
              </Group>
            </Box>

            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>REGON</Text>
                <Text>{club.regon}</Text>
              </Group>
            </Box>

            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Numer Telefonu</Text>
                <Text>{club.phoneNumber}</Text>
              </Group>
            </Box>

            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Godziny Otwarcia</Text>
                <Text>{club.openingHours}</Text>
              </Group>
            </Box>

            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Opis</Text>
                <Text style={{ flex: 1 }}>{club.description}</Text>
              </Group>
            </Box>

            {club.upcomingEvents !== undefined && (
              <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
                <Group justify="space-between" align="center">
                  <Text fw={500} w={120}>Wydarzenia</Text>
                  <Text>{club.upcomingEvents}</Text>
                </Group>
              </Box>
            )}

            {club.rating !== undefined && (
              <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
                <Group justify="space-between" align="center">
                  <Text fw={500} w={120}>Ocena</Text>
                  <Text>{club.rating.toFixed(1)}/5.0</Text>
                </Group>
              </Box>
            )}

            {isAdmin && (
              <Group justify="flex-end" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20 }}>
                {club.isBanned ? (
                  <Button
                    variant="light"
                    color="green"
                    onClick={() => handleUnbanClub(club._id)}
                    loading={loadingClubId === club._id}
                  >
                    Odblokuj
                  </Button>
                ) : (
                  <Button
                    variant="light"
                    color="orange"
                    onClick={() => handleBanClub(club._id)}
                    loading={loadingClubId === club._id}
                  >
                    Zablokuj
                  </Button>
                )}
                <Button
                  variant="light"
                  color="red"
                  onClick={() => handleDeleteClub(club._id)}
                  loading={loadingClubId === club._id}
                >
                  Usuń
                </Button>
              </Group>
            )}
          </Stack>
        </Box>
      </Paper>
    );
  };

  const renderContent = () => {
    if (error) {
      return (
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Box ta="center">
            <Text color="red" size="md" mb="md">{error}</Text>
            <Button 
              variant="light" 
              color="blue" 
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchClubs();
              }}
            >
              Spróbuj ponownie
            </Button>
          </Box>
        </Card>
      );
    }

    if (loading) {
      return (
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Box ta="center">
            <Loader size="md" variant="dots" />
            <Text mt="md" size="sm" color="dimmed">Ładowanie klubów...</Text>
          </Box>
        </Card>
      );
    }

    if (clubs.length === 0) {
      return (
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Box ta="center">
            <Text size="md" color="dimmed">Brak klubów</Text>
          </Box>
        </Card>
      );
    }

    if (selectedClub) {
      return renderClubDetails(selectedClub);
    }

    return (
      <Grid>
        {clubs.map((club) => (
          <Grid.Col key={club._id} span={{ base: 12, sm: 6, md: 4 }}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={500} size="lg">{club.clubName}</Text>
                <Group gap={8}>
                  <Badge color={getStatusColor(club.status)}>
                    {getStatusText(club.status)}
                  </Badge>
                  {club.isBanned && (
                    <Badge color="red">
                      Zablokowany
                    </Badge>
                  )}
                </Group>
              </Group>

              <Text size="sm" color="dimmed" mb="md">
                {club.address}
              </Text>

              <Text lineClamp={3} mb="md">
                {club.description}
              </Text>

              <Text size="sm" mb="md">
                <strong>Godziny otwarcia:</strong> {club.openingHours}
              </Text>

              {club.upcomingEvents !== undefined && (
                <Text size="sm" mb="xs">
                  <strong>Nadchodzące wydarzenia:</strong> {club.upcomingEvents}
                </Text>
              )}

              {club.rating !== undefined && (
                <Text size="sm" mb="md">
                  <strong>Ocena:</strong> {club.rating.toFixed(1)}/5.0
                </Text>
              )}

              <Stack gap="xs">
                <Button
                  variant="light"
                  color="blue"
                  fullWidth
                  onClick={() => handleViewDetails(club)}
                >
                  Szczegóły
                </Button>
                
                {isAdmin && (
                  <Group grow>
                    {club.isBanned ? (
                      <Button
                        variant="light"
                        color="green"
                        onClick={() => handleUnbanClub(club._id)}
                        loading={loadingClubId === club._id}
                      >
                        Odblokuj
                      </Button>
                    ) : (
                      <Button
                        variant="light"
                        color="orange"
                        onClick={() => handleBanClub(club._id)}
                        loading={loadingClubId === club._id}
                      >
                        Zablokuj
                      </Button>
                    )}
                    <Button
                      variant="light"
                      color="red"
                      onClick={() => handleDeleteClub(club._id)}
                      loading={loadingClubId === club._id}
                    >
                      Usuń
                    </Button>
                  </Group>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    );
  };

  return (
    <Box>
      <Title order={2} mb="xl">Lista Klubów</Title>
      {renderContent()}
      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Potwierdź usunięcie"
        centered
      >
        <Text size="sm" mb="lg">
          Czy na pewno chcesz usunąć ten klub? Tej operacji nie można cofnąć.
        </Text>
        <Group justify="flex-end">
          <Button variant="light" onClick={() => setShowDeleteConfirm(false)}>
            Anuluj
          </Button>
          <Button color="red" onClick={confirmDelete} loading={loadingClubId === clubToDelete}>
            Usuń
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};
