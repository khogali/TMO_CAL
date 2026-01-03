
import { describe, it, expect } from 'vitest';
import { calculateQuoteTotals } from './calculations';
import { INITIAL_PLANS, INITIAL_SERVICE_PLANS, INITIAL_INSURANCE_PLANS, INITIAL_PROMOTIONS, INITIAL_DEVICE_DATABASE } from '../constants';
import { QuoteConfig, CustomerType, DiscountSettings, DeviceCategory } from '../types';

const defaultDiscountSettings: DiscountSettings = { autopay: 5, insider: 20, thirdLineFree: 0 };

// A base config to build upon
const baseConfig: QuoteConfig = {
    customerName: 'Test Customer',
    customerPhone: '1234567890',
    customerType: CustomerType.STANDARD,
    plan: 'experience-beyond',
    lines: 1,
    insuranceTier: 'none',
    insuranceLines: 0,
    devices: [],
    accessories: [],
    discounts: {
        autopay: true,
        insider: false,
        thirdLineFree: false,
    },
    fees: {
        activation: false,
    },
    taxRate: 10, // Using a simple 10% tax rate for easy math
    maxEC: 4500, // Updated default
    perLineEC: 1000, // Updated default
};

describe('calculateQuoteTotals', () => {
    it('calculates a basic quote for a single line correctly', () => {
        const config: QuoteConfig = { ...baseConfig, lines: 1 };
        const totals = calculateQuoteTotals(config, INITIAL_PLANS, INITIAL_SERVICE_PLANS, defaultDiscountSettings, INITIAL_INSURANCE_PLANS, INITIAL_PROMOTIONS, INITIAL_DEVICE_DATABASE);
        
        expect(totals).not.toBeNull();
        if (!totals) return;

        // Plan price: $105
        expect(totals.basePlanPriceInCents).toBe(10500);
        // Autopay: $5
        expect(totals.autopayDiscountInCents).toBe(500);
        // Final plan price: 105 - 5 = $100
        expect(totals.finalPlanPriceInCents).toBe(10000);
        // Tax is included in this plan
        expect(totals.calculatedTaxesInCents).toBe(0);
        // Total monthly: $100
        expect(totals.totalMonthlyInCents).toBe(10000);
        // No due today costs
        expect(totals.dueTodayInCents).toBe(0);
    });

    it('applies the insider discount correctly', () => {
        const config: QuoteConfig = { 
            ...baseConfig, 
            lines: 2, // $180 plan
            discounts: { ...baseConfig.discounts, insider: true } 
        };
        const totals = calculateQuoteTotals(config, INITIAL_PLANS, INITIAL_SERVICE_PLANS, defaultDiscountSettings, INITIAL_INSURANCE_PLANS, INITIAL_PROMOTIONS, INITIAL_DEVICE_DATABASE);

        expect(totals).not.toBeNull();
        if (!totals) return;

        // Plan price: $180
        expect(totals.basePlanPriceInCents).toBe(18000);
        // Insider discount: 20% of $180 = $36
        expect(totals.insiderDiscountInCents).toBe(3600);
        // Autopay: 2 lines * $5 = $10
        expect(totals.autopayDiscountInCents).toBe(1000);
        // Total monthly = 180 - 36 - 10 = $134
        expect(totals.totalMonthlyInCents).toBe(13400);
    });

    it('applies the 3rd Line Free discount correctly', () => {
        const config: QuoteConfig = {
            ...baseConfig,
            lines: 3, // 2 lines = $180, 3 lines = $230
            discounts: { ...baseConfig.discounts, thirdLineFree: true }
        };
        const totals = calculateQuoteTotals(config, INITIAL_PLANS, INITIAL_SERVICE_PLANS, defaultDiscountSettings, INITIAL_INSURANCE_PLANS, INITIAL_PROMOTIONS, INITIAL_DEVICE_DATABASE);
        
        expect(totals).not.toBeNull();
        if (!totals) return;
        
        // 3rd line free value: $230 - $180 = $50
        expect(totals.thirdLineFreeDiscountInCents).toBe(5000);
        // Autopay is on 2 lines, not 3: 2 * 5 = 10
        expect(totals.autopayDiscountInCents).toBe(1000);
         // Final plan price: 230 - 50 - 10 = $170
        expect(totals.finalPlanPriceInCents).toBe(17000);
        // Total monthly: $170
        expect(totals.totalMonthlyInCents).toBe(17000);
    });

    it('calculates due today costs for a financed device', () => {
        const config: QuoteConfig = {
            ...baseConfig,
            devices: [{
                id: 'dev1',
                category: DeviceCategory.PHONE,
                modelId: 'iphone-15-pro',
                variantSku: 'APL-IP15P-128-NTL',
                price: 999,
                tradeIn: 200,
                tradeInType: 'manual',
                appliedPromoId: null,
                term: 24,
                downPayment: 100
            }]
        };
        const totals = calculateQuoteTotals(config, INITIAL_PLANS, INITIAL_SERVICE_PLANS, defaultDiscountSettings, INITIAL_INSURANCE_PLANS, INITIAL_PROMOTIONS, INITIAL_DEVICE_DATABASE);
        
        expect(totals).not.toBeNull();
        if (!totals) return;

        // Monthly device payment: (999 - 100) / 24 = 37.46 -> rounded to 3746 cents
        expect(totals.monthlyDevicePaymentInCents).toBe(3746);
        // Optional down payment: $100
        expect(totals.optionalDownPaymentInCents).toBe(10000);
        // Tax on device price minus trade-in: 10% of ($999 - $200) = $79.90
        expect(totals.dueTodayDeviceTaxInCents).toBe(7990);
        // Due today: $100 (down payment) + $79.90 (tax) = $179.90
        expect(totals.dueTodayInCents).toBe(17990);
    });
});
