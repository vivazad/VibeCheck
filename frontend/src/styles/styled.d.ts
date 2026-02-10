import 'styled-components';

declare module 'styled-components' {
    export interface DefaultTheme {
        mode: 'light' | 'dark';
        colors: {
            primary: string;
            primaryDark: string;
            primaryLight: string;
            accent?: string;
            background: string;
            surface: string;
            surfaceSecondary?: string;
            text: string;
            textSecondary: string;
            textMuted?: string;
            success: string;
            warning: string;
            error: string;
            border: string;
            borderLight?: string;
            shadow?: string;
            overlay?: string;
        };
        borderRadius: number;
        fonts: {
            heading?: string;
            body: string;
        };
        shadows?: {
            sm: string;
            md: string;
            lg: string;
            xl: string;
        };
        transitions?: {
            fast: string;
            normal: string;
            slow: string;
        };
    }
}
