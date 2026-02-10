import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks';
import { ThemeToggle } from '../components/ThemeToggle';
import apiClient from '../api/client';

// Shared Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const Header = styled.header`
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryLight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const HeaderButton = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${({ $primary, theme }) => $primary ? theme.colors.primary : 'transparent'};
  border: 1px solid ${({ theme, $primary }) => ($primary ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ $primary, theme }) => ($primary ? 'white' : theme.colors.textSecondary)};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $primary, theme }) => ($primary ? 'white' : theme.colors.primary)};
  }
`;

const Main = styled.main`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

// Integration Specific Styles
const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
`;

const Card = styled.div`
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius}px;
    padding: 24px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ProviderName = styled.h3`
    font-size: 18px;
    color: ${({ theme }) => theme.colors.text};
    margin: 0;
`;

const StatusBadge = styled.span<{ $active: boolean }>`
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    background: ${({ $active }) => $active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(107, 114, 128, 0.15)'};
    color: ${({ $active }) => $active ? '#22c55e' : '#6b7280'};
`;

const Input = styled.input`
    width: 100%;
    padding: 10px;
    background: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius}px;
    color: ${({ theme }) => theme.colors.text};
    font-size: 14px;
    margin-bottom: 8px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
    padding: 10px;
    width: 100%;
    background: ${({ $variant, theme }) => $variant === 'secondary' ? 'transparent' : theme.colors.primary};
    border: 1px solid ${({ $variant, theme }) => $variant === 'secondary' ? theme.colors.border : theme.colors.primary};
    border-radius: ${({ theme }) => theme.borderRadius}px;
    color: ${({ $variant, theme }) => $variant === 'secondary' ? theme.colors.text : 'white'};
    cursor: pointer;
    font-weight: 600;
    &:hover { opacity: 0.9; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

interface IntegrationState {
    provider: 'PETPOOJA' | 'URBANPIPER';
    apiKey: string;
    active: boolean;
    lastSync?: string;
}

export function IntegrationPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [integrations, setIntegrations] = useState<IntegrationState[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);

    // Form states
    const [apiKeyInput, setApiKeyInput] = useState<Record<string, string>>({});

    const fetchProfile = async () => {
        try {
            const res = await apiClient.getProfile();
            // Assuming res.data.data.tenant.integrations exists
            if (res.data.data.tenant?.integrations) {
                setIntegrations(res.data.data.tenant.integrations);
            }
        } catch (err) {
            console.error('Failed to load profile', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleConnect = async (provider: string) => {
        const apiKey = apiKeyInput[provider];
        if (!apiKey) return alert('Enter API Key');

        try {
            await apiClient.connectIntegration({
                provider,
                apiKey,
                active: true
            });
            alert('Connected successfully!');
            fetchProfile();
        } catch (err) {
            alert('Failed to connect');
        }
    };

    const handleSync = async (provider: string) => {
        setSyncing(provider);
        try {
            const res = await apiClient.syncIntegration(provider);
            alert(res.data.message);
            fetchProfile();
        } catch (err) {
            alert('Failed to sync');
            console.error(err);
        } finally {
            setSyncing(null);
        }
    };

    const renderCard = (provider: 'PETPOOJA' | 'URBANPIPER', label: string) => {
        const integration = integrations.find(i => i.provider === provider);
        const isActive = integration?.active || false;

        return (
            <Card>
                <CardHeader>
                    <ProviderName>{label}</ProviderName>
                    <StatusBadge $active={isActive}>
                        {isActive ? 'CONNECTED' : 'NOT CONNECTED'}
                    </StatusBadge>
                </CardHeader>

                {isActive ? (
                    <>
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                            Last Sync: {integration?.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}
                        </div>
                        <ActionButton
                            $variant="primary"
                            onClick={() => handleSync(provider)}
                            disabled={syncing === provider}
                        >
                            {syncing === provider ? 'Syncing...' : 'Sync Locations Now'}
                        </ActionButton>
                    </>
                ) : (
                    <>
                        <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                            Connect to {label} to fetch locations and sync feedback.
                        </p>
                        <Input
                            placeholder="Enter API Key / Secret"
                            value={apiKeyInput[provider] || ''}
                            onChange={(e) => setApiKeyInput(prev => ({ ...prev, [provider]: e.target.value }))}
                            type="password"
                        />
                        <ActionButton onClick={() => handleConnect(provider)}>
                            Connect Integration
                        </ActionButton>
                    </>
                )}
            </Card>
        );
    };

    return (
        <Container>
            <Header>
                <Logo onClick={() => navigate('/dashboard')}>VibeCheck</Logo>
                <HeaderButtons>
                    <ThemeToggle />
                    <HeaderButton onClick={() => navigate('/dashboard')}>Overview</HeaderButton>
                    <HeaderButton onClick={logout}>Logout</HeaderButton>
                </HeaderButtons>
            </Header>
            <Main>
                <h2 style={{ color: 'white', marginBottom: '24px' }}>Integration Settings</h2>

                {loading ? (
                    <p style={{ color: '#9ca3af' }}>Loading settings...</p>
                ) : (
                    <Grid>
                        {renderCard('PETPOOJA', 'Petpooja POS')}
                        {renderCard('URBANPIPER', 'UrbanPiper')}
                    </Grid>
                )}
            </Main>
        </Container>
    );
}
