import { useState, useCallback } from 'react';

interface UseAuthReturn {
    isAuthenticated: boolean;
    tenantId: string | null;
    token: string | null;
    login: (token: string, tenantId: string) => void;
    logout: () => void;
}

// Helper to get initial value from localStorage
const getInitialToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('vibecheck_token');
};

const getInitialTenantId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('vibecheck_tenantId');
};

/**
 * Hook for authentication state management
 * Initializes from localStorage synchronously to prevent flash of unauthenticated state
 */
export function useAuth(): UseAuthReturn {
    const [token, setToken] = useState<string | null>(getInitialToken);
    const [tenantId, setTenantId] = useState<string | null>(getInitialTenantId);

    const login = useCallback((newToken: string, newTenantId: string) => {
        localStorage.setItem('vibecheck_token', newToken);
        localStorage.setItem('vibecheck_tenantId', newTenantId);
        setToken(newToken);
        setTenantId(newTenantId);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('vibecheck_token');
        localStorage.removeItem('vibecheck_tenantId');
        setToken(null);
        setTenantId(null);
    }, []);

    return {
        isAuthenticated: !!token,
        tenantId,
        token,
        login,
        logout,
    };
}
