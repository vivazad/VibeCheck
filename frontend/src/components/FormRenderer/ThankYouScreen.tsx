import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { CheckCircle, Heart, ExternalLink } from 'lucide-react';

interface ThankYouScreenProps {
    tenantName: string;
    tipping?: {
        enabled: boolean;
        upiId?: string;
        paypalEmail?: string;
    };
    onClose?: () => void;
}

const confettiAnimation = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
`;

const ConfettiPiece = styled.div<{ $delay: number; $left: number; $color: string }>`
  position: fixed;
  bottom: -20px;
  left: ${({ $left }) => $left}%;
  width: 12px;
  height: 12px;
  background: ${({ $color }) => $color};
  border-radius: 2px;
  animation: ${confettiAnimation} 3s ease-out forwards;
  animation-delay: ${({ $delay }) => $delay}s;
  z-index: 100;
`;

const Container = styled(motion.div)`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: ${({ theme }) => theme.colors.background};
  text-align: center;
`;

const IconWrapper = styled(motion.div)`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  box-shadow: 0 20px 60px -15px rgba(34, 197, 94, 0.4);
`;

const Title = styled(motion.h1)`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 16px;
  
  @media (min-width: 768px) {
    font-size: 40px;
  }
`;

const Message = styled(motion.p)`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: 40px;
`;

const TipSection = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 24px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px -15px rgba(var(--primary-rgb), 0.1);
`;

const TipTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TipSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 24px;
`;

const TipButton = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  background: linear-gradient(135deg, var(--primary-color, #6366f1), #4f46e5);
  color: white;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  width: 100%;
  
  &:hover {
    opacity: 0.9;
  }
`;

const SkipLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  margin-top: 16px;
  cursor: pointer;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const confettiColors = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6'];

export function ThankYouScreen({ tenantName, tipping, onClose }: ThankYouScreenProps) {
    // Generate confetti pieces
    const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: confettiColors[i % confettiColors.length],
    }));

    // Generate UPI link
    const getUpiLink = () => {
        if (tipping?.upiId) {
            return `upi://pay?pa=${tipping.upiId}&pn=${encodeURIComponent(tenantName)}&cu=INR`;
        }
        return null;
    };

    // Generate PayPal link
    const getPaypalLink = () => {
        if (tipping?.paypalEmail) {
            return `https://paypal.me/${tipping.paypalEmail}`;
        }
        return null;
    };

    const tipLink = getUpiLink() || getPaypalLink();
    const showTipping = tipping?.enabled && tipLink;

    return (
        <>
            {/* Confetti effect */}
            {confettiPieces.map((piece) => (
                <ConfettiPiece
                    key={piece.id}
                    $left={piece.left}
                    $delay={piece.delay}
                    $color={piece.color}
                />
            ))}

            <Container
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <IconWrapper
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                    <CheckCircle size={48} color="white" />
                </IconWrapper>

                <Title
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    Thank You!
                </Title>

                <Message
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    Your feedback helps {tenantName} improve. We truly appreciate you taking the time to share your thoughts.
                </Message>

                {showTipping && (
                    <TipSection
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <TipTitle>
                            <Heart size={20} color="#ec4899" fill="#ec4899" />
                            Leave a Tip
                        </TipTitle>
                        <TipSubtitle>
                            Show extra appreciation for great service
                        </TipSubtitle>
                        <TipButton
                            href={tipLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Send Tip
                            <ExternalLink size={16} />
                        </TipButton>
                        {onClose && (
                            <SkipLink onClick={onClose}>
                                Maybe later
                            </SkipLink>
                        )}
                    </TipSection>
                )}
            </Container>
        </>
    );
}
