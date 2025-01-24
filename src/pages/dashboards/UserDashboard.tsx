import { Container, Title, Button, Group, Card, Grid, Text, Badge, Table, Modal } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/auth';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';

interface Event {
  _id: string;
  name: string;
  date: string;
  description: string;
  price: number;
  club: {
    _id: string;
    clubName: string;
    address: string;
  };
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  capacity: number;
  ticketsSold: number;
  isBlocked: boolean;
}

interface Ticket {
  _id: string;
  eventId: {
    _id: string;
    name: string;
    date: string;
    clubId: {
      clubName: string;
      address: string;
    };
  };
  status: 'active' | 'used' | 'expired';
  purchaseDate: string;
  price: number;
}

export const UserDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const fetchData = async () => {
      try {
        // Fetch tickets and events separately to handle errors independently
        if (mounted) {
          try {
            const ticketsResponse = await axiosInstance.get('/tickets/user', {
              signal: controller.signal
            });
            setTickets(ticketsResponse.data);
          } catch (error: any) {
            if (error?.name !== 'AbortError') {
              console.error('Error fetching tickets:', error?.message || 'Unknown error');
            }
          } finally {
            setLoading(false);
          }

          try {
            const eventsResponse = await axiosInstance.get('/events', {
              params: { status: 'upcoming' },
              signal: controller.signal
            });
            setEvents(eventsResponse.data);
          } catch (error: any) {
            if (error?.name !== 'AbortError') {
              console.error('Error fetching events:', error?.message || 'Unknown error');
            }
          } finally {
            setEventsLoading(false);
          }
        }
      } catch (error: any) {
        console.error('General error:', error?.message || 'Unknown error');
      }
    };

    fetchData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'used': return 'blue';
      case 'expired': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'AKTYWNY';
      case 'used': return 'WYKORZYSTANY';
      case 'expired': return 'WYGASŁY';
      default: return 'NIEZNANY';
    }
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
        <Grid.Col span={12}>
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Moje Bilety</Title>
            {loading ? (
              <Text>Ładowanie biletów...</Text>
            ) : tickets.length === 0 ? (
              <Text>Nie masz jeszcze żadnych biletów</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Wydarzenie</Table.Th>
                    <Table.Th>Klub</Table.Th>
                    <Table.Th>Data</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Akcje</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {tickets.map((ticket) => (
                    <Table.Tr key={ticket._id}>
                      <Table.Td>{ticket.eventId.name}</Table.Td>
                      <Table.Td>{ticket.eventId.clubId.clubName}</Table.Td>
                      <Table.Td>{new Date(ticket.eventId.date).toLocaleDateString()}</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusColor(ticket.status)}>
                          {getStatusText(ticket.status)}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="light"
                          size="xs"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsModalOpen(true);
                          }}
                        >
                          Szczegóły
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
          <Card shadow="sm" p="lg">
            <Title order={3} mb="md">Nadchodzące Wydarzenia</Title>
            {eventsLoading ? (
              <Text>Ładowanie wydarzeń...</Text>
            ) : events.length === 0 ? (
              <Text>Brak nadchodzących wydarzeń</Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Wydarzenie</Table.Th>
                    <Table.Th>Klub</Table.Th>
                    <Table.Th>Data</Table.Th>
                    <Table.Th>Cena</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {events.map((event) => (
                    <Table.Tr key={event._id}>
                      <Table.Td>{event.name}</Table.Td>
                      <Table.Td>{event.club?.clubName || 'Klub niedostępny'}</Table.Td>
                      <Table.Td>{new Date(event.date).toLocaleDateString()}</Table.Td>
                      <Table.Td>{event.price} PLN</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Szczegóły Biletu"
        size="md"
        centered
      >
        {selectedTicket && (
          <div>
            <Text size="lg" fw={500} mb={15}>{selectedTicket.eventId.name}</Text>
            <Text><strong>Klub:</strong> {selectedTicket.eventId.clubId.clubName}</Text>
            <Text><strong>Adres:</strong> {selectedTicket.eventId.clubId.address}</Text>
            <Text><strong>Data wydarzenia:</strong> {new Date(selectedTicket.eventId.date).toLocaleString()}</Text>
            <Text><strong>Data zakupu:</strong> {new Date(selectedTicket.purchaseDate).toLocaleString()}</Text>
            <Text><strong>Cena:</strong> {selectedTicket.price} PLN</Text>
            <Text mt={10}>
              <strong>Status:</strong>{' '}
              <Badge color={getStatusColor(selectedTicket.status)}>
                {getStatusText(selectedTicket.status)}
              </Badge>
            </Text>
          </div>
        )}
      </Modal>
    </Container>
  );
};
