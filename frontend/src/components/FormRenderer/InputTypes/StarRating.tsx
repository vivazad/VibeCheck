import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
    value: number | null;
    onChange: (value: number) => void;
    disabled?: boolean;
    maxStars?: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StarsRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  
  @media (min-width: 768px) {
    gap: 12px;
    justify-content: flex-start;
  }
`;

const StarButton = styled(motion.button) <{ $active: boolean; $hovered: boolean }>`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 40px;
    height: 40px;
    fill: ${({ $active, $hovered }) =>
        $active ? 'var(--primary-color)' :
            $hovered ? 'rgba(var(--primary-rgb), 0.3)' :
                'transparent'};
    stroke: ${({ $active, $hovered, theme }) =>
        $active ? 'var(--primary-color)' :
            $hovered ? 'var(--primary-color)' :
                theme.colors.border};
    stroke-width: 1.5px;
    transition: fill 0.15s, stroke 0.15s;
    
    @media (min-width: 768px) {
      width: 48px;
      height: 48px;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RatingText = styled(motion.p)`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  text-align: center;
  
  @media (min-width: 768px) {
    text-align: left;
  }
`;

const ratingLabels: Record<number, string> = {
    1: 'Very Dissatisfied',
    2: 'Dissatisfied',
    3: 'Neutral',
    4: 'Satisfied',
    5: 'Very Satisfied',
};

export function StarRating({
    value,
    onChange,
    disabled,
    maxStars = 5
}: StarRatingProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

    const handleHover = (index: number) => {
        if (!disabled) {
            setHoveredIndex(index);
        }
    };

    const handleHoverEnd = () => {
        setHoveredIndex(null);
    };

    const handleClick = (rating: number) => {
        if (!disabled) {
            onChange(rating);
        }
    };

    const displayValue = hoveredIndex ?? value;

    return (
        <Container>
            <StarsRow onMouseLeave={handleHoverEnd}>
                {stars.map((rating) => {
                    const isActive = value !== null && rating <= value;
                    const isHovered = hoveredIndex !== null && rating <= hoveredIndex;

                    return (
                        <StarButton
                            key={rating}
                            $active={isActive}
                            $hovered={!isActive && isHovered}
                            onClick={() => handleClick(rating)}
                            onMouseEnter={() => handleHover(rating)}
                            disabled={disabled}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            animate={
                                value === rating
                                    ? { scale: [1, 1.2, 1] }
                                    : {}
                            }
                            transition={{
                                scale: { type: 'spring', stiffness: 400, damping: 10 },
                            }}
                        >
                            <Star />
                        </StarButton>
                    );
                })}
            </StarsRow>

            <AnimatePresence mode="wait">
                {displayValue && (
                    <RatingText
                        key={displayValue}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                    >
                        {ratingLabels[displayValue]}
                    </RatingText>
                )}
            </AnimatePresence>
        </Container>
    );
}
