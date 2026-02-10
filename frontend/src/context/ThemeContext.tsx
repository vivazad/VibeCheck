import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { createTheme, ThemeMode, lightTheme, darkTheme } from '../styles/theme';
import { GlobalStyles } from '../styles/GlobalStyles';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'vibecheck_theme';

interface ThemeProviderProps {
    children: ReactNode;
    tenantConfig?: {
        primaryColor?: string;
        borderRadius?: number;
    };
}

export function ThemeProvider({ children, tenantConfig }: ThemeProviderProps) {
    // Initialize from localStorage or default to 'light'
    const [mode, setMode] = useState<ThemeMode>(() => {
        if (typeof window === 'undefined') return 'light';
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        return (saved === 'dark' || saved === 'light') ? saved : 'light';
    });

    // Persist theme choice
    useEffect(() => {
        localStorage.setItem(THEME_STORAGE_KEY, mode);

        // Update document class for CSS-based styling if needed
        document.documentElement.setAttribute('data-theme', mode);
    }, [mode]);

    const toggleTheme = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Create theme with tenant overrides if provided
    const theme = tenantConfig
        ? createTheme(tenantConfig, mode)
        : mode === 'dark' ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
            <StyledThemeProvider theme={theme}>
                <GlobalStyles />
                {children}
            </StyledThemeProvider>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Export for backwards compatibility
export { ThemeContext };
