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
  LoadingOverlay,
  Paper,
} from '@mantine/core';
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

const ClubVerificationManagement: React.FC<{}> = (): JSX.Element => {
  const [verifications, setVerifications] = useState<ClubVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<ClubVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null);

  const getStatusText = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'ZATWIERDZONY';
      case 'rejected': return 'ODRZUCONY';
      case 'pending': return 'OCZEKUJĄCY';
      default: return 'OCZEKUJĄCY';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'yellow';
    }
  };

  const fetchVerifications = async (): Promise<void> => {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch verifications');
      }

      if (!Array.isArray(data)) {
        throw new Error('Nieprawidłowy format danych');
      }

      console.log('Raw API response:', data);
      console.log('API response statuses:', data.map((v: any) => v.status));
      const mappedData: ClubVerification[] = data.map((v: any) => {
        console.log('Processing verification:', {
          id: v._id,
          clubName: v.clubName,
          originalStatus: v.status,
          userId: v.userId
        });
        
        // Normalize status to ensure it's one of the valid values
        let status = v.status || 'pending';
        
        // Convert Polish status to English if needed
        if (status === 'OCZEKUJĄCY' || status === 'OCZEKUJACY') {
          status = 'pending';
        } else if (status === 'ZATWIERDZONY') {
          status = 'approved';
        } else if (status === 'ODRZUCONY') {
          status = 'rejected';
        }
        
        // Ensure lowercase
        status = status.toLowerCase();
        
        // Final validation
        if (!['pending', 'approved', 'rejected'].includes(status)) {
          status = 'pending';
        }
        
        console.log('Status transformation:', {
          original: v.status,
          afterNormalization: status,
          verification: v.clubName
        });
        
        return {
          ...v,
          status,
          _id: v._id || v.id,
          userId: {
            _id: v.userId._id || v.userId.id,
            email: v.userId.email,
            username: v.userId.username
          }
        } as ClubVerification;
      });
      
      console.log('Mapped data:', mappedData);
      setVerifications(mappedData);
    } catch (error) {
      notifications.show({
        title: 'Błąd',
        message: error instanceof Error ? error.message : 'Nie udało się pobrać wniosków o weryfikację',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (verification: ClubVerification): void => {
    setSelectedVerification(verification);
    setReviewNotes(verification.reviewNotes || '');
  };

  const handleBack = (): void => {
    setSelectedVerification(null);
    setReviewNotes('');
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected' | 'delete'): Promise<void> => {
    setActionLoading(true);
    setLoadingClubId(id);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Brak tokenu uwierzytelniającego');
      }

      const response = await fetch(`${API_URL}/admin/verifications/${id}`, {
        method: status === 'delete' ? 'DELETE' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: status === 'delete' ? undefined : JSON.stringify({
          status,
          reviewNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Nie udało się ${status === 'approved' ? 'zatwierdzić' : 'odrzucić'} klubu`);
      }

      notifications.show({
        title: 'Sukces',
        message: status === 'approved' 
          ? 'Klub został zatwierdzony' 
          : status === 'rejected'
          ? 'Klub został odrzucony'
          : 'Klub został usunięty',
        color: 'green',
      });

      setVerifications(prevVerifications => 
        prevVerifications.map(v => 
          v._id === id ? data.verification : v
        )
      );
      setSelectedVerification(null);
      setReviewNotes('');
      
      await fetchVerifications();
    } catch (error) {
      notifications.show({
        title: 'Błąd',
        message: `Nie udało się ${status === 'approved' ? 'zatwierdzić' : 'odrzucić'} klubu`,
        color: 'red',
      });
    } finally {
      setActionLoading(false);
      setLoadingClubId(null);
    }
  };

  const renderVerificationDetails = (verification: ClubVerification | null): JSX.Element => {
    if (!verification) return <></>;

    return (
      <Paper p="xl" radius="md" withBorder>
        <Group mb={30}>
          <Button variant="light" onClick={handleBack}>
            Cofnij
          </Button>
          <Text size="xl" fw={700}>Szczegóły Weryfikacji Klubu</Text>
        </Group>
        <Box pos="relative">
          <LoadingOverlay visible={actionLoading} overlayProps={{ blur: 2 }} />
          <Stack gap={8}>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Nazwa Klubu</Text>
                <Text>{verification.clubName}</Text>
              </Group>
            </Box>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Adres</Text>
                <Text>{verification.address}</Text>
              </Group>
            </Box>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>NIP</Text>
                <Text>{verification.nip}</Text>
              </Group>
            </Box>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>REGON</Text>
                <Text>{verification.regon}</Text>
              </Group>
            </Box>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Numer Telefonu</Text>
                <Text>{verification.phoneNumber}</Text>
              </Group>
            </Box>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Opis</Text>
                <Text style={{ flex: 1 }}>{verification.description}</Text>
              </Group>
            </Box>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Godziny Otwarcia</Text>
                <Text>{verification.openingHours}</Text>
              </Group>
            </Box>
            <Box style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '8px 0' }}>
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Status</Text>
                <Badge color={getStatusColor(verification.status)}>
                  {getStatusText(verification.status)}
                </Badge>
              </Group>
            </Box>
            {(verification.status?.toLowerCase() || 'pending') === 'approved' && verification.clubId && (
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>ID Klubu</Text>
                <Text>{verification.clubId}</Text>
              </Group>
            )}
            {(verification.status?.toLowerCase() || 'pending') === 'pending' && (
              <Box mt={30}>
                <Text fw={500} mb={5}>Notatki do Weryfikacji</Text>
                <Textarea
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.currentTarget.value)}
                  placeholder="Dodaj notatki do weryfikacji..."
                  minRows={3}
                  styles={{
                    input: {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }
                  }}
                />
              </Box>
            )}
            {(verification.status?.toLowerCase() || 'pending') === 'rejected' && (
              <Group justify="flex-end" mt={30} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20 }}>
                <Button
                  color="red"
                  size="md"
                  onClick={() => handleAction(verification._id, 'delete')}
                  loading={actionLoading}
                >
                  Usuń
                </Button>
              </Group>
            )}
            {verification.reviewedAt && (
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Data Weryfikacji</Text>
                <Text>{new Date(verification.reviewedAt).toLocaleString()}</Text>
              </Group>
            )}
            {verification.reviewNotes && (
              <Group justify="space-between" align="center">
                <Text fw={500} w={120}>Notatki</Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>{verification.reviewNotes}</Text>
              </Group>
            )}
          </Stack>
        </Box>
      </Paper>
    );
  };

  const handleRefresh = async () => {
    await fetchVerifications();
  };

  useEffect(() => {
    fetchVerifications().catch(console.error);
  }, []);

  const tableHeader = (
    <Group justify="space-between" mb="md">
      <Text size="xl" fw={700}>Wnioski o Weryfikację Klubów</Text>
      <Button 
        variant="light"
        onClick={handleRefresh}
        loading={loading}
      >
        Odśwież
      </Button>
    </Group>
  );

  const renderActions = (verification: ClubVerification) => {
    console.log('Rendering actions for verification:', {
      id: verification._id,
      status: verification.status,
      clubName: verification.clubName
    });
    
    // Normalize status for comparison
    const normalizedStatus = (verification.status?.toLowerCase() || 'pending') as 'pending' | 'approved' | 'rejected';
    console.log('Status:', normalizedStatus, 'Original status:', verification.status);
    
    // Show action buttons for pending status
    if (normalizedStatus === 'pending') {
      return (
        <Group gap={8}>
          <Button 
            variant="light" 
            onClick={() => handleViewDetails(verification)}
          >
            Szczegóły
          </Button>
          <Button
            variant="light"
            color="green"
            onClick={() => handleAction(verification._id, 'approved')}
            loading={loadingClubId === verification._id}
          >
            Zatwierdź
          </Button>
          <Button
            variant="light"
            color="red"
            onClick={() => handleAction(verification._id, 'rejected')}
            loading={loadingClubId === verification._id}
          >
            Odrzuć
          </Button>
        </Group>
      );
    }
    
    if (normalizedStatus === 'rejected') {
      return (
        <Group gap={8}>
          <Button 
            variant="light" 
            onClick={() => handleViewDetails(verification)}
          >
            Szczegóły
          </Button>
          <Button
            variant="light"
            color="red"
            onClick={() => handleAction(verification._id, 'delete')}
            loading={loadingClubId === verification._id}
          >
            Usuń
          </Button>
        </Group>
      );
    }

    return (
      <Group gap={8}>
        <Button 
          variant="light" 
          onClick={() => handleViewDetails(verification)}
        >
          Szczegóły
        </Button>
      </Group>
    );
  };

  const rows = verifications.map((verification: ClubVerification) => (
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
        {renderActions(verification)}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      {tableHeader}
      {selectedVerification ? (
        renderVerificationDetails(selectedVerification)
      ) : (
        <ScrollArea.Autosize mah="calc(100vh - 100px)">
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
        </ScrollArea.Autosize>
      )}
    </Box>
  );
};

export default ClubVerificationManagement;
