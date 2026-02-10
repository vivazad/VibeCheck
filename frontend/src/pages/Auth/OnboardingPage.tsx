import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';

const onboardingSchema = z.object({
  businessName: z.string().min(3, { message: 'Business Name must be at least 3 characters' }),
  logoUrl: z.string().optional(), // For now optional or text input
});

type OnboardingInputs = z.infer<typeof onboardingSchema>;

const Layout = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
`;

const Container = styled(motion.div)`
  width: 100%;
  max-width: 500px;
  background: white;
  padding: 48px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const Header = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 16px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  }
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 12px;
`;

const Button = styled(motion.button)`
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: white;
  padding: 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuccessOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  border-radius: 24px;
`;

const SuccessIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
  margin-bottom: 24px;
`;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingInputs>({
    resolver: zodResolver(onboardingSchema)
  });

  const onSubmit = async (data: OnboardingInputs) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/v1/auth/onboarding', data);
      const { token, user } = response.data;

      // Login with new token and tenantId
      login(token, user.tenantId);

      setSuccess(true);

      // Delay navigation to show animation
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to create workspace');
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Container
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {success ? (
            <SuccessOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <SuccessIcon
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </SuccessIcon>
              <Title>You're all set!</Title>
              <Subtitle>Redirecting to your dashboard...</Subtitle>
            </SuccessOverlay>
          ) : (
            <>
              <Header>
                <Title>Setup your workspace</Title>
                <Subtitle>Let's get your business ready for feedback.</Subtitle>
              </Header>

              <Form onSubmit={handleSubmit(onSubmit)}>
                <InputGroup>
                  <Label>Business Name</Label>
                  <Input
                    placeholder="Acme Inc."
                    autoFocus
                    {...register('businessName')}
                  />
                  {errors.businessName && <ErrorText>{errors.businessName.message}</ErrorText>}
                </InputGroup>

                <InputGroup>
                  <Label>Logo URL (Optional)</Label>
                  <Input
                    placeholder="https://..."
                    {...register('logoUrl')}
                  />
                </InputGroup>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Creating Workspace...' : 'Create Workspace'}
                </Button>
              </Form>
            </>
          )}
        </AnimatePresence>
      </Container>
    </Layout>
  );
}
