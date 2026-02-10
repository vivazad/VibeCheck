import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
`;

const ThemeToggleWrapper = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
`;

const Hero = styled.div`
  text-align: center;
  max-width: 600px;
`;

const Logo = styled.h1`
  font-size: 64px;
  font-weight: 800;
  margin-bottom: 16px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryLight}, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Tagline = styled.p`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 40px;
`;

const CTAContainer = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const CTAButton = styled(Link) <{ $variant?: 'primary' | 'secondary' }>`
  padding: 16px 32px;
  background: ${({ $variant, theme }) =>
    $variant === 'secondary'
      ? 'transparent'
      : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryDark})`};
  border: ${({ $variant, theme }) =>
    $variant === 'secondary' ? `2px solid ${theme.colors.border}` : 'none'};
  border-radius: ${({ theme }) => theme.borderRadius}px;
  color: ${({ $variant, theme }) => ($variant === 'secondary' ? theme.colors.text : 'white')};
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $variant, theme }) =>
    $variant === 'secondary' ? 'none' : `0 8px 20px ${theme.colors.shadow}`};
    text-decoration: none;
  }
`;

const Features = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 80px;
  max-width: 800px;
`;

const Feature = styled.div`
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 40px;
  margin-bottom: 12px;
`;

const FeatureTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.colors.text};
`;

const FeatureDesc = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export function HomePage() {
  return (
    <Container>
      <ThemeToggleWrapper>
        <ThemeToggle />
      </ThemeToggleWrapper>

      <Hero>
        <Logo>VibeCheck</Logo>
        <Tagline>
          Collect NPS & CSAT feedback via QR codes. Recover unhappy customers.
          Grow your business.
        </Tagline>
        <CTAContainer>
          <CTAButton to="/login">Get Started</CTAButton>
          <CTAButton to="/login" $variant="secondary">
            Login
          </CTAButton>
        </CTAContainer>
      </Hero>

      <Features>
        <Feature>
          <FeatureIcon>📊</FeatureIcon>
          <FeatureTitle>Real-time Analytics</FeatureTitle>
          <FeatureDesc>Track NPS trends and service quality heatmaps</FeatureDesc>
        </Feature>
        <Feature>
          <FeatureIcon>🔔</FeatureIcon>
          <FeatureTitle>Instant Alerts</FeatureTitle>
          <FeatureDesc>Get notified when customers are unhappy</FeatureDesc>
        </Feature>
        <Feature>
          <FeatureIcon>💰</FeatureIcon>
          <FeatureTitle>Integrated Tipping</FeatureTitle>
          <FeatureDesc>Let happy customers tip via UPI or PayPal</FeatureDesc>
        </Feature>
      </Features>
    </Container>
  );
}
