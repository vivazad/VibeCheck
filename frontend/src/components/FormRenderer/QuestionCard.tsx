import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { useFormContext } from 'react-hook-form';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { FormQuestion } from './FormContainer';
import { NPSRating } from './InputTypes/NPSRating';
import { StarRating } from './InputTypes/StarRating';
import { TextFeedback } from './InputTypes/TextFeedback';

interface QuestionCardProps {
    question: FormQuestion;
    stepNumber: number;
    totalSteps: number;
    isLastStep: boolean;
    isSubmitting: boolean;
    onAutoAdvance: () => void;
    onNext: () => void;
    onBack: () => void;
    canGoBack: boolean;
}

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 60px -15px rgba(var(--primary-rgb), 0.15);
  
  @media (min-width: 768px) {
    padding: 48px;
  }
`;

const StepIndicator = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const QuestionLabel = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 16px 0 8px;
  line-height: 1.3;
  
  @media (min-width: 768px) {
    font-size: 28px;
  }
`;

const QuestionSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 15px;
  margin-bottom: 32px;
  line-height: 1.5;
`;

const InputWrapper = styled.div`
  margin-bottom: 32px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled(motion.button) <{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  ${({ $variant, theme }) =>
        $variant === 'secondary'
            ? `
        background: transparent;
        border: 2px solid ${theme.colors.border};
        color: ${theme.colors.textSecondary};
        
        &:hover {
          border-color: ${theme.colors.text};
          color: ${theme.colors.text};
        }
      `
            : `
        background: var(--primary-color);
        border: none;
        color: white;
        
        &:hover {
          opacity: 0.9;
        }
      `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RequiredBadge = styled.span`
  color: ${({ theme }) => theme.colors.error || '#ef4444'};
  margin-left: 4px;
`;

const shakeAnimation = {
    shake: {
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4 },
    },
};

export function QuestionCard({
    question,
    stepNumber,
    totalSteps,
    isLastStep,
    isSubmitting,
    onAutoAdvance,
    onNext,
    onBack,
    canGoBack,
}: QuestionCardProps) {
    const { t } = useTranslation();
    const { register, setValue, watch, trigger } = useFormContext();
    const controls = useAnimation();

    const currentValue = watch(question.id);
    const hasValue = currentValue !== undefined && currentValue !== '';

    // Handle value change
    const handleChange = useCallback(
        (value: number | string) => {
            setValue(question.id, value);

            // Auto-advance for NPS and CSAT
            if (question.type === 'nps' || question.type === 'csat') {
                onAutoAdvance();
            }
        },
        [question.id, question.type, setValue, onAutoAdvance]
    );

    // Handle next click with validation
    const handleNextClick = async () => {
        if (question.required && !hasValue) {
            // Shake animation for validation error
            controls.start('shake');
            return;
        }

        const isValid = await trigger(question.id);
        if (isValid || !question.required) {
            onNext();
        } else {
            controls.start('shake');
        }
    };

    // Render input based on type
    const renderInput = () => {
        switch (question.type) {
            case 'nps':
                return (
                    <NPSRating
                        value={typeof currentValue === 'number' ? currentValue : null}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />
                );
            case 'csat':
                return (
                    <StarRating
                        value={typeof currentValue === 'number' ? currentValue : null}
                        onChange={handleChange}
                        disabled={isSubmitting}
                    />
                );
            case 'text':
            case 'phone':
                return (
                    <TextFeedback
                        {...register(question.id, { required: question.required })}
                        placeholder={question.placeholder || (question.type === 'phone' ? t('placeholders.enterPhone') : t('placeholders.shareThoughts'))}
                        type={question.type === 'phone' ? 'tel' : 'text'}
                        disabled={isSubmitting}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Card
            variants={shakeAnimation}
            animate={controls}
        >
            <StepIndicator>
                {t('form.questionStep', { step: stepNumber, total: totalSteps, defaultValue: `Question ${stepNumber} of ${totalSteps}` })}
            </StepIndicator>

            <QuestionLabel>
                {question.label}
                {question.required && <RequiredBadge>*</RequiredBadge>}
            </QuestionLabel>

            {question.subtitle && (
                <QuestionSubtitle>{question.subtitle}</QuestionSubtitle>
            )}

            <InputWrapper>
                {renderInput()}
            </InputWrapper>

            <ButtonRow>
                {canGoBack && (
                    <Button
                        $variant="secondary"
                        onClick={onBack}
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <ChevronLeft size={18} />
                        {t('form.backButton', { defaultValue: 'Back' })}
                    </Button>
                )}

                {/* Only show Next/Submit for text inputs - NPS/CSAT auto-advance */}
                {(question.type === 'text' || question.type === 'phone' || isLastStep) && (
                    <Button
                        onClick={handleNextClick}
                        disabled={isSubmitting || (question.required && !hasValue)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isSubmitting ? (
                            t('form.submitting', { defaultValue: 'Submitting...' })
                        ) : isLastStep ? (
                            <>
                                {t('form.submitButton', { defaultValue: 'Submit' })}
                                <Send size={18} />
                            </>
                        ) : (
                            <>
                                {t('form.nextButton', { defaultValue: 'Next' })}
                                <ChevronRight size={18} />
                            </>
                        )}
                    </Button>
                )}
            </ButtonRow>
        </Card>
    );
}
