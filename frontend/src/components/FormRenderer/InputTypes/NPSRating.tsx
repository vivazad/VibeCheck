import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface NPSRatingProps {
    value: number | null;
    onChange: (value: number) => void;
    disabled?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ButtonGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  
  @media (min-width: 768px) {
    gap: 10px;
    justify-content: flex-start;
  }
`;

const ScoreButton = styled(motion.button) <{ $active: boolean; $hovered: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid ${({ $active, $hovered, theme }) =>
        $active ? 'var(--primary-color)' :
            $hovered ? 'var(--primary-color)' :
                theme.colors.border};
  background: ${({ $active, $hovered }) =>
        $active ? 'var(--primary-color)' :
            $hovered ? 'rgba(var(--primary-rgb), 0.1)' :
                'transparent'};
  color: ${({ $active, theme }) =>
        $active ? 'white' : theme.colors.text};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (min-width: 768px) {
    width: 52px;
    height: 52px;
    font-size: 18px;
  }
`;

const ScaleLabels = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
`;

const ScaleLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  
  @media (min-width: 768px) {
    font-size: 13px;
  }
`;

const CategoryFeedback = styled(motion.div) <{ $category: 'detractor' | 'passive' | 'promoter' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  
  ${({ $category }) => {
        switch ($category) {
            case 'promoter':
                return `
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        `;
            case 'passive':
                return `
          background: rgba(234, 179, 8, 0.1);
          color: #ca8a04;
        `;
            case 'detractor':
                return `
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        `;
        }
    }}
`;

const getCategory = (score: number): 'detractor' | 'passive' | 'promoter' => {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
};



export function NPSRating({ value, onChange, disabled }: NPSRatingProps) {
    const { t } = useTranslation();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const scores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // ... (handlers remain the same)

    const handleHover = (index: number) => {
        if (!disabled) {
            setHoveredIndex(index);
        }
    };

    const handleHoverEnd = () => {
        setHoveredIndex(null);
    };

    const handleClick = (score: number) => {
        if (!disabled) {
            onChange(score);
        }
    };

    // Helper to get translated category text
    const getCategoryText = (category: 'detractor' | 'passive' | 'promoter'): string => {
        return t(`nps.${category}Badge`);
    };

    return (
        <Container>
            <ButtonGrid onMouseLeave={handleHoverEnd}>
                {scores.map((score) => {
                    const isActive = value !== null && score <= value;
                    const isHovered = hoveredIndex !== null && score <= hoveredIndex;

                    return (
                        <ScoreButton
                            key={score}
                            $active={isActive}
                            $hovered={!isActive && isHovered}
                            onClick={() => handleClick(score)}
                            onMouseEnter={() => handleHover(score)}
                            disabled={disabled}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {score}
                        </ScoreButton>
                    );
                })}
            </ButtonGrid>

            <ScaleLabels>
                <ScaleLabel>{t('nps.notLikely', { defaultValue: 'Not likely at all' })}</ScaleLabel>
                <ScaleLabel>{t('nps.extremelyLikely', { defaultValue: 'Extremely likely' })}</ScaleLabel>
            </ScaleLabels>

            {value !== null && (
                <CategoryFeedback
                    $category={getCategory(value)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {getCategoryText(getCategory(value))}
                </CategoryFeedback>
            )}
        </Container>
    );
}
