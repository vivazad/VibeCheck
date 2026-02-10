import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeEditor, QRGenerator, FormBuilder, TaskGovernor } from '../components/dashboard';
import apiClient from '../api/client';
import { Team } from './Settings/Team';

interface Tenant {
    id: string;
    name: string;
    themeConfig: {
        primaryColor: string;
        backgroundColor: string;
        logoUrl?: string;
        borderRadius: number;
        greetingTitle: string;
        greetingMessage: string;
    };
    settings: {
        alertThreshold: number;
        taskConfig: {
            requireResolutionNote: boolean;
            requireResolutionProof: boolean;
            allowReassignment: boolean;
        };
    };
}

interface FormSchema {
    id: string;
    type: 'nps' | 'csat' | 'text';
    label: string;
    required: boolean;
}

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

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Logo = styled.h1`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryLight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Main = styled.main`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TabsNav = styled.nav`
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  background: ${({ theme }) => theme.colors.surface};
  padding: 8px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  border: none;
  border-radius: 8px;
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.textSecondary)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'rgba(99, 102, 241, 0.1)')};
    color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.primary)};
  }
`;

const TabContent = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 32px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SuccessToast = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: ${({ theme }) => theme.colors.success};
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

type TabType = 'appearance' | 'questions' | 'team' | 'qr' | 'governor';

export function SettingsPage() {
    const navigate = useNavigate();
    const { isAuthenticated, tenantId } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('appearance');
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [user, setUser] = useState<{ role: string } | null>(null);
    const [formSchema, setFormSchema] = useState<FormSchema[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, formsRes] = await Promise.all([
                    apiClient.getProfile(),
                    apiClient.getForms(),
                ]);
                setTenant(profileRes.data.data.tenant);
                setUser(profileRes.data.data.user);

                // Get active form schema or default
                const forms = formsRes.data.data.forms;
                const activeForm = forms.find((f: { active: boolean }) => f.active);
                if (activeForm) {
                    setFormSchema(activeForm.schema);
                } else {
                    // Default schema
                    setFormSchema([
                        { id: 'nps_score', type: 'nps', label: 'How likely are you to recommend us?', required: true },
                        { id: 'csat_score', type: 'csat', label: 'Rate your overall experience', required: true },
                    ]);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (tenantId) {
            fetchData();
        }
    }, [tenantId]);

    const showSuccessToast = () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleSaveTheme = async (themeConfig: Tenant['themeConfig']) => {
        setIsSaving(true);
        try {
            await apiClient.updateSettings({ themeConfig });
            setTenant((prev) => prev ? { ...prev, themeConfig } : null);
            showSuccessToast();
        } catch (err) {
            console.error('Failed to save theme:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveForm = async (schema: FormSchema[]) => {
        setIsSaving(true);
        try {
            await apiClient.createForm({
                name: 'Customer Feedback',
                schema,
                setActive: true,
            });
            setFormSchema(schema);
            showSuccessToast();
        } catch (err) {
            console.error('Failed to save form:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveTaskConfig = async (taskConfig: Tenant['settings']['taskConfig']) => {
        setIsSaving(true);
        try {
            await apiClient.updateSettings({ settings: { taskConfig } });
            setTenant((prev) => prev ? { ...prev, settings: { ...prev.settings, taskConfig } } : null);
            showSuccessToast();
        } catch (err) {
            console.error('Failed to save task config:', err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Container>
            <Header>
                <HeaderLeft>
                    <Logo>VibeCheck</Logo>
                    <ThemeToggle />
                </HeaderLeft>
                <BackButton onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </BackButton>
            </Header>

            <Main>
                <TabsNav>
                    <TabButton $active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')}>
                        🎨 Theme
                    </TabButton>
                    <TabButton $active={activeTab === 'questions'} onClick={() => setActiveTab('questions')}>
                        📝 Questions
                    </TabButton>
                    {user?.role === 'admin' && (
                        <TabButton $active={activeTab === 'team'} onClick={() => setActiveTab('team')}>
                            👥 Team
                        </TabButton>
                    )}
                    <TabButton $active={activeTab === 'qr'} onClick={() => setActiveTab('qr')}>
                        🚀 Distribute
                    </TabButton>
                    <TabButton $active={activeTab === 'governor'} onClick={() => setActiveTab('governor')}>
                        ⚖️ Governor
                    </TabButton>
                </TabsNav>

                <TabContent>
                    {isLoading ? (
                        <LoadingContainer>Loading settings...</LoadingContainer>
                    ) : (
                        <>
                            {activeTab === 'appearance' && tenant && (
                                <ThemeEditor
                                    config={tenant.themeConfig}
                                    onSave={handleSaveTheme}
                                    isSaving={isSaving}
                                />
                            )}
                            {activeTab === 'questions' && (
                                <FormBuilder
                                    schema={formSchema}
                                    onSave={handleSaveForm}
                                    isSaving={isSaving}
                                />
                            )}
                            {activeTab === 'team' && user?.role === 'admin' && (
                                <Team />
                            )}
                            {activeTab === 'qr' && tenant && (
                                <QRGenerator
                                    tenantId={tenant.id}
                                    tenantName={tenant.name}
                                />
                            )}
                            {activeTab === 'governor' && tenant && (
                                <TaskGovernor
                                    config={tenant.settings.taskConfig}
                                    onSave={handleSaveTaskConfig}
                                    isSaving={isSaving}
                                />
                            )}
                        </>
                    )}
                </TabContent>
            </Main>

            {showSuccess && (
                <SuccessToast>✓ Changes saved successfully!</SuccessToast>
            )}
        </Container>
    );
}
