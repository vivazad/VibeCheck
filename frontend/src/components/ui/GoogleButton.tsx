import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import styled from 'styled-components';

interface GoogleButtonProps {
    onSuccess: (credentialResponse: any) => void;
    onError: () => void;
}

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

// Wrapper to center and style the Google Button consistently
export function GoogleButton({ onSuccess, onError }: GoogleButtonProps) {
    return (
        <Wrapper>
            <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                text="continue_with"
                shape="pill"
                width="400"  // Matches max-width of form
                logo_alignment="left"
            />
        </Wrapper>
    );
}

export function OAuthProvider({ children }: { children: React.ReactNode }) {
    // Replace with actual ENV var
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID";
    return (
        <GoogleOAuthProvider clientId={clientId}>
            {children}
        </GoogleOAuthProvider>
    );
}
