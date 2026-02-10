import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';

const ToggleButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.text};
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &:hover {
        background: ${({ theme }) => theme.colors.surfaceSecondary};
        border-color: ${({ theme }) => theme.colors.primary};
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }
`;

const IconWrapper = styled.span<{ $visible: boolean }>`
    position: absolute;
    transition: all 0.3s ease;
    opacity: ${({ $visible }) => $visible ? 1 : 0};
    transform: ${({ $visible }) => $visible ? 'rotate(0deg) scale(1)' : 'rotate(180deg) scale(0.5)'};
`;

export function ThemeToggle() {
    const { mode, toggleTheme } = useTheme();
    const isDark = mode === 'dark';

    return (
        <ToggleButton
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <IconWrapper $visible={!isDark}>☀️</IconWrapper>
            <IconWrapper $visible={isDark}>🌙</IconWrapper>
        </ToggleButton>
    );
}
