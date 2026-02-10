import { calculateMetrics } from '../../services/metricsService';
import { IFormField } from '../../models/Form';

describe('MetricsService', () => {
    describe('calculateMetrics', () => {
        const mockSchema: IFormField[] = [
            { id: 'nps_score', type: 'nps', label: 'How likely?', required: true },
            { id: 'csat_score', type: 'csat', label: 'Rate experience', required: true },
            { id: 'feedback', type: 'text', label: 'Comments', required: false },
        ];

        it('should calculate NPS score from answers', () => {
            const answers = [
                { questionId: 'nps_score', value: 9 },
                { questionId: 'csat_score', value: 5 },
            ];

            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics).toHaveProperty('npsScore', 9);
            expect(metrics).toHaveProperty('csatScore', 5);
        });

        it('should handle promoter NPS (9-10)', () => {
            const answers = [{ questionId: 'nps_score', value: 10 }];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.npsScore).toBe(10);
            expect(metrics.npsScore).toBeGreaterThanOrEqual(9);
        });

        it('should handle passive NPS (7-8)', () => {
            const answers = [{ questionId: 'nps_score', value: 8 }];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.npsScore).toBe(8);
            expect(metrics.npsScore).toBeGreaterThanOrEqual(7);
            expect(metrics.npsScore).toBeLessThanOrEqual(8);
        });

        it('should handle detractor NPS (0-6)', () => {
            const answers = [{ questionId: 'nps_score', value: 4 }];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.npsScore).toBe(4);
            expect(metrics.npsScore).toBeLessThanOrEqual(6);
        });

        it('should handle CSAT score range (1-5)', () => {
            const answers = [{ questionId: 'csat_score', value: 4 }];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.csatScore).toBe(4);
        });

        it('should handle text feedback without affecting numeric scores', () => {
            const answers = [
                { questionId: 'nps_score', value: 7 },
                { questionId: 'feedback', value: 'Great service!' },
            ];

            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.npsScore).toBe(7);
            expect(metrics.csatScore).toBeUndefined();
        });

        it('should handle empty answers array', () => {
            const answers: Array<{ questionId: string; value: number | string }> = [];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.npsScore).toBeUndefined();
            expect(metrics.csatScore).toBeUndefined();
        });

        it('should handle mismatched question IDs', () => {
            const answers = [{ questionId: 'unknown_question', value: 5 }];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.npsScore).toBeUndefined();
            expect(metrics.csatScore).toBeUndefined();
        });

        it('should handle edge case NPS of 0', () => {
            const answers = [{ questionId: 'nps_score', value: 0 }];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.npsScore).toBe(0);
        });

        it('should handle CSAT minimum value of 1', () => {
            const answers = [{ questionId: 'csat_score', value: 1 }];
            const metrics = calculateMetrics(answers, mockSchema);

            expect(metrics.csatScore).toBe(1);
        });
    });
});
