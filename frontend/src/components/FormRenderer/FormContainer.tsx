import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, FormProvider } from 'react-hook-form';
import { Toaster } from 'react-hot-toast';
import { QuestionCard } from './QuestionCard';
import { ProgressBar } from './ProgressBar';
import { ThankYouScreen } from './ThankYouScreen';
import { useSubmitFeedback } from '../../hooks/useSubmitFeedback';
import { useTransactionContext } from '../../hooks/useTransactionContext';

export interface FormQuestion {
    id: string;
    type: 'nps' | 'csat' | 'text' | 'phone';
    label: string;
    subtitle?: string;
    required: boolean;
    placeholder?: string;
}

export interface FormContainerProps {
    questions: FormQuestion[];
    tenantId: string;
    tenantName: string;
    formId?: string;
    primaryColor?: string;
    tipping?: {
        enabled: boolean;
        upiId?: string;
        paypalEmail?: string;
    };
}

const Wrapper = styled.div<{ $primaryColor: string }>`
  --primary-color: ${({ $primaryColor }) => $primaryColor};
  --primary-rgb: ${({ $primaryColor }) => {
        const hex = $primaryColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }};
  
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  padding: 20px;
  
  @media (min-width: 768px) {
    padding: 40px;
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 600px;
  position: relative;
`;

const CardWrapper = styled.div`
  position: relative;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavigationHint = styled(motion.p)`
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  margin-top: 24px;
  
  kbd {
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    padding: 2px 6px;
    font-family: inherit;
    font-size: 12px;
  }
`;

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -300 : 300,
        opacity: 0,
    }),
};

export function FormContainer({
    questions,
    tenantId,
    tenantName,
    formId,
    primaryColor = '#6366f1',
    tipping,
}: FormContainerProps) {
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);

    // Get transaction context from URL
    const transactionContext = useTransactionContext();

    // Setup form submission hook
    const { submit, isSubmitting, isSuccess, responseData } = useSubmitFeedback({
        tenantId,
        formId,
        metadata: {
            orderId: transactionContext.orderId ?? undefined,
            storeId: transactionContext.storeId ?? undefined,
            source: transactionContext.source,
        },
    });

    const methods = useForm({
        mode: 'onChange',
    });

    const currentQuestion = questions[currentStep];
    const isLastStep = currentStep === questions.length - 1;
    const progress = ((currentStep + 1) / questions.length) * 100;

    // Handle form submission
    const handleFormSubmit = useCallback(
        async (data: Record<string, unknown>) => {
            await submit(data);
        },
        [submit]
    );

    // Handle advancing to next question
    const goNext = useCallback(() => {
        if (isLastStep) {
            methods.handleSubmit(handleFormSubmit)();
        } else {
            setDirection(1);
            setCurrentStep((prev) => Math.min(prev + 1, questions.length - 1));
        }
    }, [isLastStep, methods, handleFormSubmit, questions.length]);

    // Handle going back
    const goBack = useCallback(() => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    // Auto-advance after selection (for NPS/CSAT)
    const handleAutoAdvance = useCallback(() => {
        if (!isLastStep) {
            setTimeout(() => {
                goNext();
            }, 400);
        }
    }, [goNext, isLastStep]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const value = methods.getValues(currentQuestion.id);
                if (value !== undefined && value !== '') {
                    e.preventDefault();
                    goNext();
                }
            }
            if (e.key === 'Backspace' && e.metaKey) {
                e.preventDefault();
                goBack();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentQuestion, goNext, goBack, methods]);

    // If submission successful, show thank you screen
    if (isSuccess) {
        return (
            <>
                <Toaster position="top-center" />
                <ThankYouScreen
                    tenantName={responseData?.tenant?.name || tenantName}
                    tipping={responseData?.tenant?.tipping || tipping}
                />
            </>
        );
    }

    return (
        <FormProvider {...methods}>
            <Toaster position="top-center" />
            <Wrapper $primaryColor={primaryColor}>
                <Container>
                    <ProgressBar progress={progress} />

                    <CardWrapper>
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: 'spring', stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                }}
                                style={{ width: '100%', position: 'absolute' }}
                            >
                                <QuestionCard
                                    question={currentQuestion}
                                    stepNumber={currentStep + 1}
                                    totalSteps={questions.length}
                                    isLastStep={isLastStep}
                                    isSubmitting={isSubmitting}
                                    onAutoAdvance={handleAutoAdvance}
                                    onNext={goNext}
                                    onBack={goBack}
                                    canGoBack={currentStep > 0}
                                />
                            </motion.div>
                        </AnimatePresence>
                    </CardWrapper>

                    <NavigationHint
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        {t('form.pressEnter', { defaultValue: 'Press Enter ↵ to continue' }).split('Enter').map((part, i, arr) => (
                            <span key={i}>
                                {part}
                                {i < arr.length - 1 && <kbd>Enter ↵</kbd>}
                            </span>
                        ))}
                    </NavigationHint>
                </Container>
            </Wrapper>
        </FormProvider>
    );
}
