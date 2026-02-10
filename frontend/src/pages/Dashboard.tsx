import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ReactECharts from 'echarts-for-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks';
import { ThemeToggle } from '../components/ThemeToggle';
import apiClient from '../api/client';

interface AnalyticsData {
    dailyTrends: Array<{
        date: string;
        avgNps: number;
        avgCsat: number;
        count: number;
    }>;
    heatmap: Array<{
        dayOfWeek: number;
        hour: number;
        avgNps: number;
        count: number;
    }>;
    storeBreakdown?: Array<{
        storeId: string | null;
        storeName: string;
        count: number;
        avgNps: number;
        avgCsat: number;
        npsScore: number;
    }>;
    summary: {
        totalResponses: number;
        avgNps: number;
        avgCsat: number;
        promoters: number;
        passives: number;
        detractors: number;
        npsScore: number;
    };
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

const Logo = styled.h1`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryLight});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const HeaderButton = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${({ $primary, theme }) =>
        $primary ? theme.colors.primary : 'transparent'};
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

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div<{ $variant?: 'success' | 'warning' | 'error' }>`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const SummaryValue = styled.div<{ $color?: string }>`
  font-size: 32px;
  font-weight: 700;
  color: ${({ $color, theme }) => $color || theme.colors.text};
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.colors.text};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

// Store Breakdown Styles
const StoreSection = styled.div`
  margin-top: 24px;
`;

const StoreTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const StoreTableHead = styled.thead`
  background: ${({ theme }) => theme.colors.background};
`;

const StoreTableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const StoreTableHeader = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StoreTableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
`;

const NpsScoreBadge = styled.span<{ $score: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 13px;
  background: ${({ $score }) =>
        $score >= 50 ? 'rgba(34, 197, 94, 0.15)' :
            $score >= 0 ? 'rgba(245, 158, 11, 0.15)' :
                'rgba(239, 68, 68, 0.15)'};
  color: ${({ $score }) =>
        $score >= 50 ? '#22c55e' :
            $score >= 0 ? '#f59e0b' :
                '#ef4444'};
`;

const RangeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const RangeButton = styled.button<{ $active: boolean }>`
  padding: 8px 16px;
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.textSecondary)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Dashboard() {
    const navigate = useNavigate();
    const { isAuthenticated, tenantId, logout } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [range, setRange] = useState('30d');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (!tenantId) return;

        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.getAnalytics(tenantId, range);
                setAnalytics(response.data.data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [tenantId, range]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Prepare heatmap data for ECharts
    const getHeatmapOption = () => {
        if (!analytics?.heatmap) return {};

        // Create a 7x24 matrix for the heatmap
        const data: [number, number, number][] = [];
        for (const item of analytics.heatmap) {
            data.push([item.hour, item.dayOfWeek, item.avgNps]);
        }

        return {
            tooltip: {
                position: 'top',
                formatter: (params: { value: [number, number, number] }) => {
                    const [hour, day, nps] = params.value;
                    return `${DAYS[day]} ${hour}:00 - NPS: ${nps.toFixed(1)}`;
                },
            },
            grid: {
                top: '10%',
                left: '15%',
                right: '10%',
                bottom: '15%',
            },
            xAxis: {
                type: 'category',
                data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                splitArea: { show: true },
                axisLabel: { color: '#9ca3af' },
            },
            yAxis: {
                type: 'category',
                data: DAYS,
                splitArea: { show: true },
                axisLabel: { color: '#9ca3af' },
            },
            visualMap: {
                min: 0,
                max: 10,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
                inRange: {
                    color: ['#ef4444', '#f59e0b', '#22c55e'],
                },
                textStyle: { color: '#9ca3af' },
            },
            series: [
                {
                    name: 'NPS Score',
                    type: 'heatmap',
                    data,
                    label: { show: false },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)',
                        },
                    },
                },
            ],
        };
    };

    return (
        <Container>
            <Header>
                <Logo>VibeCheck</Logo>
                <HeaderButtons>
                    <ThemeToggle />
                    <HeaderButton onClick={() => navigate('/dashboard/responses')}>
                        📊 View Responses
                    </HeaderButton>
                    <HeaderButton onClick={() => navigate('/dashboard/tasks')}>
                        📋 Tasks
                    </HeaderButton>
                    <HeaderButton onClick={() => navigate('/dashboard/integrations')}>
                        🔌 Integrations
                    </HeaderButton>
                    <HeaderButton $primary onClick={() => navigate('/dashboard/settings')}>
                        ⚙️ Settings
                    </HeaderButton>
                    <HeaderButton onClick={handleLogout}>Logout</HeaderButton>
                </HeaderButtons>
            </Header>

            <Main>
                <RangeSelector>
                    {['7d', '30d', '90d'].map((r) => (
                        <RangeButton
                            key={r}
                            $active={range === r}
                            onClick={() => setRange(r)}
                        >
                            {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                        </RangeButton>
                    ))}
                </RangeSelector>

                {isLoading ? (
                    <LoadingContainer>Loading analytics...</LoadingContainer>
                ) : analytics ? (
                    <>
                        <SummaryGrid>
                            <SummaryCard>
                                <SummaryLabel>NPS Score</SummaryLabel>
                                <SummaryValue $color={analytics.summary.npsScore >= 50 ? '#22c55e' : analytics.summary.npsScore >= 0 ? '#f59e0b' : '#ef4444'}>
                                    {analytics.summary.npsScore}
                                </SummaryValue>
                            </SummaryCard>
                            <SummaryCard>
                                <SummaryLabel>Total Responses</SummaryLabel>
                                <SummaryValue>{analytics.summary.totalResponses}</SummaryValue>
                            </SummaryCard>
                            <SummaryCard>
                                <SummaryLabel>Avg NPS</SummaryLabel>
                                <SummaryValue>{analytics.summary.avgNps}</SummaryValue>
                            </SummaryCard>
                            <SummaryCard>
                                <SummaryLabel>Avg CSAT</SummaryLabel>
                                <SummaryValue>{analytics.summary.avgCsat}/5</SummaryValue>
                            </SummaryCard>
                        </SummaryGrid>

                        <ChartGrid>
                            <ChartCard>
                                <ChartTitle>NPS Trend</ChartTitle>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analytics.dailyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3a" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#9ca3af"
                                            tick={{ fill: '#9ca3af' }}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis
                                            domain={[0, 10]}
                                            stroke="#9ca3af"
                                            tick={{ fill: '#9ca3af' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                background: '#1a1a23',
                                                border: '1px solid #2d2d3a',
                                                borderRadius: '8px',
                                            }}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="avgNps"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            dot={{ fill: '#6366f1' }}
                                            name="Avg NPS"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard>
                                <ChartTitle>Service Quality Heatmap</ChartTitle>
                                <ReactECharts
                                    option={getHeatmapOption()}
                                    style={{ height: 300 }}
                                    theme="dark"
                                />
                            </ChartCard>
                        </ChartGrid>

                        {/* Store Breakdown Section */}
                        {analytics.storeBreakdown && analytics.storeBreakdown.length > 0 && (
                            <StoreSection>
                                <ChartCard>
                                    <ChartTitle>📍 Store Performance</ChartTitle>
                                    <StoreTable>
                                        <StoreTableHead>
                                            <StoreTableRow>
                                                <StoreTableHeader>Store</StoreTableHeader>
                                                <StoreTableHeader>Responses</StoreTableHeader>
                                                <StoreTableHeader>Avg NPS</StoreTableHeader>
                                                <StoreTableHeader>Avg CSAT</StoreTableHeader>
                                                <StoreTableHeader>NPS Score</StoreTableHeader>
                                            </StoreTableRow>
                                        </StoreTableHead>
                                        <tbody>
                                            {analytics.storeBreakdown.map((store, idx) => (
                                                <StoreTableRow key={store.storeId || `store-${idx}`}>
                                                    <StoreTableCell style={{ fontWeight: 500 }}>
                                                        {store.storeId ? '🏪' : '🏢'} {store.storeName}
                                                    </StoreTableCell>
                                                    <StoreTableCell>{store.count}</StoreTableCell>
                                                    <StoreTableCell>{store.avgNps}</StoreTableCell>
                                                    <StoreTableCell>{store.avgCsat}/5</StoreTableCell>
                                                    <StoreTableCell>
                                                        <NpsScoreBadge $score={store.npsScore}>
                                                            {store.npsScore}
                                                        </NpsScoreBadge>
                                                    </StoreTableCell>
                                                </StoreTableRow>
                                            ))}
                                        </tbody>
                                    </StoreTable>
                                </ChartCard>
                            </StoreSection>
                        )}
                    </>
                ) : (
                    <LoadingContainer>No data available</LoadingContainer>
                )}
            </Main>
        </Container>
    );
}
