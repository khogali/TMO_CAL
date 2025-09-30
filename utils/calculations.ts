import { QuoteConfig, PlanPricingData, DiscountSettings, InsurancePlan, TradeInType, AccessoryPaymentType, Accessory } from '../types';

export interface CalculatedTotals {
  // Monthly
  basePlanPriceInCents: number;
  autopayDiscountInCents: number;
  insiderDiscountInCents: number;
  thirdLineFreeDiscountInCents: number;
  totalDiscountsInCents: number;
  finalPlanPriceInCents: number;
  insuranceCostInCents: number;
  monthlyDevicePaymentInCents: number;
  financedAccessoriesMonthlyCostInCents: number;
  monthlyTradeInCreditInCents: number;
  totalMonthlyAddonsInCents: number;
  calculatedTaxesInCents: number;
  totalMonthlyInCents: number;

  // Due Today
  activationFeeInCents: number;
  upgradeFeeInCents: number;
  totalOneTimeFeesInCents: number;
  paidInFullAccessoriesCostInCents: number;
  dueTodayDeviceTaxInCents: number;
  dueTodayFeesTaxInCents: number;
  paidInFullAccessoriesTaxInCents: number;
  financedAccessoriesTaxInCents: number;
  lumpSumTradeInInCents: number;
  optionalDownPaymentInCents: number;
  requiredDownPaymentInCents: number;
  dueTodayInCents: number;

  // For display/logic
  financedAccessories: (Accessory & { monthlyPaymentInCents: number })[];
  paidInFullAccessories: Accessory[];
  totalDeviceCostInCents: number;
}

const toCents = (dollars: number) => Math.round(dollars * 100);

