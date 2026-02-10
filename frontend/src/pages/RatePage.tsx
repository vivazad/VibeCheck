import { useState, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { useTransactionContext } from '../hooks';
import { FormRenderer } from '../components/FormRenderer'; // Import from the new location or just `../components` if properly exported
import { GlobalStyles } from '../styles/GlobalStyles';
import { createTheme } from '../styles/theme';
import apiClient from '../api/client';

interface Tenant {
    id: string;
    name: string;
    themeConfig: {
        primaryColor: string;
        logoUrl?: string;
        borderRadius: number;
    };
    tipping: {
        enabled: boolean;
        provider: 'UPI' | 'PAYPAL';
        vpa?: string;
        paypalEmail?: string;
        upiId?: string;
    };
}

interface Form {
    id: string;
    name: string;
    fields: Array<{
        id: string;
        type: 'nps' | 'csat' | 'text' | 'phone';
        label: string;
        required: boolean;
        subtitle?: string;
        placeholder?: string;
    }>;
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 600px; /* Increased width to match FormContainer design */
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius * 2}px;
  padding: 0; /* Let FormRenderer handle padding */
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 32px 32px 0;
  text-align: center;
`;

const Logo = styled.img`
  max-height: 48px;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryLight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ theme }) => theme.colors.error};
  margin: 32px;
`;

export function RatePage() {
    const { tenantId, isLoading: contextLoading, error: contextError } = useTransactionContext();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [form, setForm] = useState<Form | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tenantId) return;

        const fetchForm = async () => {
            try {
                const response = await apiClient.getActiveForm(tenantId);
                setTenant(response.data.data.tenant);
                setForm(response.data.data.form);
            } catch (err) {
                setError('Failed to load feedback form. Please try again.');
                console.error('Failed to fetch form:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForm();
    }, [tenantId]);

    // Create theme from tenant config
    const theme = createTheme(tenant?.themeConfig);

    if (contextLoading || isLoading) {
        return (
            <ThemeProvider theme={theme}>
                <GlobalStyles />
                <Container>
                    <Card>
                        <LoadingContainer>Loading...</LoadingContainer>
                    </Card>
                </Container>
            </ThemeProvider>
        );
    }

    if (contextError || error) {
        return (
            <ThemeProvider theme={theme}>
                <GlobalStyles />
                <Container>
                    <Card>
                        <ErrorMessage>{contextError || error}</ErrorMessage>
                    </Card>
                </Container>
            </ThemeProvider>
        );
    }

    if (!form || !tenant) {
        return (
            <ThemeProvider theme={theme}>
                <GlobalStyles />
                <Container>
                    <Card>
                        <ErrorMessage>Form not found</ErrorMessage>
                    </Card>
                </Container>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <Container>
                <Card>
                    <Header>
                        {tenant.themeConfig.logoUrl && (
                            <Logo src={tenant.themeConfig.logoUrl} alt={tenant.name} />
                        )}
                        <Title>{tenant.name}</Title>
                        <Subtitle>We'd love to hear about your experience!</Subtitle>
                    </Header>

                    <FormRenderer
                        questions={form.fields}
                        tenantId={tenant.id}
                        tenantName={tenant.name}
                        formId={form.id}
                        primaryColor={tenant.themeConfig.primaryColor}
                        tipping={{
                            enabled: tenant.tipping.enabled,
                            upiId: tenant.tipping.vpa || tenant.tipping.upiId, // Fallback for backward compatibility
                            paypalEmail: tenant.tipping.paypalEmail
                        }}
                    />
                </Card>
            </Container>
        </ThemeProvider>
    );
}
