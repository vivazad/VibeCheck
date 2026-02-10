import { IAnswer, IFormField, IMetrics } from '../models/index.js';

/**
 * Calculate NPS and CSAT metrics from form answers
 * NPS: 0-10 scale (Promoters: 9-10, Passives: 7-8, Detractors: 0-6)
 * CSAT: 1-5 scale (star rating)
 */
export function calculateMetrics(
    answers: IAnswer[],
    formSchema: IFormField[]
): IMetrics {
    const metrics: IMetrics = {};

    // Create a map of field types by ID
    const fieldTypeMap = new Map<string, string>();
    for (const field of formSchema) {
        fieldTypeMap.set(field.id, field.type);
    }

    // Extract metrics from answers
    for (const answer of answers) {
        const fieldType = fieldTypeMap.get(answer.questionId);

        if (fieldType === 'nps' && typeof answer.value === 'number') {
            // NPS score: 0-10
            const score = Math.max(0, Math.min(10, answer.value));
            metrics.npsScore = score;
        } else if (fieldType === 'csat' && typeof answer.value === 'number') {
            // CSAT score: 1-5
            const score = Math.max(1, Math.min(5, answer.value));
            metrics.csatScore = score;
        }
    }

    return metrics;
}

/**
 * Classify NPS score into category
 */
export function classifyNPS(score: number): 'promoter' | 'passive' | 'detractor' {
    if (score >= 9) return 'promoter';
    if (score >= 7) return 'passive';
    return 'detractor';
}

/**
 * Check if response should trigger an alert
 */
export function shouldTriggerAlert(npsScore: number | undefined, threshold: number): boolean {
    if (npsScore === undefined) return false;
    return npsScore <= threshold;
}