export const calculateQuoteTotals = (
  config: QuoteConfig,
  planPricing: PlanPricingData,
  discountSettings: DiscountSettings,
  insurancePlans: InsurancePlan[]
): CalculatedTotals | null => {
  const { plan, lines, devices = [], discounts, taxRate, insuranceTier, insuranceLines, fees, accessories = [], maxEC, perLineEC } = config;
  const planDetails = planPricing[plan];
  if (!planDetails) {
    return null;
  }

  // --- Calculations ---
  
  const basePlanPriceInCents = toCents(planDetails.price[lines - 1] || 0);

  // Discounts
  const linesForAutopay = Math.min(lines, 8); // Cap the number of lines for AutoPay at 8
  const autopayDiscountInCents = discounts.autopay ? toCents(linesForAutopay * discountSettings.autopay) : 0;
  const insiderDiscountValue = basePlanPriceInCents * (discountSettings.insider / 100);
  const insiderDiscountInCents = discounts.insider ? Math.round(insiderDiscountValue) : 0;
  
  let thirdLineFreeDiscountInCents = 0;
  if (discounts.thirdLineFree && lines >= 3) {
      const twoLinePrice = planDetails.price[1] || 0;
      const threeLinePrice = planDetails.price[2] || 0;
      thirdLineFreeDiscountInCents = toCents(threeLinePrice - twoLinePrice);
  }
  const totalDiscountsInCents = autopayDiscountInCents + insiderDiscountInCents + thirdLineFreeDiscountInCents;
  const finalPlanPriceInCents = basePlanPriceInCents - totalDiscountsInCents;
  
  // --- REVISED FINANCING LOGIC ---
  const safeAccessories = accessories.map(acc => ({ ...acc, quantity: acc.quantity || 1, term: acc.term || 12, downPayment: acc.downPayment || 0 }));
  const financedAccessoriesRaw = safeAccessories.filter(acc => acc.paymentType === AccessoryPaymentType.FINANCED);

  const allFinancedItems = [
    ...devices.map(d => ({ 
        price: d.price || 0, 
        downPayment: d.downPayment || 0, 
        term: d.term || 24, 
        quantity: 1
    })),
    ...financedAccessoriesRaw
  ];

  // 1. Calculate total cost of all equipment the user wants to finance.
  const totalEquipmentCostInCents = allFinancedItems.reduce((sum, item) => sum + toCents(item.price * item.quantity), 0);

  // 2. Calculate the total optional down payment the user has entered.
  const optionalDownPaymentInCents = allFinancedItems.reduce((sum, item) => sum + toCents(item.downPayment * item.quantity), 0);

  // 3. Determine the amount the user intends to finance after their optional down payment.
  const amountToFinanceBeforeLimitInCents = totalEquipmentCostInCents - optionalDownPaymentInCents;

  // 4. Calculate the account's total available financing credit.
  const availableFinancingLimitInCents = Math.min(toCents(maxEC || 0), toCents(perLineEC || 0) * lines);

  // 5. Calculate any required down payment. This is the amount exceeding the financing limit.
  const requiredDownPaymentInCents = Math.max(0, amountToFinanceBeforeLimitInCents - availableFinancingLimitInCents);

  // 6. Calculate the final total amount that will be financed and have monthly payments.
  const totalFinancedPrincipalInCents = amountToFinanceBeforeLimitInCents - requiredDownPaymentInCents;
  
  // 7. Distribute the total financed principal proportionally to calculate monthly payments for each item.
  let monthlyDevicePaymentInCents = 0;
  devices.forEach(dev => {
    const principal = toCents(dev.price) - toCents(dev.downPayment);
    if (principal > 0 && amountToFinanceBeforeLimitInCents > 0) {
      const share = principal / amountToFinanceBeforeLimitInCents;
      const financedAmount = totalFinancedPrincipalInCents * share;
      monthlyDevicePaymentInCents += Math.round(financedAmount / (dev.term || 24));
    }
  });

  let financedAccessoriesMonthlyCostInCents = 0;
  const financedAccessories = financedAccessoriesRaw.map(acc => {
    const principal = toCents(acc.price * acc.quantity) - toCents(acc.downPayment * acc.quantity);
    let monthlyPaymentInCents = 0;
    if (principal > 0 && amountToFinanceBeforeLimitInCents > 0) {
        const share = principal / amountToFinanceBeforeLimitInCents;
        const financedAmount = totalFinancedPrincipalInCents * share;
        monthlyPaymentInCents = Math.round(financedAmount / (acc.term || 12));
    }
    financedAccessoriesMonthlyCostInCents += monthlyPaymentInCents;
    return { ...acc, monthlyPaymentInCents };
  });

  // --- Other Costs ---
  const totalDeviceCostInCents = devices.reduce((sum, dev) => sum + toCents(Number(dev.price) || 0), 0);

  const lumpSumTradeInInCents = devices
    .filter(dev => dev.tradeInType === TradeInType.LUMP_SUM)
    .reduce((sum, dev) => sum + toCents(Number(dev.tradeIn) || 0), 0);
    
  const monthlyCreditTradeInValue = devices
    .filter(dev => dev.tradeInType === TradeInType.MONTHLY_CREDIT)
    .reduce((sum, dev) => sum + (Number(dev.tradeIn) || 0), 0);
  const monthlyCreditTradeInInCents = toCents(monthlyCreditTradeInValue);
  const monthlyTradeInCreditInCents = monthlyCreditTradeInInCents > 0 ? Math.round(monthlyCreditTradeInInCents / 24) : 0;
  
  const insuranceDetails = insuranceTier === 'none'
    ? { id: 'none', name: 'None', price: 0 }
    : insurancePlans.find(p => p.id === insuranceTier) || { id: 'not-found', name: 'N/A', price: 0 };
  const insuranceCostInCents = toCents(insuranceDetails.price * (insuranceLines || 0));

  const paidInFullAccessories = safeAccessories.filter(acc => acc.paymentType === AccessoryPaymentType.FULL);
  const paidInFullAccessoriesCostInCents = paidInFullAccessories
    .reduce((sum, acc) => sum + toCents(acc.price * acc.quantity), 0);
  const paidInFullAccessoriesTaxInCents = Math.round(paidInFullAccessoriesCostInCents * ((Number(taxRate) || 0) / 100));
  
  const financedAccessoriesFullCostInCents = financedAccessoriesRaw.reduce((sum, acc) => sum + toCents(acc.price * acc.quantity), 0);
  const financedAccessoriesTaxInCents = Math.round(financedAccessoriesFullCostInCents * ((Number(taxRate) || 0) / 100));
  
  const totalMonthlyAddonsInCents = insuranceCostInCents + monthlyDevicePaymentInCents + financedAccessoriesMonthlyCostInCents - monthlyTradeInCreditInCents;

  let calculatedTaxesInCents = 0;
  if (!planDetails.taxesIncluded) {
    const taxableMonthlyAmountInCents = basePlanPriceInCents + insuranceCostInCents;
    calculatedTaxesInCents = Math.round(taxableMonthlyAmountInCents * ((Number(taxRate) || 0) / 100));
  }

  const activationFeeInCents = fees?.activation ? toCents(lines * 10) : 0;
  const upgradeFeeInCents = fees?.upgrade ? toCents(lines * 35) : 0;
  const totalOneTimeFeesInCents = activationFeeInCents + upgradeFeeInCents;

  const totalMonthlyInCents = finalPlanPriceInCents + totalMonthlyAddonsInCents + calculatedTaxesInCents;
  
  const dueTodayDeviceTaxInCents = Math.round(totalDeviceCostInCents * ((Number(taxRate) || 0) / 100));
  const dueTodayFeesTaxInCents = Math.round(totalOneTimeFeesInCents * ((Number(taxRate) || 0) / 100));
  const dueTodayInCents = dueTodayDeviceTaxInCents - lumpSumTradeInInCents + totalOneTimeFeesInCents + dueTodayFeesTaxInCents + paidInFullAccessoriesCostInCents + paidInFullAccessoriesTaxInCents + financedAccessoriesTaxInCents + optionalDownPaymentInCents + requiredDownPaymentInCents;

  return {
    basePlanPriceInCents,
    autopayDiscountInCents,
    insiderDiscountInCents,
    thirdLineFreeDiscountInCents,
    totalDiscountsInCents,
    finalPlanPriceInCents,
    insuranceCostInCents,
    monthlyDevicePaymentInCents,
    financedAccessoriesMonthlyCostInCents,
    monthlyTradeInCreditInCents,
    totalMonthlyAddonsInCents,
    calculatedTaxesInCents,
    totalMonthlyInCents,
    activationFeeInCents,
    upgradeFeeInCents,
    totalOneTimeFeesInCents,
    paidInFullAccessoriesCostInCents,
    dueTodayDeviceTaxInCents,
    dueTodayFeesTaxInCents,
    paidInFullAccessoriesTaxInCents,
    financedAccessoriesTaxInCents,
    lumpSumTradeInInCents,
    optionalDownPaymentInCents,
    requiredDownPaymentInCents,
    dueTodayInCents,
    financedAccessories,
    paidInFullAccessories,
    totalDeviceCostInCents,
  };
};