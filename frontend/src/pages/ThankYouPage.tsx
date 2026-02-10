import { useLocation, Link } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { GlobalStyles } from '../styles/GlobalStyles';
import { createTheme } from '../styles/theme';

interface LocationState {
  tenant: {
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
      merchantId?: string;
    };
  };
  metrics: {
    npsScore?: number;
    csatScore?: number;
  };
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius * 2}px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.success}, #16a34a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 40px;
  animation: scaleIn 0.3s ease-out;

  @keyframes scaleIn {
    from {
      transform: scale(0);
    }
    to {
      transform: scale(1);
    }
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.text};
`;

const Message = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 32px;
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 24px 0;
`;

const TippingSection = styled.div`
  margin-top: 24px;
`;

const TipTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.text};
`;

const TipMessage = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 16px;
`;

const TipButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
    text-decoration: none;
  }
`;

const HomeLink = styled(Link)`
  display: inline-block;
  margin-top: 24px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export function ThankYouPage() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  const tenant = state?.tenant;
  const metrics = state?.metrics;
  const theme = createTheme(tenant?.themeConfig);

  // Check if tipping should be shown (NPS >= 9 and tipping enabled)
  const showTipping =
    metrics?.npsScore !== undefined &&
    metrics.npsScore >= 9 &&
    tenant?.tipping?.enabled;

  // Generate UPI link
  const getUPILink = () => {
    if (tenant?.tipping?.provider === 'UPI' && tenant?.tipping?.vpa) {
      const params = new URLSearchParams({
        pa: tenant.tipping.vpa,
        pn: tenant.name,
        cu: 'INR',
      });
      return `upi://pay?${params.toString()}`;
    }
    return null;
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <Container>
        <Card>
          <SuccessIcon>✓</SuccessIcon>
          <Title>Thank You!</Title>
          <Message>
            Your feedback helps us improve and serve you better.
            {metrics?.npsScore !== undefined && metrics.npsScore >= 9 && (
              <><br /><br />🎉 We're thrilled you had a great experience!</>
            )}
          </Message>

          {showTipping && (
            <>
              <Divider />
              <TippingSection>
                <TipTitle>Show Your Appreciation</TipTitle>
                <TipMessage>
                  Loved the service? You can leave a tip for the team!
                </TipMessage>
                {tenant?.tipping?.provider === 'UPI' && (
                  <TipButton href={getUPILink() || '#'}>
                    💰 Leave a Tip via UPI
                  </TipButton>
                )}
                {tenant?.tipping?.provider === 'PAYPAL' && (
                  <TipButton
                    href={`https://paypal.me/${tenant?.tipping?.merchantId || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    💰 Leave a Tip via PayPal
                  </TipButton>
                )}
              </TippingSection>
            </>
          )}

          <HomeLink to="/">← Back to Home</HomeLink>
        </Card>
      </Container>
    </ThemeProvider>
  );
}
