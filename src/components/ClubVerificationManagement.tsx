import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Text,
  Stack,
  Badge,
  Group,
  Box,
  ScrollArea,
  Textarea,
  Container,
  LoadingOverlay,
  Title,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { API_URL } from '../config/api';

interface ClubVerification {
  _id: string;
  userId: {
    _id: string;
    email: string;
    username: string;
  };
  clubId?: string;
  clubName: string;
  address: string;
  nip: string;
  regon: string;
  phoneNumber: string;
  description: string;
  openingHours: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export const ClubVerificationManagement: React.FC = () => {
  const [verifications, setVerifications] = useState<ClubVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<ClubVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Brak tokenu uwierzytelniającego');
      }

      console.log('Fetching verifications...');
      const response = await fetch(`${API_URL}/admin/verifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Fetched data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch verifications');
      }

      if (!Array.isArray(data)) {
        console.error('Unexpected data format:', data);
        throw new Error('Nieprawidłowy format danych');
      }

      setVerifications(data);
      console.log('Verifications set:', data.length, 'items');
    } catch (error) {
      console.error('Error fetching verifications:', error);
      notifications.show({
        title: 'Błąd',
        message: error instanceof Error ? error.message : 'Nie udało się pobrać wniosków o weryfikację',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Component mounted, fetching verifications...');
    fetchVerifications().catch(error => {
      console.error('Error in useEffect:', error);
    });
  }, []);

  useEffect(() => {
    console.log('Verifications updated:', verifications.length, 'items');
  }, [verifications]);

  const handleViewDetails = (verification: ClubVerification) => {
    console.log('Opening details for:', verification);
    setSelectedVerification(verification);
    setReviewNotes(verification.reviewNotes || '');
    
    modals.open({
      title: "Szczegóły Weryfikacji Klubu",
      size: "lg",
      centered: true,
      children: (
        <>
          <LoadingOverlay visible={actionLoading} overlayProps={{ blur: 2 }} />
          <Stack>
            <Box>
              <Text fw={700}>Nazwa Klubu</Text>
              <Text>{verification.clubName}</Text>
            </Box>
            <Box>
              <Text fw={700}>Użytkownik</Text>
              <Text>
                {verification.userId.username} ({verification.userId.email})
              </Text>
            </Box>
            <Box>
              <Text fw={700}>Adres</Text>
              <Text>{verification.address}</Text>
            </Box>
            <Box>
              <Text fw={700}>NIP</Text>
              <Text>{verification.nip}</Text>
            </Box>
            <Box>
              <Text fw={700}>REGON</Text>
              <Text>{verification.regon}</Text>
            </Box>
            <Box>
              <Text fw={700}>Numer Telefonu</Text>
              <Text>{verification.phoneNumber}</Text>
            </Box>
            <Box>
              <Text fw={700}>Opis</Text>
              <Text>{verification.description}</Text>
            </Box>
            <Box>
              <Text fw={700}>Godziny Otwarcia</Text>
              <Text>{verification.openingHours}</Text>
            </Box>
            <Box>
              <Text fw={700}>Status</Text>
              <Badge color={getStatusColor(verification.status)}>
                {getStatusText(verification.status)}
              </Badge>
            </Box>
            {verification.status === 'approved' && verification.clubId && (
              <Box>
                <Text fw={700}>ID Klubu</Text>
                <Text>{verification.clubId}</Text>
              </Box>
            )}
            {verification.status === 'pending' && (
              <>
                <Box>
                  <Text fw={700} mb="xs">Notatki do Weryfikacji</Text>
                  <Textarea
                    value={reviewNotes}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setReviewNotes(event.currentTarget.value)
                    }
                    placeholder="Dodaj notatki do weryfikacji..."
                    minRows={3}
                  />
                </Box>
                <Group justify="flex-end" mt="md">
                  <Button
                    color="green"
                    onClick={() => handleAction(verification._id, 'approved')}
                    loading={actionLoading}
                  >
                    Zatwierdź
                  </Button>
                  <Button
                    color="red"
                    onClick={() => handleAction(verification._id, 'rejected')}
                    loading={actionLoading}
                  >
                    Odrzuć
                  </Button>
                </Group>
              </>
            )}
            {verification.reviewedAt && (
              <Box>
                <Text fw={700}>Data Weryfikacji</Text>
                <Text>{new Date(verification.reviewedAt).toLocaleString()}</Text>
              </Box>
            )}
            {verification.reviewNotes && (
              <Box>
                <Text fw={700}>Notatki</Text>
                <Text>{verification.reviewNotes}</Text>
              </Box>
            )}
          </Stack>
        </>
      ),
    });
  };

  useEffect(() => {
    console.log('Selected verification:', selectedVerification);
  }, [selectedVerification]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Brak tokenu uwierzytelniającego');
      }

      const response = await fetch(`${API_URL}/admin/verifications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          reviewNotes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${status} club`);
      }

      notifications.show({
        title: 'Sukces',
        message: status === 'approved' 
          ? 'Klub został zatwierdzony' 
          : 'Klub został odrzucony',
        color: 'green',
      });

      await fetchVerifications();
      modals.closeAll();
    } catch (error) {
      console.error(`Error ${status}ing club:`, error);
      notifications.show({
        title: 'Błąd',
        message: `Nie udało się ${status === 'approved' ? 'zatwierdzić' : 'odrzucić'} klubu`,
        color: 'red',
      });
    } finally {
      setActionLoading(false);
    }
  };

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

  const rows = verifications.map((verification) => (
    <Table.Tr key={verification._id}>
      <Table.Td>{verification.clubName}</Table.Td>
      <Table.Td>{verification.userId.username}</Table.Td>
      <Table.Td>
        <Badge color={getStatusColor(verification.status)}>
          {getStatusText(verification.status)}
        </Badge>
      </Table.Td>
      <Table.Td>{new Date(verification.submittedAt).toLocaleDateString()}</Table.Td>
      <Table.Td>
        <Button 
          variant="light" 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Button clicked');
            handleViewDetails(verification);
          }}
        >
          Szczegóły
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      <ScrollArea>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nazwa Klubu</Table.Th>
              <Table.Th>Użytkownik</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Data Złożenia</Table.Th>
              <Table.Th>Akcje</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>

    </Container>
  );
};
