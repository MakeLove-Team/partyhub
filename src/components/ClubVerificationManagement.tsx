import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Text,
  Badge,
  Modal,
  Textarea,
  Group,
  LoadingOverlay,
  Alert
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface ClubVerification {
  _id: string;
  userId: {
    username: string;
    email: string;
  };
  clubName: string;
  address: string;
  nip: string;
  regon: string;
  description: string;
  openingHours: string;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export const ClubVerificationManagement = () => {
  const [verifications, setVerifications] = useState<ClubVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<ClubVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Brak tokenu uwierzytelniającego');
      }

      const response = await fetch('http://localhost:3001/api/admin/verifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Błąd podczas pobierania wniosków');
      }

      const data = await response.json();
      setVerifications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas pobierania danych');
      console.error('Fetch verifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleVerificationAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setActionLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Brak tokenu uwierzytelniającego');
      }

      const response = await fetch(`http://localhost:3001/api/admin/verifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status,
          reviewNotes
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Błąd podczas aktualizacji statusu');
      }

      await fetchVerifications();
      close();
      setReviewNotes('');
      setSelectedVerification(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas aktualizacji');
      console.error('Verification action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Oczekujący';
      case 'approved':
        return 'Zatwierdzony';
      case 'rejected':
        return 'Odrzucony';
      default:
        return status;
    }
  };

  const openVerificationModal = (verification: ClubVerification) => {
    setSelectedVerification(verification);
    setReviewNotes(verification.reviewNotes || '');
    setError(null);
    open();
  };

  if (loading) {
    return <LoadingOverlay visible />;
  }

  return (
    <>
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nazwa klubu</Table.Th>
            <Table.Th>Użytkownik</Table.Th>
            <Table.Th>Data złożenia</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Akcje</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {verifications.map((verification) => (
            <Table.Tr key={verification._id}>
              <Table.Td>{verification.clubName}</Table.Td>
              <Table.Td>{verification.userId.username}</Table.Td>
              <Table.Td>{new Date(verification.submittedAt).toLocaleDateString()}</Table.Td>
              <Table.Td>
                <Badge color={getStatusBadgeColor(verification.status)}>
                  {getStatusText(verification.status)}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Button
                  variant="light"
                  size="xs"
                  onClick={() => openVerificationModal(verification)}
                >
                  Szczegóły
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={opened}
        onClose={close}
        title="Szczegóły weryfikacji klubu"
        size="lg"
      >
        {selectedVerification && (
          <>
            <Text><strong>Nazwa klubu:</strong> {selectedVerification.clubName}</Text>
            <Text><strong>Adres:</strong> {selectedVerification.address}</Text>
            <Text><strong>NIP:</strong> {selectedVerification.nip}</Text>
            <Text><strong>REGON:</strong> {selectedVerification.regon}</Text>
            <Text><strong>Telefon:</strong> {selectedVerification.phoneNumber}</Text>
            <Text><strong>Godziny otwarcia:</strong> {selectedVerification.openingHours}</Text>
            <Text mt="md"><strong>Opis:</strong></Text>
            <Text mb="md">{selectedVerification.description}</Text>

            <Textarea
              label="Notatki do weryfikacji"
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.currentTarget.value)}
              minRows={3}
              mb="md"
              disabled={actionLoading}
            />

            {selectedVerification.status === 'pending' && (
              <Group justify="flex-end" mt="xl">
                <Button
                  color="red"
                  onClick={() => handleVerificationAction(selectedVerification._id, 'rejected')}
                  loading={actionLoading}
                >
                  Odrzuć
                </Button>
                <Button
                  color="green"
                  onClick={() => handleVerificationAction(selectedVerification._id, 'approved')}
                  loading={actionLoading}
                >
                  Zatwierdź
                </Button>
              </Group>
            )}
          </>
        )}
      </Modal>
    </>
  );
};
