import { DefaultTheme } from 'styled-components';

export type ThemeMode = 'light' | 'dark';

interface ThemeConfig {
    primaryColor?: string;
    borderRadius?: number;
}

// Taqtics-inspired colors (teal/cyan brand)
const TAQTICS_PRIMARY = '#00BFA6'; // Teal primary
const TAQTICS_PRIMARY_DARK = '#00A08A';
const TAQTICS_PRIMARY_LIGHT = '#4DD0C4';
const TAQTICS_ACCENT = '#FF6B6B'; // Coral accent

// Color utility functions
const lighten = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
};

const darken = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
};

/**
 * Light theme colors (Taqtics-inspired)
 */
const lightColors = {
    primary: TAQTICS_PRIMARY,
    primaryDark: TAQTICS_PRIMARY_DARK,
    primaryLight: TAQTICS_PRIMARY_LIGHT,
    accent: TAQTICS_ACCENT,
    background: '#F8FAFB',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    shadow: 'rgba(15, 23, 42, 0.08)',
    overlay: 'rgba(15, 23, 42, 0.5)',
};

/**
 * Dark theme colors (Taqtics-inspired)
 */
const darkColors = {
    primary: TAQTICS_PRIMARY,
    primaryDark: TAQTICS_PRIMARY_DARK,
    primaryLight: TAQTICS_PRIMARY_LIGHT,
    accent: TAQTICS_ACCENT,
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    success: '#22C55E',
    warning: '#FBBF24',
    error: '#F87171',
    border: '#334155',
    borderLight: '#475569',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
};

/**
 * Create a theme from tenant config and mode
 */
export function createTheme(config: ThemeConfig = {}, mode: ThemeMode = 'light'): DefaultTheme {
    const primaryColor = config.primaryColor || TAQTICS_PRIMARY;
    const borderRadius = config.borderRadius || 12;
    const colors = mode === 'dark' ? darkColors : lightColors;

    // Override primary if custom color provided
    const finalColors = config.primaryColor
        ? {
            ...colors,
            primary: primaryColor,
            primaryDark: darken(primaryColor, 15),
            primaryLight: lighten(primaryColor, 30),
        }
        : colors;

    return {
        mode,
        colors: finalColors,
        borderRadius,
        fonts: {
            heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            body: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        shadows: {
            sm: `0 1px 2px ${finalColors.shadow}`,
            md: `0 4px 6px ${finalColors.shadow}`,
            lg: `0 10px 15px ${finalColors.shadow}`,
            xl: `0 20px 25px ${finalColors.shadow}`,
        },
        transitions: {
            fast: '0.15s ease',
            normal: '0.2s ease',
            slow: '0.3s ease',
        },
    };
}

// Default themes
export const lightTheme = createTheme({}, 'light');
export const darkTheme = createTheme({}, 'dark');

// For backward compatibility
export const defaultTheme = lightTheme;
