import { ReactNode } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  background-color: #ffffff;
`;

const LeftPanel = styled.div`
  display: none;
  flex: 1;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
  padding: 80px;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  position: relative;
  overflow: hidden;

  @media (min-width: 1024px) {
    display: flex;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: #ffffff;
`;

const FormContainer = styled(motion.div)`
  width: 100%;
  max-width: 440px;
`;

const Logo = styled.div`
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #818cf8, #c7d2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
`;

const Branding = styled.div`
  z-index: 10;
`;

const Heading = styled.h1`
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
`;

const SubText = styled.p`
  font-size: 18px;
  color: #a5b4fc;
  max-width: 480px;
  line-height: 1.6;
`;

const Testimonial = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 32px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
`;

const Quote = styled.p`
  font-size: 16px;
  line-height: 1.6;
  font-style: italic;
  margin-bottom: 16px;
  color: #e0e7ff;
`;

const Author = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

const AuthorInfo = styled.div`
  div:first-child {
    font-weight: 600;
    color: white;
  }
  div:last-child {
    font-size: 14px;
    color: #a5b4fc;
  }
`;

const Header = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 30px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 16px;
`;

// Decorative circles
const Circle = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(99,102,241,0) 70%);
`;

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <Container>
            <LeftPanel>
                <Branding>
                    <Logo>VibeCheck</Logo>
                    <Heading>Turn customer feedback into your superpower.</Heading>
                    <SubText>
                        Join 10,000+ businesses collecting actionable insights with our beautiful, high-converting forms.
                    </SubText>
                </Branding>

                <Testimonial>
                    <Quote>"VibeCheck transformed how we listen to our customers. Our NPS score jumped 20 points in just two months!"</Quote>
                    <Author>
                        <AuthorAvatar>SJ</AuthorAvatar>
                        <AuthorInfo>
                            <div>Sarah Jenkins</div>
                            <div>Owner, The Coffee House</div>
                        </AuthorInfo>
                    </Author>
                </Testimonial>

                <Circle
                    style={{ top: '-10%', right: '-10%', width: '400px', height: '400px' }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
                <Circle
                    style={{ bottom: '10%', left: '-10%', width: '300px', height: '300px' }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 15, repeat: Infinity }}
                />
            </LeftPanel>

            <RightPanel>
                <FormContainer
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Header>
                        <Title>{title}</Title>
                        <Subtitle>{subtitle}</Subtitle>
                    </Header>
                    {children}
                </FormContainer>
            </RightPanel>
        </Container>
    );
}
