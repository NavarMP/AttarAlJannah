/**
 * Commission calculation utilities for volunteers
 * Commission rate: ₹10 per bottle after the first 20 bottles
 */

export interface CommissionBreakdown {
    totalBottles: number;
    bottlesEligibleForCommission: number;
    commissionPerBottle: number;
    totalCommission: number;
}

/**
 * Calculate commission based on confirmed bottles
 * @param confirmedBottles - Number of confirmed bottles delivered
 * @returns Total commission amount in ₹
 */
export function calculateCommission(confirmedBottles: number): number {
    const COMMISSION_THRESHOLD = 20;
    const COMMISSION_PER_BOTTLE = 10;

    if (confirmedBottles <= COMMISSION_THRESHOLD) {
        return 0;
    }

    return (confirmedBottles - COMMISSION_THRESHOLD) * COMMISSION_PER_BOTTLE;
}

/**
 * Get detailed commission breakdown
 * @param confirmedBottles - Number of confirmed bottles delivered
 * @returns Detailed commission breakdown
 */
export function getCommissionBreakdown(confirmedBottles: number): CommissionBreakdown {
    const COMMISSION_THRESHOLD = 20;
    const COMMISSION_PER_BOTTLE = 10;

    const bottlesEligibleForCommission = Math.max(0, confirmedBottles - COMMISSION_THRESHOLD);
    const totalCommission = bottlesEligibleForCommission * COMMISSION_PER_BOTTLE;

    return {
        totalBottles: confirmedBottles,
        bottlesEligibleForCommission,
        commissionPerBottle: COMMISSION_PER_BOTTLE,
        totalCommission,
    };
}
