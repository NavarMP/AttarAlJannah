/**
 * Commission Calculator Utilities
 * 
 * Two types of commissions:
 * 1. Delivery Commission: Flat ₹10 per bottle for delivery duty
 * 2. Referral Commission: Tiered system based on cumulative bottles referred
 */

/**
 * Calculate delivery commission for a volunteer
 * @param bottlesDelivered - Number of bottles in the delivered order
 * @returns Commission amount (₹10 per bottle)
 */
export function calculateDeliveryCommission(bottlesDelivered: number): number {
    const DELIVERY_COMMISSION_PER_BOTTLE = 10;
    return bottlesDelivered * DELIVERY_COMMISSION_PER_BOTTLE;
}

/**
 * Calculate referral commission based on tiered system
 * 
 * Tier structure:
 * - ₹2 per bottle for first 10 bottles (1-10)
 * - ₹4 per bottle for next 10 bottles (11-20)
 * - ₹6 per bottle for next 10 bottles (21-30)
 * - ₹8 per bottle for 31+ bottles
 * 
 * @param totalBottles - Cumulative total bottles from all 'ordered' and 'delivered' orders
 * @returns Total commission amount
 * 
 * @example
 * calculateReferralCommission(5)  // ₹10 (5 × ₹2)
 * calculateReferralCommission(15) // ₹40 (10 × ₹2 + 5 × ₹4)
 * calculateReferralCommission(35) // ₹140 (10×₹2 + 10×₹4 + 10×₹6 + 5×₹8)
 */
export function calculateReferralCommission(totalBottles: number): number {
    let commission = 0;

    if (totalBottles <= 0) {
        return 0;
    }

    if (totalBottles <= 10) {
        // Tier 1: ₹2 per bottle
        commission = totalBottles * 2;
    } else if (totalBottles <= 20) {
        // Tier 1: 10 bottles at ₹2 = ₹20
        // Tier 2: remaining bottles at ₹4
        commission = (10 * 2) + ((totalBottles - 10) * 4);
    } else if (totalBottles <= 30) {
        // Tier 1: 10 bottles at ₹2 = ₹20
        // Tier 2: 10 bottles at ₹4 = ₹40
        // Tier 3: remaining bottles at ₹6
        commission = (10 * 2) + (10 * 4) + ((totalBottles - 20) * 6);
    } else {
        // Tier 1: 10 bottles at ₹2 = ₹20
        // Tier 2: 10 bottles at ₹4 = ₹40
        // Tier 3: 10 bottles at ₹6 = ₹60
        // Tier 4: remaining bottles at ₹8
        commission = (10 * 2) + (10 * 4) + (10 * 6) + ((totalBottles - 30) * 8);
    }

    return commission;
}

/**
 * Get the commission breakdown by tier
 * Useful for displaying detailed commission information to volunteers
 */
export function getCommissionBreakdown(totalBottles: number): {
    tier: number;
    bottles: number;
    ratePerBottle: number;
    subtotal: number;
}[] {
    const breakdown: {
        tier: number;
        bottles: number;
        ratePerBottle: number;
        subtotal: number;
    }[] = [];

    if (totalBottles <= 0) return breakdown;

    // Tier 1: First 10 bottles at ₹2
    const tier1Bottles = Math.min(totalBottles, 10);
    breakdown.push({
        tier: 1,
        bottles: tier1Bottles,
        ratePerBottle: 2,
        subtotal: tier1Bottles * 2,
    });

    // Tier 2: Next 10 bottles at ₹4
    if (totalBottles > 10) {
        const tier2Bottles = Math.min(totalBottles - 10, 10);
        breakdown.push({
            tier: 2,
            bottles: tier2Bottles,
            ratePerBottle: 4,
            subtotal: tier2Bottles * 4,
        });
    }

    // Tier 3: Next 10 bottles at ₹6
    if (totalBottles > 20) {
        const tier3Bottles = Math.min(totalBottles - 20, 10);
        breakdown.push({
            tier: 3,
            bottles: tier3Bottles,
            ratePerBottle: 6,
            subtotal: tier3Bottles * 6,
        });
    }

    // Tier 4: Remaining bottles at ₹8
    if (totalBottles > 30) {
        const tier4Bottles = totalBottles - 30;
        breakdown.push({
            tier: 4,
            bottles: tier4Bottles,
            ratePerBottle: 8,
            subtotal: tier4Bottles * 8,
        });
    }

    return breakdown;
}
