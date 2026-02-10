import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface SubmitMetadata {
    orderId?: string;
    phone?: string;
    storeId?: string;
    source?: string;
}

interface SubmitResponse {
    success: boolean;
    message?: string;
    data?: {
        responseId: string;
        metrics: {
            npsScore?: number;
            csatScore?: number;
        };
        tenant: {
            name: string;
            tipping?: {
                enabled: boolean;
                upiId?: string;
                paypalEmail?: string;
            };
            themeConfig?: Record<string, unknown>;
        };
    };
    error?: string;
}

interface UseSubmitFeedbackOptions {
    tenantId: string;
    formId?: string;
    metadata?: SubmitMetadata;
}

interface UseSubmitFeedbackReturn {
    submit: (formData: Record<string, unknown>) => Promise<boolean>;
    isSubmitting: boolean;
    isSuccess: boolean;
    responseData: SubmitResponse['data'] | null;
    reset: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || '';

export function useSubmitFeedback({
    tenantId,
    formId,
    metadata = {},
}: UseSubmitFeedbackOptions): UseSubmitFeedbackReturn {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [responseData, setResponseData] = useState<SubmitResponse['data'] | null>(null);

    const submit = useCallback(
        async (formData: Record<string, unknown>): Promise<boolean> => {
            if (isSubmitting) return false;

            setIsSubmitting(true);

            try {
                // Transform form data to answers array format
                const answers = Object.entries(formData).map(([questionId, value]) => ({
                    questionId,
                    value,
                }));

                // Construct payload
                const payload = {
                    tenantId,
                    formId,
                    answers,
                    metadata: {
                        ...metadata,
                        source: metadata.source || (metadata.orderId ? 'qr_magic' : 'qr_static'),
                    },
                };

                // Fire API request
                const response = await axios.post<SubmitResponse>(
                    `${API_URL}/api/v1/submit`,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        timeout: 15000, // 15 second timeout
                    }
                );

                if (response.data.success) {
                    setIsSuccess(true);
                    setResponseData(response.data.data || null);

                    // Haptic feedback for mobile
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }

                    // Success toast
                    toast.success('Thank you for your feedback!', {
                        duration: 3000,
                        icon: '🎉',
                    });

                    return true;
                } else {
                    // API returned success: false
                    toast.error(response.data.error || 'Something went wrong. Please try again.');
                    return false;
                }
            } catch (error) {
                console.error('Submit feedback error:', error);

                // Handle specific error cases
                const axiosError = error as AxiosError<{ error?: string }>;

                if (axiosError.response) {
                    // Server responded with error
                    const statusCode = axiosError.response.status;
                    const errorMessage = axiosError.response.data?.error;

                    if (statusCode === 400) {
                        toast.error(errorMessage || 'Invalid submission. Please check your input.');
                    } else if (statusCode === 404) {
                        toast.error('Feedback form not found. Please scan the QR code again.');
                    } else if (statusCode === 429) {
                        toast.error('Too many submissions. Please wait a moment and try again.');
                    } else {
                        toast.error('Could not submit feedback. Please try again.');
                    }
                } else if (axiosError.request) {
                    // Network error
                    toast.error('Network error. Please check your connection and try again.');
                } else {
                    // Unknown error
                    toast.error('Something went wrong. Please try again.');
                }

                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [tenantId, formId, metadata, isSubmitting]
    );

    const reset = useCallback(() => {
        setIsSubmitting(false);
        setIsSuccess(false);
        setResponseData(null);
    }, []);

    return {
        submit,
        isSubmitting,
        isSuccess,
        responseData,
        reset,
    };
}
