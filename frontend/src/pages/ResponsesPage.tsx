import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';

interface ResponseData {
    id: string;
    submittedAt: string;
    npsScore?: number;
    csatScore?: number;
    source?: string;
    phone?: string;
    orderId?: string;
    answers?: Array<{ questionId: string; value: string | number }>;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const Container = styled.div`
    min-height: 100vh;
    background: #0f0f23;
    padding: 24px;
`;

const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
`;

const Title = styled.h1`
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const BackButton = styled.button`
    padding: 10px 20px;
    background: transparent;
    border: 2px solid #6366f1;
    border-radius: 8px;
    color: #6366f1;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #6366f1;
        color: white;
    }
`;

const ActionBar = styled.div`
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    align-items: center;
`;

const FilterGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

const FilterLabel = styled.label`
    color: #9ca3af;
    font-size: 14px;
`;

const DateInput = styled.input`
    padding: 8px 12px;
    background: #1a1a2e;
    border: 1px solid #374151;
    border-radius: 6px;
    color: white;
    font-size: 14px;

    &:focus {
        outline: none;
        border-color: #6366f1;
    }
`;

const ExportButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: auto;

    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    background: #1a1a2e;
    border-radius: 12px;
    overflow: hidden;
`;

const Th = styled.th`
    padding: 16px;
    text-align: left;
    background: #252542;
    color: #9ca3af;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const Td = styled.td`
    padding: 14px 16px;
    border-bottom: 1px solid #374151;
    color: white;
    font-size: 14px;
`;

const Tr = styled.tr`
    transition: background 0.2s;

    &:hover {
        background: rgba(99, 102, 241, 0.1);
    }
`;

const NPSBadge = styled.span<{ $score?: number }>`
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    background: ${({ $score }) =>
        $score === undefined ? '#374151' :
            $score >= 9 ? 'rgba(34, 197, 94, 0.2)' :
                $score >= 7 ? 'rgba(234, 179, 8, 0.2)' :
                    'rgba(239, 68, 68, 0.2)'};
    color: ${({ $score }) =>
        $score === undefined ? '#9ca3af' :
            $score >= 9 ? '#22c55e' :
                $score >= 7 ? '#eab308' :
                    '#ef4444'};
`;

const Pagination = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    color: #9ca3af;
`;

const PageInfo = styled.span`
    font-size: 14px;
`;

const PageButtons = styled.div`
    display: flex;
    gap: 8px;
`;

const PageButton = styled.button<{ $active?: boolean }>`
    padding: 8px 14px;
    background: ${({ $active }) => $active ? '#6366f1' : '#1a1a2e'};
    border: 1px solid ${({ $active }) => $active ? '#6366f1' : '#374151'};
    border-radius: 6px;
    color: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        border-color: #6366f1;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const LoadingOverlay = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px;
    color: #9ca3af;
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px;
    color: #9ca3af;
`;

export function ResponsesPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [responses, setResponses] = useState<ResponseData[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchResponses();
        }
    }, [isAuthenticated, currentPage, startDate, endDate]);

    const fetchResponses = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '25',
            });
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const response = await apiClient.get(`/export/responses?${params}`);
            setResponses(response.data.data.responses);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Failed to fetch responses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const response = await apiClient.get(`/export/csv?${params}`, {
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `responses_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export CSV:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getFeedback = (answers?: ResponseData['answers']) => {
        if (!answers) return '-';
        const textAnswer = answers.find(a => typeof a.value === 'string' && a.value.length > 5);
        if (!textAnswer) return '-';
        const text = String(textAnswer.value);
        return text.length > 50 ? text.substring(0, 47) + '...' : text;
    };

    if (!isAuthenticated) {
        return <LoadingOverlay>Redirecting to login...</LoadingOverlay>;
    }

    return (
        <Container>
            <Header>
                <Title>📊 Response Data</Title>
                <BackButton onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </BackButton>
            </Header>

            <ActionBar>
                <FilterGroup>
                    <FilterLabel>From:</FilterLabel>
                    <DateInput
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                            setStartDate(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </FilterGroup>
                <FilterGroup>
                    <FilterLabel>To:</FilterLabel>
                    <DateInput
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                            setEndDate(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </FilterGroup>
                <ExportButton onClick={handleExportCSV}>
                    📥 Download CSV
                </ExportButton>
            </ActionBar>

            {isLoading ? (
                <LoadingOverlay>Loading responses...</LoadingOverlay>
            ) : responses.length === 0 ? (
                <EmptyState>
                    <p>No responses found for the selected date range.</p>
                </EmptyState>
            ) : (
                <>
                    <Table>
                        <thead>
                            <tr>
                                <Th>Date</Th>
                                <Th>NPS</Th>
                                <Th>CSAT</Th>
                                <Th>Source</Th>
                                <Th>Order ID</Th>
                                <Th>Phone</Th>
                                <Th>Feedback</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {responses.map((response) => (
                                <Tr key={response.id}>
                                    <Td>{formatDate(response.submittedAt)}</Td>
                                    <Td>
                                        <NPSBadge $score={response.npsScore}>
                                            {response.npsScore ?? '-'}
                                        </NPSBadge>
                                    </Td>
                                    <Td>{response.csatScore ?? '-'}</Td>
                                    <Td>{response.source || '-'}</Td>
                                    <Td>{response.orderId || '-'}</Td>
                                    <Td>{response.phone || '-'}</Td>
                                    <Td>{getFeedback(response.answers)}</Td>
                                </Tr>
                            ))}
                        </tbody>
                    </Table>

                    <Pagination>
                        <PageInfo>
                            Showing {((pagination?.page || 1) - 1) * (pagination?.limit || 25) + 1} -{' '}
                            {Math.min((pagination?.page || 1) * (pagination?.limit || 25), pagination?.total || 0)} of{' '}
                            {pagination?.total || 0} responses
                        </PageInfo>
                        <PageButtons>
                            <PageButton
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                Previous
                            </PageButton>
                            <PageButton
                                disabled={currentPage >= (pagination?.totalPages || 1)}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next
                            </PageButton>
                        </PageButtons>
                    </Pagination>
                </>
            )}
        </Container>
    );
}
