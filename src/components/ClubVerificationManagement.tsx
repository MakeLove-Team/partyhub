import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Text,
  Modal,
  Stack,
  Badge,
  Group,
  Box,
  ScrollArea,
  Textarea,
  Container,
  LoadingOverlay,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { API_URL } from '../config/api';

interface ClubVerification {
  _id: string;
  userId: {
    _id: string;
    email: string;
    username: string;
  };
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
  const [opened, { open, close }] = useDisclosure(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Brak tokenu uwierzytelniającego');
      }

      const response = await fetch(`${API_URL}/admin/verifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch verifications');
      }

      const data = await response.json();
      setVerifications(data);
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
    fetchVerifications();
  }, []);

  const handleViewDetails = (verification: ClubVerification) => {
    setSelectedVerification(verification);
    setReviewNotes(verification.reviewNotes || '');
    open();
  };

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
      close();
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
        <Button variant="light" onClick={() => handleViewDetails(verification)}>
          Szczegóły
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl" pos="relative">
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

      <Modal 
        opened={opened} 
        onClose={close} 
        size="lg"
        title="Szczegóły Weryfikacji Klubu"
      >
        <LoadingOverlay visible={actionLoading} overlayProps={{ blur: 2 }} />
        {selectedVerification && (
          <Stack>
            <Box>
              <Text fw={700}>Nazwa Klubu</Text>
              <Text>{selectedVerification.clubName}</Text>
            </Box>
            <Box>
              <Text fw={700}>Użytkownik</Text>
              <Text>
                {selectedVerification.userId.username} ({selectedVerification.userId.email})
              </Text>
            </Box>
            <Box>
              <Text fw={700}>Adres</Text>
              <Text>{selectedVerification.address}</Text>
            </Box>
            <Box>
              <Text fw={700}>NIP</Text>
              <Text>{selectedVerification.nip}</Text>
            </Box>
            <Box>
              <Text fw={700}>REGON</Text>
              <Text>{selectedVerification.regon}</Text>
            </Box>
            <Box>
              <Text fw={700}>Numer Telefonu</Text>
              <Text>{selectedVerification.phoneNumber}</Text>
            </Box>
            <Box>
              <Text fw={700}>Opis</Text>
              <Text>{selectedVerification.description}</Text>
            </Box>
            <Box>
              <Text fw={700}>Godziny Otwarcia</Text>
              <Text>{selectedVerification.openingHours}</Text>
            </Box>
            <Box>
              <Text fw={700}>Status</Text>
              <Badge color={getStatusColor(selectedVerification.status)}>
                {getStatusText(selectedVerification.status)}
              </Badge>
            </Box>
            {selectedVerification.status === 'pending' && (
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
                    onClick={() => handleAction(selectedVerification._id, 'approved')}
                    loading={actionLoading}
                  >
                    Zatwierdź
                  </Button>
                  <Button
                    color="red"
                    onClick={() => handleAction(selectedVerification._id, 'rejected')}
                    loading={actionLoading}
                  >
                    Odrzuć
                  </Button>
                </Group>
              </>
            )}
            {selectedVerification.reviewedAt && (
              <Box>
                <Text fw={700}>Data Weryfikacji</Text>
                <Text>{new Date(selectedVerification.reviewedAt).toLocaleString()}</Text>
              </Box>
            )}
            {selectedVerification.reviewNotes && (
              <Box>
                <Text fw={700}>Notatki</Text>
                <Text>{selectedVerification.reviewNotes}</Text>
              </Box>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
};
