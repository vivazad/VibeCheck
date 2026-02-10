import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthLayout } from '../../layouts/AuthLayout';
import { GoogleButton } from '../../components/ui/GoogleButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Display Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupInputs = z.infer<typeof signupSchema>;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 12px;
`;

const Button = styled.button`
  background: #4f46e5;
  color: white;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;

  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #6b7280;
  font-size: 14px;

  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e5e7eb;
  }
  
  span {
    padding: 0 10px;
  }
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 24px;
  color: #6b7280;
  font-size: 14px;

  a {
    color: #4f46e5;
    font-weight: 500;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

export function SignupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInputs>({
    resolver: zodResolver(signupSchema)
  });

  const handleSignup = async (data: SignupInputs) => {
    setIsLoading(true);
    try {
      await axios.post('/api/v1/auth/signup', data);
      // const user = response.data.user;

      // Navigate to onboarding
      navigate('/onboarding');
      toast.success('Account created!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const { login } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await axios.post('/api/v1/auth/google', {
        token: credentialResponse.credential
      });
      const { user, token } = response.data;

      if (user.status === 'pending_onboarding' || !user.tenantId) {
        navigate('/onboarding');
      } else {
        login(token, user.tenantId);
        navigate('/dashboard');
      }
      toast.success('Signed up with Google');
    } catch (error) {
      console.error(error);
      toast.error('Google sign up failed');
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start collecting feedback in minutes."
    >
      <GoogleButton
        onSuccess={handleGoogleSuccess}
        onError={() => toast.error('Google Sign Up Failed')}
      />

      <Divider>
        <span>Or sign up with email</span>
      </Divider>

      <Form onSubmit={handleSubmit(handleSignup)}>
        <InputGroup>
          <Label>Full Name</Label>
          <Input
            type="text"
            placeholder="John Doe"
            {...register('name')}
          />
          {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
        </InputGroup>

        <InputGroup>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="you@company.com"
            {...register('email')}
          />
          {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
        </InputGroup>

        <InputGroup>
          <Label>Password</Label>
          <Input
            type="password"
            placeholder="Min 6 characters"
            {...register('password')}
          />
          {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
        </InputGroup>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </Form>

      <FooterText>
        Already have an account? <Link to="/login">Sign in</Link>
      </FooterText>
    </AuthLayout>
  );
}
