import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks';
import { ThemeToggle } from '../components/ThemeToggle';
import { TaskModal } from '../components/dashboard';
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

// Task Specific Styles
const TabContainer = styled.div`
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button<{ $active: boolean }>`
    padding: 12px 24px;
    background: transparent;
    border: none;
    border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
    font-weight: 600;
    cursor: pointer;
    &:hover { color: ${({ theme }) => theme.colors.primary}; }
`;

const TaskGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
`;

const TaskCard = styled.div`
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius}px;
    padding: 20px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Badge = styled.span<{ $type: 'HIGH' | 'MEDIUM' | 'LOW' }>`
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
    align-self: flex-start;
    background: ${({ $type }) => $type === 'HIGH' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
    color: ${({ $type }) => $type === 'HIGH' ? '#ef4444' : '#f59e0b'};
`;

const TaskTitle = styled.h3`
    font-size: 16px;
    color: ${({ theme }) => theme.colors.text};
    margin: 0;
`;

const TaskMeta = styled.div`
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textSecondary};
    display: flex;
    justify-content: space-between;
`;

const ActionRow = styled.div`
    display: flex;
    gap: 8px;
    margin-top: auto;
`;

const ResolveButton = styled.button`
    flex: 1;
    padding: 8px;
    background: ${({ theme }) => theme.colors.primary};
    color: white;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius}px;
    cursor: pointer;
    font-weight: 600;
    &:hover { opacity: 0.9; }
`;

const DelegateButton = styled.button`
    padding: 8px 12px;
    background: rgba(99, 102, 241, 0.1);
    color: ${({ theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }) => theme.colors.primary};
    border-radius: ${({ theme }) => theme.borderRadius}px;
    cursor: pointer;
    font-weight: 600;
    &:hover { background: rgba(99, 102, 241, 0.2); }
`;

export function TasksPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [status, setStatus] = useState('OPEN');
    const [isLoading, setIsLoading] = useState(true);
    const [tenantConfig, setTenantConfig] = useState<any>(null);

    // Modal state
    const [activeModal, setActiveModal] = useState<{ task: any, mode: 'resolve' | 'delegate' } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tasksRes, profileRes] = await Promise.all([
                apiClient.getTasks({ status }),
                apiClient.getProfile()
            ]);
            console.log('Fetched tasks:', tasksRes.data.data);
            setTasks(tasksRes.data.data);
            setTenantConfig(profileRes.data.data.tenant.settings.taskConfig);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [status]);

    const handleSuccess = () => {
        setActiveModal(null);
        fetchData();
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
                <TabContainer>
                    <Tab $active={status === 'OPEN'} onClick={() => setStatus('OPEN')}>Open Tasks</Tab>
                    <Tab $active={status === 'RESOLVED'} onClick={() => setStatus('RESOLVED')}>Resolved</Tab>
                </TabContainer>

                {isLoading ? (
                    <p style={{ color: '#9ca3af' }}>Loading tasks...</p>
                ) : (
                    <TaskGrid>
                        {tasks.map((task) => (
                            <TaskCard key={task._id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Badge $type={task.priority}>{task.priority}</Badge>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                        Due: {new Date(task.dueDate || task.slaBreachAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <TaskTitle>
                                    {task.locationId?.name || 'Unknown Location'}
                                </TaskTitle>
                                <TaskMeta>
                                    Assignee: {task.assignedTo || 'Unassigned'}
                                </TaskMeta>

                                <div style={{ fontSize: '14px', color: '#d1d5db', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
                                    {task.history[task.history.length - 1]?.note || 'No history notes available.'}
                                </div>

                                {status === 'OPEN' && (
                                    <ActionRow>
                                        {tenantConfig?.allowReassignment && (
                                            <DelegateButton onClick={() => setActiveModal({ task, mode: 'delegate' })}>
                                                Transfer
                                            </DelegateButton>
                                        )}
                                        <ResolveButton onClick={() => setActiveModal({ task, mode: 'resolve' })}>
                                            Mark Resolved
                                        </ResolveButton>
                                    </ActionRow>
                                )}
                            </TaskCard>
                        ))}
                    </TaskGrid>
                )}

                {activeModal && (
                    <TaskModal
                        task={activeModal.task}
                        mode={activeModal.mode}
                        config={tenantConfig}
                        onClose={() => setActiveModal(null)}
                        onSuccess={handleSuccess}
                    />
                )}
            </Main>
        </Container>
    );
}
