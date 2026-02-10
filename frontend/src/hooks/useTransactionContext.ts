import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface TransactionContext {
    tenantId: string | null;
    orderId: string | null;
    storeId: string | null;
    source: 'qr_static' | 'qr_magic';
    amount: number | null;
    signature: string | null;
    isAnonymous: boolean;
    isLoading: boolean;
    error: string | null;
}

/**
 * Hook to parse transaction context from URL parameters
 */
export function useTransactionContext(): TransactionContext {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const context = useMemo(() => {
        const tenantId = searchParams.get('t') || searchParams.get('tenantId');
        const orderId = searchParams.get('o') || searchParams.get('orderId');
        const storeId = searchParams.get('store') || searchParams.get('storeId');
        const source = searchParams.get('src') as 'qr_static' | 'qr_magic' ||
            (orderId ? 'qr_magic' : 'qr_static');
        const amountStr = searchParams.get('amt') || searchParams.get('amount');
        const amount = amountStr ? parseFloat(amountStr) : null;
        const signature = searchParams.get('sig') || searchParams.get('signature');
        const isAnonymous = !orderId;

        return {
            tenantId,
            orderId,
            storeId,
            source,
            amount,
            signature,
            isAnonymous,
        };
    }, [searchParams]);

    useEffect(() => {
        if (!context.tenantId) {
            setError('Tenant ID is required');
        } else {
            setError(null);
        }
        setIsLoading(false);
    }, [context.tenantId]);

    return {
        ...context,
        isLoading,
        error,
    };
}
