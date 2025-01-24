import { Container, Title, Button, Group, Card, Grid, Text, LoadingOverlay, TextInput, Textarea, NumberInput, Table, Badge } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { useNavigate } from 'react-router-dom';
import { logout, getToken } from '../../api/auth';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import axiosInstance from '../../api/axiosConfig';
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  message: string;
  errors?: string[];
}

interface Event {
  _id: string;
  name: string;
  description: string;
  date: string;
  price: number;
  capacity: number;
  ticketsSold: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface ClubDetails {
  clubName: string;
  address: string;
  nip: string;
  regon: string;
  description: string;
  openingHours: string;
  phoneNumber: string;
  verificationDate: string;
  isBanned: boolean;
}

interface EventForm {
  name: string;
  description: string;
  date: Date;
  price: number;
  capacity: number;
}

type ModalMode = 'add' | 'edit';

export const ClubDashboard = () => {
  const navigate = useNavigate();
  const [clubDetails, setClubDetails] = useState<ClubDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventFormErrors, setEventFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState<EventForm>({
    name: '',
    description: '',
    date: new Date(),
    price: 0,
    capacity: 0
  });

  const resetEventForm = () => {
    setEventForm({
      name: '',
      description: '',
      date: new Date(),
      price: 0,
      capacity: 0
    });
    setEventFormErrors({});
    setIsSubmitting(false);
    setModalMode('add');
    setSelectedEventId(null);
  };

  const validateEventForm = () => {
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

    const currentDate = new Date();
    if (!eventForm.date) {
      errors.date = 'Data jest wymagana';
    } else if (modalMode === 'add' && eventForm.date < currentDate) {
      errors.date = 'Data nie może być z przeszłości';
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

  const fetchEvents = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('Brak autoryzacji');
      }

      const response = await axiosInstance.get('/events/club');
      setEvents(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error fetching events:', axiosError.response?.data || axiosError.message);
      notifications.show({
        title: 'Błąd',
        message: axiosError.response?.data?.message || axiosError.message || 'Nie udało się pobrać wydarzeń',
        color: 'red',
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        const userData = localStorage.getItem('userData');
        if (!token || !userData) {
          notifications.show({
            title: 'Błąd',
            message: 'Brak autoryzacji. Zaloguj się ponownie.',
            color: 'red',
          });
          navigate('/login');
          return;
        }

        const user = JSON.parse(userData);
        if (user.role !== 'club') {
          notifications.show({
            title: 'Błąd',
            message: 'Brak uprawnień. Ta strona jest dostępna tylko dla klubów.',
            color: 'red',
          });
          navigate('/');
          return;
        }

        const response = await axiosInstance.get('/club/details');
        const data = response.data;
        setClubDetails(data);
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        console.error('Error fetching club details:', axiosError.response?.data || axiosError.message);
        notifications.show({
          title: 'Błąd',
          message: axiosError.response?.data?.message || axiosError.message || 'Nie udało się pobrać danych klubu',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchEvents();
  }, [navigate]);

  const handleEditEvent = async () => {
    if (!validateEventForm() || !selectedEventId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.put(`/events/${selectedEventId}`, eventForm);
      notifications.show({
        title: 'Sukces',
        message: 'Wydarzenie zostało zaktualizowane',
        color: 'green',
      });
      resetEventForm();
      setIsEventModalOpen(false);
      fetchEvents();
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      notifications.show({
        title: 'Błąd',
        message: axiosError.response?.data?.message || axiosError.message || 'Nie udało się zaktualizować wydarzenia',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEvent = async () => {
    if (!validateEventForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        await axiosInstance.post('/events', eventForm);
        notifications.show({
          title: 'Sukces',
          message: 'Wydarzenie zostało dodane',
          color: 'green',
        });
      } else {
        await handleEditEvent();
        return;
      }
      resetEventForm();
      setIsEventModalOpen(false);
      fetchEvents();
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      console.error('Error submitting event:', axiosError.response?.data || axiosError.message);
      notifications.show({
        title: 'Błąd',
        message: axiosError.response?.data?.message || axiosError.message || 'Nie udało się zapisać wydarzenia',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming': return 'blue';
      case 'ongoing': return 'green';
      case 'completed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getEventStatusText = (status: string): string => {
    switch (status) {
      case 'upcoming': return 'NADCHODZĄCE';
      case 'ongoing': return 'W TRAKCIE';
      case 'completed': return 'ZAKOŃCZONE';
      case 'cancelled': return 'ANULOWANE';
      default: return 'NIEZNANY';
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Container size="lg" py="xl" style={{ position: 'static' }}>
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      <Group justify="space-between" mb="xl">
        <Title order={1} c="white">Panel Klubu</Title>
        <Button onClick={handleLogout} variant="light">
          Wyloguj
        </Button>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={12}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Informacje o Klubie</Title>
            {loading ? (
              <Text>Ładowanie...</Text>
            ) : clubDetails ? (
              <>
                {clubDetails.isBanned && (
                  <Badge color="red" size="lg" mb="md">
                    Klub jest obecnie zablokowany
                  </Badge>
                )}
                <Text><strong>Nazwa:</strong> {clubDetails.clubName}</Text>
                <Text><strong>Adres:</strong> {clubDetails.address}</Text>
                <Text><strong>NIP:</strong> {clubDetails.nip}</Text>
                <Text><strong>REGON:</strong> {clubDetails.regon}</Text>
                <Text><strong>Telefon:</strong> {clubDetails.phoneNumber}</Text>
                <Text><strong>Godziny otwarcia:</strong> {clubDetails.openingHours}</Text>
                <Text mt="md"><strong>Opis:</strong></Text>
                <Text>{clubDetails.description}</Text>
                <Text mt="md"><strong>Data weryfikacji:</strong> {clubDetails.verificationDate ? new Date(clubDetails.verificationDate).toLocaleDateString('pl-PL') || 'Brak daty' : 'Brak daty'}</Text>
              </>
            ) : (
              <Text c="red">Nie udało się załadować danych klubu</Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card shadow="sm" p="lg">
            <Group justify="space-between" mb="md">
              <Title order={3}>Zarządzanie Wydarzeniami</Title>
              <Button 
                variant="filled" 
                color="red"
                disabled={clubDetails?.isBanned}
                onClick={() => {
                  if (isEventModalOpen && (eventForm.name || eventForm.description || eventForm.price > 0 || eventForm.capacity > 0)) {
                    if (window.confirm('Czy na pewno chcesz zamknąć? Wprowadzone dane zostaną utracone.')) {
                      resetEventForm();
                      setIsEventModalOpen(false);
                    }
                  } else {
                    resetEventForm();
                    setIsEventModalOpen(!isEventModalOpen);
                  }
                }}
              >
                {isEventModalOpen ? 'Anuluj' : 'Dodaj Wydarzenie'}
              </Button>
            </Group>

            {isEventModalOpen && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitEvent();
                }}
                style={{ marginBottom: '20px' }}
              >
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
                      mb="md"
                      autoComplete="off"
                      type="text"
                      data-autofill="false"
                      error={eventFormErrors.name}
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
                      mb="md"
                      clearable={false}
                      error={eventFormErrors.date}
                      minDate={modalMode === 'add' ? new Date() : undefined}
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
                      mb="md"
                      data-autofill="false"
                      hideControls
                      error={eventFormErrors.price}
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
                      mb="md"
                      data-autofill="false"
                      hideControls
                      error={eventFormErrors.capacity}
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
                      mb="md"
                      autoComplete="off"
                      data-autofill="false"
                      error={eventFormErrors.description}
                      minRows={3}
                    />
                  </Grid.Col>
                </Grid>
                <Group justify="flex-end" mt="md">
                  <Button 
                    type="submit" 
                    color="red" 
                    loading={isSubmitting}
                    disabled={isSubmitting || Object.keys(eventFormErrors).length > 0}
                  >
                    {modalMode === 'add' ? 'Dodaj' : 'Zapisz zmiany'}
                  </Button>
                </Group>
              </form>
            )}
            
            {events.length === 0 ? (
              <Text>Brak wydarzeń</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nazwa</Table.Th>
                    <Table.Th>Data</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Sprzedane Bilety</Table.Th>
                    <Table.Th>Cena</Table.Th>
                    <Table.Th>Akcje</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {events.map((event) => (
                    <Table.Tr key={event._id}>
                      <Table.Td>{event.name}</Table.Td>
                      <Table.Td>{new Date(event.date).toLocaleString()}</Table.Td>
                      <Table.Td>
                        <Badge color={getEventStatusColor(event.status)}>
                          {getEventStatusText(event.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{event.ticketsSold} / {event.capacity}</Table.Td>
                      <Table.Td>{event.price} PLN</Table.Td>
                      <Table.Td>
                        <Button
                          variant="light"
                          color="blue"
                          size="xs"
                          onClick={() => {
                            setModalMode('edit');
                            setSelectedEventId(event._id);
                            setEventForm({
                              name: event.name,
                              description: event.description,
                              date: new Date(event.date),
                              price: event.price,
                              capacity: event.capacity
                            });
                            setIsEventModalOpen(true);
                          }}
                          disabled={event.status !== 'upcoming' || clubDetails?.isBanned}
                        >
                          Edytuj
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Grid>
            <Grid.Col span={6}>
              <Card shadow="sm" p="lg">
                <Title order={3} mb="md">Statystyki</Title>
                <Text>Liczba wydarzeń: {events.length}</Text>
                <Text>Sprzedane bilety: {events.reduce((sum, event) => sum + event.ticketsSold, 0)}</Text>
                <Text>Nadchodzące wydarzenia: {events.filter(e => e.status === 'upcoming').length}</Text>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card shadow="sm" p="lg">
                <Title order={3} mb="md">Opinie</Title>
                <Text>Brak opinii</Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
