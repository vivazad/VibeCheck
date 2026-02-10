import { shouldTriggerAlert, formatAlertMessage } from '../../services/alertService';

describe('AlertService', () => {
    describe('shouldTriggerAlert', () => {
        it('should trigger alert for NPS score below threshold (default 5)', () => {
            expect(shouldTriggerAlert(4)).toBe(true);
            expect(shouldTriggerAlert(3)).toBe(true);
            expect(shouldTriggerAlert(0)).toBe(true);
        });

        it('should not trigger alert for NPS score at or above threshold', () => {
            expect(shouldTriggerAlert(5)).toBe(false);
            expect(shouldTriggerAlert(6)).toBe(false);
            expect(shouldTriggerAlert(10)).toBe(false);
        });

        it('should respect custom threshold', () => {
            expect(shouldTriggerAlert(6, 7)).toBe(true);
            expect(shouldTriggerAlert(7, 7)).toBe(false);
        });

        it('should handle edge case of threshold 0', () => {
            expect(shouldTriggerAlert(0, 0)).toBe(false);
            expect(shouldTriggerAlert(-1, 0)).toBe(true);
        });
    });

    describe('formatAlertMessage', () => {
        it('should format alert message with all fields', () => {
            const message = formatAlertMessage({
                tenantName: 'Test Restaurant',
                npsScore: 3,
                orderId: 'ORD-123',
                feedback: 'Food was cold',
            });

            expect(message).toContain('Test Restaurant');
            expect(message).toContain('3');
            expect(message).toContain('ORD-123');
            expect(message).toContain('Food was cold');
        });

        it('should handle missing optional fields', () => {
            const message = formatAlertMessage({
                tenantName: 'Test Store',
                npsScore: 2,
            });

            expect(message).toContain('Test Store');
            expect(message).toContain('2');
            expect(message).not.toContain('undefined');
        });

        it('should truncate long feedback', () => {
            const longFeedback = 'A'.repeat(300);
            const message = formatAlertMessage({
                tenantName: 'Test',
                npsScore: 1,
                feedback: longFeedback,
            });

            // Message should be reasonably sized
            expect(message.length).toBeLessThan(500);
        });
    });
});
