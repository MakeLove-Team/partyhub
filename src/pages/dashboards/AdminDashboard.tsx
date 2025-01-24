import { Container, Title, Grid, Card, Text, Button, Group, Tabs, Table, Badge, LoadingOverlay, Modal, TextInput, Textarea, NumberInput, Paper, Stack, Box } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';
import { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';
import ClubVerificationManagement from '../../components/ClubVerificationManagement';
import { ClubList } from '../../components/ClubList';
import { notifications } from '@mantine/notifications';

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  capacity: number;
  ticketsSold: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  club?: {
    name: string;
  };
  isBlocked: boolean;
}

interface EventForm {
  name: string;
  description: string;
  date: Date;
  price: number;
  capacity: number;
}

type ModalMode = 'edit' | 'details';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('edit');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<EventForm>({
    name: '',
    description: '',
    date: new Date(),
    price: 0,
    capacity: 0
  });
  const [eventFormErrors, setEventFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('Modal state changed:', isEventModalOpen);
  }, [isEventModalOpen]);

  const resetEventForm = () => {
    console.log('Resetting event form');
    setEventForm({
      name: '',
      description: '',
      date: new Date(),
      price: 0,
      capacity: 0
    });
    setEventFormErrors({});
    setIsSubmitting(false);
    setSelectedEventId(null);
    setModalMode('edit');
  };

  const validateEventForm = () => {
    console.log('Validating event form', eventForm);
    const errors: {[key: string]: string} = {};
    
    if (!eventForm.name.trim()) {
      errors.name = 'Nazwa wydarzenia jest wymagana';
    } else if (eventForm.name.length < 3) {
      errors.name = 'Nazwa wydarzenia musi mieć minimum 3 znaki';
    }

    if (!eventForm.description.trim()) {
      errors.description = 'Opis jest wymagany';
    } else if (eventForm.description.length < 10) {
      errors.description = 'Opis musi mieć minimum 10 znaków';
    }

    if (!eventForm.date) {
      errors.date = 'Data jest wymagana';
    }

    if (eventForm.price < 0) {
      errors.price = 'Cena nie może być ujemna';
    }

    if (eventForm.capacity < 1) {
      errors.capacity = 'Liczba miejsc musi być większa od 0';
    } else if (eventForm.capacity > 10000) {
      errors.capacity = 'Maksymalna liczba miejsc to 10000';
    }

    setEventFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchData = async () => {
    if (activeTab === 'overview') {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No auth token');

        const [usersResponse, eventsResponse] = await Promise.all([
          fetch(`${API_URL}/admin/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }),
          fetch(`${API_URL}/admin/events`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          })
        ]);

        if (!usersResponse.ok || !eventsResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [usersData, eventsData] = await Promise.all([
          usersResponse.json(),
          eventsResponse.json()
        ]);

        setUsers(usersData);
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        notifications.show({
          title: 'Błąd',
          message: 'Nie udało się pobrać danych',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleEditEvent = async () => {
    console.log('Attempting to edit event', { selectedEventId, eventForm });
    if (!validateEventForm() || !selectedEventId) {
      console.log('Validation failed or no event selected');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`${API_URL}/events/${selectedEventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      notifications.show({
        title: 'Sukces',
        message: 'Wydarzenie zostało zaktualizowane',
        color: 'green',
      });
      resetEventForm();
      setIsEventModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating event:', error);
      notifications.show({
        title: 'Błąd',
        message: 'Nie udało się zaktualizować wydarzenia',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEventBlock = async (eventId: string, currentBlockedState: boolean) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`${API_URL}/events/${eventId}/toggle-block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle event block status');
      }

      notifications.show({
        title: 'Sukces',
        message: `Wydarzenie zostało ${currentBlockedState ? 'odblokowane' : 'zablokowane'}`,
        color: 'green',
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling event block:', error);
      notifications.show({
        title: 'Błąd',
        message: 'Nie udało się zmienić statusu blokady wydarzenia',
        color: 'red',
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      notifications.show({
        title: 'Sukces',
        message: 'Wydarzenie zostało usunięte',
        color: 'green',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
      notifications.show({
        title: 'Błąd',
        message: 'Nie udało się usunąć wydarzenia',
        color: 'red',
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openEventModal = (event: Event, mode: ModalMode) => {
    console.log(`Opening ${mode} modal for event:`, event._id);
    setSelectedEventId(event._id);
    setEventForm({
      name: event.name,
      description: event.description,
      date: new Date(event.date),
      price: event.price,
      capacity: event.capacity
    });
    setModalMode(mode);
    setIsEventModalOpen(true);
  };

  const renderEventDetails = () => {
    const event = events.find(e => e._id === selectedEventId);
    if (!event) return null;

    return (
      <Paper p="xl" radius="md" withBorder>
        <Group mb={30}>
          <Text size="xl" fw={700}>Szczegóły Wydarzenia</Text>
        </Group>
        <Stack gap={8}>
          <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
            <Group justify="space-between" align="center">
              <Text fw={500} w={120}>Nazwa</Text>
              <Text>{event.name}</Text>
            </Group>
          </Box>
          <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
            <Group justify="space-between" align="center">
              <Text fw={500} w={120}>Data</Text>
              <Text>{new Date(event.date).toLocaleString()}</Text>
            </Group>
          </Box>
          <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
            <Group justify="space-between" align="center">
              <Text fw={500} w={120}>Cena</Text>
              <Text>{event.price} PLN</Text>
            </Group>
          </Box>
          <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
            <Group justify="space-between" align="center">
              <Text fw={500} w={120}>Pojemność</Text>
              <Text>{event.capacity} miejsc</Text>
            </Group>
          </Box>
          <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
            <Group justify="space-between" align="center">
              <Text fw={500} w={120}>Sprzedane bilety</Text>
              <Text>{event.ticketsSold} / {event.capacity}</Text>
            </Group>
          </Box>
          <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
            <Group justify="space-between" align="center">
              <Text fw={500} w={120}>Status</Text>
              <Badge color={
                event.status === 'upcoming' ? 'blue' :
                event.status === 'ongoing' ? 'green' :
                event.status === 'cancelled' ? 'red' : 'gray'
              }>
                {event.status === 'upcoming' ? 'Nadchodzące' :
                 event.status === 'ongoing' ? 'W trakcie' :
                 event.status === 'completed' ? 'Zakończone' :
                 event.status === 'cancelled' ? 'Anulowane' : 'Nieznany'}
              </Badge>
            </Group>
          </Box>
          <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
            <Group justify="space-between" align="center">
              <Text fw={500} w={120}>Klub</Text>
              <Text>{event.club?.name || 'N/A'}</Text>
            </Group>
          </Box>
          <Box style={{ padding: '8px 0' }}>
            <Text fw={500} mb={5}>Opis</Text>
            <Text>{event.description}</Text>
          </Box>
        </Stack>
      </Paper>
    );
  };

  const renderEventForm = () => {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        handleEditEvent();
      }}>
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Nazwa wydarzenia"
              required
              value={eventForm.name}
              onChange={(e) => {
                setEventForm({ ...eventForm, name: e.target.value });
                if (eventFormErrors.name) {
                  setEventFormErrors({ ...eventFormErrors, name: '' });
                }
              }}
              error={eventFormErrors.name}
              mb="md"
              autoComplete="off"
            />
            <DateTimePicker
              label="Data i godzina"
              required
              value={eventForm.date}
              onChange={(date: Date | null) => {
                setEventForm({ ...eventForm, date: date || new Date() });
                if (eventFormErrors.date) {
                  setEventFormErrors({ ...eventFormErrors, date: '' });
                }
              }}
              error={eventFormErrors.date}
              mb="md"
              clearable={false}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <NumberInput
              label="Cena biletu (PLN)"
              required
              min={0}
              value={eventForm.price}
              onChange={(value: number | string) => {
                setEventForm({ ...eventForm, price: typeof value === 'number' ? value : 0 });
                if (eventFormErrors.price) {
                  setEventFormErrors({ ...eventFormErrors, price: '' });
                }
              }}
              error={eventFormErrors.price}
              mb="md"
              hideControls
            />
            <NumberInput
              label="Liczba miejsc"
              required
              min={1}
              max={10000}
              value={eventForm.capacity}
              onChange={(value: number | string) => {
                setEventForm({ ...eventForm, capacity: typeof value === 'number' ? value : 1 });
                if (eventFormErrors.capacity) {
                  setEventFormErrors({ ...eventFormErrors, capacity: '' });
                }
              }}
              error={eventFormErrors.capacity}
              mb="md"
              hideControls
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Textarea
              label="Opis"
              required
              value={eventForm.description}
              onChange={(e) => {
                setEventForm({ ...eventForm, description: e.target.value });
                if (eventFormErrors.description) {
                  setEventFormErrors({ ...eventFormErrors, description: '' });
                }
              }}
              error={eventFormErrors.description}
              minRows={3}
              mb="md"
            />
          </Grid.Col>
        </Grid>
        <Group justify="flex-end" mt="md">
          <Button 
            type="submit" 
            color="blue" 
            loading={isSubmitting}
            disabled={isSubmitting || Object.keys(eventFormErrors).length > 0}
          >
            Zapisz zmiany
          </Button>
        </Group>
      </form>
    );
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Administratora</Title>
        <Button onClick={handleLogout} variant="light">
          Wyloguj
        </Button>
      </Group>

      {isEventModalOpen && (
        <Modal
          opened={true}
          onClose={() => {
            console.log('Closing modal');
            resetEventForm();
            setIsEventModalOpen(false);
          }}
          title={modalMode === 'edit' ? "Edytuj Wydarzenie" : "Szczegóły Wydarzenia"}
          size="lg"
          zIndex={1000}
          withCloseButton
          centered
        >
          {modalMode === 'edit' ? renderEventForm() : renderEventDetails()}
        </Modal>
      )}

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="overview">Przegląd</Tabs.Tab>
          <Tabs.Tab value="verifications">Weryfikacje Klubów</Tabs.Tab>
          <Tabs.Tab value="clubs">Lista Klubów</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview">
          <Grid mt="md">
            <Grid.Col span={12}>
              <LoadingOverlay visible={loading} />
              <Card shadow="sm" p="lg">
                <Title order={3} mb="md">Lista Użytkowników</Title>
                {users.length > 0 ? (
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Nazwa Użytkownika</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Rola</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {users.map((user: any) => (
                        <Table.Tr key={user._id}>
                          <Table.Td>{user.username}</Table.Td>
                          <Table.Td>{user.email}</Table.Td>
                          <Table.Td>{user.role || 'Użytkownik'}</Table.Td>
                          <Table.Td>
                            <Badge color={user.isActive ? 'green' : 'red'}>
                              {user.isActive ? 'Aktywny' : 'Nieaktywny'}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text>Brak użytkowników w systemie</Text>
                )}
              </Card>
            </Grid.Col>

            <Grid.Col span={12}>
              <Card shadow="sm" p="lg" mt="md">
                <Title order={3} mb="md">Lista Wydarzeń</Title>
                {events.length > 0 ? (
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Nazwa Wydarzenia</Table.Th>
                        <Table.Th>Klub</Table.Th>
                        <Table.Th>Data</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Blokada</Table.Th>
                        <Table.Th>Akcje</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {events.map((event: Event) => (
                        <Table.Tr key={event._id}>
                          <Table.Td>{event.name}</Table.Td>
                          <Table.Td>{event.club?.name || 'N/A'}</Table.Td>
                          <Table.Td>{new Date(event.date).toLocaleString()}</Table.Td>
                          <Table.Td>
                            <Badge color={
                              event.status === 'upcoming' ? 'blue' :
                              event.status === 'ongoing' ? 'green' :
                              event.status === 'cancelled' ? 'red' : 'gray'
                            }>
                              {event.status === 'upcoming' ? 'Nadchodzące' :
                               event.status === 'ongoing' ? 'W trakcie' :
                               event.status === 'completed' ? 'Zakończone' :
                               event.status === 'cancelled' ? 'Anulowane' : 'Nieznany'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={event.isBlocked ? 'red' : 'green'}>
                              {event.isBlocked ? 'Zablokowane' : 'Nieaktywna'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Button
                                variant="light"
                                color="blue"
                                size="xs"
                                onClick={() => openEventModal(event, 'details')}
                              >
                                Szczegóły
                              </Button>
                              <Button
                                variant="light"
                                color="blue"
                                size="xs"
                                onClick={() => openEventModal(event, 'edit')}
                              >
                                Edytuj
                              </Button>
                              <Button
                                variant="light"
                                color={event.isBlocked ? 'green' : 'red'}
                                size="xs"
                                onClick={() => handleToggleEventBlock(event._id, event.isBlocked)}
                              >
                                {event.isBlocked ? 'Odblokuj' : 'Zablokuj'}
                              </Button>
                              <Button
                                variant="light"
                                color="red"
                                size="xs"
                                onClick={() => handleDeleteEvent(event._id)}
                              >
                                Usuń
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text>Brak wydarzeń w systemie</Text>
                )}
              </Card>
            </Grid.Col>

            <Grid.Col span={12}>
              <Card shadow="sm" p="lg" mt="md">
                <Title order={3} mb="md">Statystyki Systemu</Title>
                <Grid>
                  <Grid.Col span={6}>
                    <Text>Liczba użytkowników: {users.length}</Text>
                    <Text>Nadchodzące wydarzenia: {events.filter((e) => e.status === 'upcoming').length}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text>Liczba klubów: {events.reduce((acc, e) => e.club ? acc + 1 : acc, 0)}</Text>
                    <Text>Łączna sprzedaż biletów: {events.reduce((acc, e) => acc + (e.ticketsSold || 0), 0)}</Text>
                  </Grid.Col>
                </Grid>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>

        <Tabs.Panel value="verifications">
          <div>
            <Card shadow="sm" p="lg" mt="md">
              <Title order={3} mb="xl">Weryfikacje Klubów</Title>
              <ClubVerificationManagement />
            </Card>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="clubs">
          <div style={{ position: 'static' }}>
            <Card shadow="sm" p="lg" mt="md" style={{ position: 'relative' }}>
              <Title order={3} mb="xl">Lista Klubów</Title>
              <ClubList key={activeTab === 'clubs' ? 'active' : 'inactive'} isAdmin={true} />
            </Card>
          </div>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
};
