import { QuoteConfig, PlanPricingData, DiscountSettings, InsurancePlan, AccessoryPaymentType, Accessory, ServicePlan, Promotion, AppliedPromotion, PromotionEffectType, PlanDetails, PricingModel, CalculatedTotals, PromotionCategory, DeviceDatabase, TradeInRequirement, DeviceCategory, StackingGroup } from '../types';
import { checkCondition } from './conditionUtils';

const toCents = (dollars: number) => Math.round(dollars * 100);

const _getBasePlanPriceInCents = (plan: PlanDetails, lines: number): number => {
  if (plan.pricingModel === PricingModel.PER_LINE) {
    if (lines === 1) return toCents(plan.firstLinePrice || 0);
    return toCents((plan.firstLinePrice || 0) + (lines - 1) * (plan.additionalLinePrice || 0));
  }
  if (plan.tieredPrices && lines > 0 && lines <= plan.tieredPrices.length) {
    return toCents(plan.tieredPrices[lines - 1] || 0);
  }
  return 0;
};

const _calculateStandardDiscounts = (config: QuoteConfig, planDetails: PlanDetails, discountSettings: DiscountSettings, basePlanPriceInCents: number) => {
    let thirdLineFreeDiscountInCents = 0;
    if (config.discounts.thirdLineFree && config.lines >= 3 && planDetails.pricingModel === PricingModel.TIERED && planDetails.tieredPrices) {
        const twoLinePrice = planDetails.tieredPrices[1] || 0;
        const threeLinePrice = planDetails.tieredPrices[2] || 0;
        thirdLineFreeDiscountInCents = toCents(threeLinePrice - twoLinePrice);
    }
    
    const linesForAutopay = thirdLineFreeDiscountInCents > 0 ? config.lines - 1 : config.lines;
    const maxAutopayLines = Math.min(linesForAutopay, 8);
    const autopayDiscountInCents = config.discounts.autopay ? toCents(maxAutopayLines * discountSettings.autopay) : 0;
    
    const insiderDiscountValue = basePlanPriceInCents * (discountSettings.insider / 100);
    const insiderDiscountInCents = config.discounts.insider ? Math.round(insiderDiscountValue) : 0;

    return { thirdLineFreeDiscountInCents, autopayDiscountInCents, insiderDiscountInCents };
};

const _calculateFinancing = (config: QuoteConfig, instantDeviceRebateInCents: number) => {
    const { devices = [], accessories = [], lines, maxEC, perLineEC } = config;
    const totalLinesForEC = lines + (devices || []).filter(d => d.servicePlanId).length;

    const financedByDevicesInCents = devices.reduce((sum, d) => sum + toCents((d.price || 0) - (d.downPayment || 0)), 0) - instantDeviceRebateInCents;
    const financedAccessoriesRaw = (accessories || []).filter(acc => acc.paymentType === AccessoryPaymentType.FINANCED);
    const financedByAccessoriesInCents = financedAccessoriesRaw.reduce((sum, a) => sum + toCents(((a.price || 0) * (a.quantity || 1)) - ((a.downPayment || 0) * (a.quantity || 1))), 0);
    
    const amountToFinanceBeforeLimitInCents = financedByDevicesInCents + financedByAccessoriesInCents;
    
    let availableFinancingLimitInCents = 0;
    if ((maxEC || 0) > 0 && (perLineEC || 0) > 0) {
        availableFinancingLimitInCents = Math.min(toCents(maxEC || 0), toCents(perLineEC || 0) * totalLinesForEC);
    } else if ((maxEC || 0) > 0) {
        availableFinancingLimitInCents = toCents(maxEC || 0);
    } else {
        availableFinancingLimitInCents = toCents(perLineEC || 0) * totalLinesForEC;
    }

    const requiredDownPaymentInCents = Math.max(0, amountToFinanceBeforeLimitInCents - availableFinancingLimitInCents);
    const totalFinancedPrincipalInCents = amountToFinanceBeforeLimitInCents - requiredDownPaymentInCents;

    let monthlyDevicePaymentInCents = 0;
    devices.forEach(dev => {
        const principal = toCents(dev.price) - toCents(dev.downPayment);
        if (principal > 0 && amountToFinanceBeforeLimitInCents > 0) {
            const share = principal / (financedByDevicesInCents + instantDeviceRebateInCents); // Base on original principal
            const financedAmount = (totalFinancedPrincipalInCents + requiredDownPaymentInCents) * share - (instantDeviceRebateInCents * share);
            monthlyDevicePaymentInCents += Math.round(financedAmount / (dev.term || 24));
        }
    });

    let financedAccessoriesMonthlyCostInCents = 0;
    const financedAccessories = financedAccessoriesRaw.map(acc => {
        const principal = toCents((acc.price || 0) * (acc.quantity || 1)) - toCents((acc.downPayment || 0) * (acc.quantity || 1));
        let monthlyPaymentInCents = 0;
        if (principal > 0 && amountToFinanceBeforeLimitInCents > 0) {
            const share = principal / amountToFinanceBeforeLimitInCents;
            const financedAmount = totalFinancedPrincipalInCents * share;
            monthlyPaymentInCents = Math.round(financedAmount / (acc.term || 12));
        }
        financedAccessoriesMonthlyCostInCents += monthlyPaymentInCents;
        return { ...acc, monthlyPaymentInCents };
    });

    return {
        financedByDevicesInCents, financedByAccessoriesInCents,
        amountToFinanceBeforeLimitInCents, availableFinancingLimitInCents, requiredDownPaymentInCents,
        totalFinancedPrincipalInCents, monthlyDevicePaymentInCents, financedAccessoriesMonthlyCostInCents,
        financedAccessories, totalLinesForEC,
    };
};

const _calculateDueTodayCosts = (
    config: QuoteConfig,
    financing: ReturnType<typeof _calculateFinancing>,
    instantDeviceRebateInCents: number,
) => {
    const { fees, devices = [], accessories = [], taxRate, lines } = config;

    const activationFeePerLine = 10;
    let linesForActivation = 0;
    if (fees?.activation) {
        const voiceLines = lines;
        const connectedDeviceLines = (devices || []).filter(d => d.servicePlanId).length;
        linesForActivation = voiceLines + connectedDeviceLines;
    }
    const activationFeeInCents = toCents(linesForActivation * activationFeePerLine);
    const totalOneTimeFeesInCents = activationFeeInCents;
    
    const paidInFullAccessories = (accessories || []).filter(acc => acc.paymentType === AccessoryPaymentType.FULL);
    const paidInFullAccessoriesCostInCents = paidInFullAccessories.reduce((s, a) => s + toCents((a.price || 0) * (a.quantity || 1)), 0);
    const financedAccessoriesFullCostInCents = (accessories || []).filter(a => a.paymentType === AccessoryPaymentType.FINANCED).reduce((s, a) => s + toCents((a.price || 0) * (a.quantity || 1)), 0);

    const totalDeviceCostInCents = devices.reduce((s, d) => s + toCents(d.price || 0), 0);
    // Use ALL trade-in values for tax calculation, but only manual ones for credit.
    const totalTradeInValueForTaxInCents = devices.reduce((s, d) => s + toCents(d.tradeIn || 0), 0);
    const lumpSumTradeInInCents = 0; // Lump sum trade-in is deprecated
    const optionalDownPaymentInCents = devices.reduce((s, d) => s + toCents(d.downPayment || 0), 0) + (accessories || []).filter(a => a.paymentType === AccessoryPaymentType.FINANCED).reduce((s, a) => s + toCents((a.downPayment || 0) * (a.quantity || 1)), 0);
    
    const taxableDeviceAmountInCents = Math.max(0, totalDeviceCostInCents - instantDeviceRebateInCents - totalTradeInValueForTaxInCents);
    const dueTodayDeviceTaxInCents = Math.round(taxableDeviceAmountInCents * ((taxRate || 0) / 100));
    const dueTodayFeesTaxInCents = Math.round(totalOneTimeFeesInCents * ((taxRate || 0) / 100));
    const paidInFullAccessoriesTaxInCents = Math.round(paidInFullAccessoriesCostInCents * ((taxRate || 0) / 100));
    const financedAccessoriesTaxInCents = Math.round(financedAccessoriesFullCostInCents * ((taxRate || 0) / 100));
    
    const dueTodayInCents = totalOneTimeFeesInCents + optionalDownPaymentInCents + financing.requiredDownPaymentInCents + paidInFullAccessoriesCostInCents - lumpSumTradeInInCents - instantDeviceRebateInCents + dueTodayDeviceTaxInCents + dueTodayFeesTaxInCents + paidInFullAccessoriesTaxInCents + financedAccessoriesTaxInCents;

    return {
        activationFeeInCents, totalOneTimeFeesInCents, paidInFullAccessories,
        paidInFullAccessoriesCostInCents, dueTodayDeviceTaxInCents,
        dueTodayFeesTaxInCents,
        paidInFullAccessoriesTaxInCents, financedAccessoriesTaxInCents,
        lumpSumTradeInInCents, optionalDownPaymentInCents,
        dueTodayInCents: Math.max(0, dueTodayInCents), totalDeviceCostInCents,
    };
};

export const calculateQuoteTotals = (
  config: QuoteConfig,
  allPlans: PlanPricingData,
  servicePlans: ServicePlan[],
  discountSettings: DiscountSettings,
  insurancePlans: InsurancePlan[],
  promotions: Promotion[],
  deviceDatabase: DeviceDatabase,
): CalculatedTotals | null => {
    const { plan: planId, lines, devices = [] } = config; // Removed insuranceTier, insuranceLines destructuring
    const planDetails = allPlans.find(p => p.id === planId);
    if (!planDetails) return null;

    const basePlanPriceInCents = _getBasePlanPriceInCents(planDetails, lines);
    
    // --- PROMOTION CALCULATIONS ---
    const activePromos = (promotions || []).filter(p => p.isActive);
    let appliedPromotions: AppliedPromotion[] = [];
    let promotionDiscountInCents = 0; // For plan-level discounts
    let monthlyDevicePromoCreditInCents = 0;
    let instantDeviceRebateInCents = 0;
    let monthlyServicePlanPromoCreditInCents = 0; // For BTS promos
    
    // 1. Plan/Account Promotions - Apply Stacking Logic
    // Group eligible promos by their StackingGroup
    const eligiblePlanPromos = activePromos
        .filter(p => (p.category === PromotionCategory.PLAN || p.category === PromotionCategory.ACCOUNT) && 
                     (p.conditions || []).every(c => checkCondition(config, c)));

    const planPromoGroups: Record<string, Promotion[]> = {};
    
    // Helper to calculate potential discount for comparison
    const calculatePotentialDiscount = (promo: Promotion): number => {
        let value = 0;
        (promo.effects || []).forEach(effect => {
            if (effect.type === PromotionEffectType.PLAN_DISCOUNT_PERCENTAGE) {
                value += Math.round(basePlanPriceInCents * (effect.value / 100));
            } else if (effect.type === PromotionEffectType.PLAN_DISCOUNT_FIXED) {
                value += toCents(effect.value);
            }
        });
        return value;
    };

    eligiblePlanPromos.forEach(p => {
        const group = p.stackingGroup || StackingGroup.OPEN; // Default to OPEN if undefined
        if (!planPromoGroups[group]) planPromoGroups[group] = [];
        planPromoGroups[group].push(p);
    });

    // Iterate groups and select promos
    Object.entries(planPromoGroups).forEach(([group, promosInGroup]) => {
        if (group === StackingGroup.OPEN) {
            // Apply all OPEN promos
            promosInGroup.forEach(promo => {
                const discount = calculatePotentialDiscount(promo);
                promotionDiscountInCents += discount;
                appliedPromotions.push({ ...promo, discountInCents: discount });
            });
        } else {
            // Exclusive Group: Pick the best one
            const bestPromo = promosInGroup.reduce((prev, current) => 
                calculatePotentialDiscount(current) > calculatePotentialDiscount(prev) ? current : prev
            );
            const discount = calculatePotentialDiscount(bestPromo);
            promotionDiscountInCents += discount;
            appliedPromotions.push({ ...bestPromo, discountInCents: discount });
        }
    });
    
    // 2. Pre-Calculate BOGO Counts
    // We need to know how many valid BOGO pairs exist for each BOGO promo type.
    const bogoCounts: Record<string, { totalEligible: number, promo: Promotion }> = {};
    
    // First pass: identify active BOGO promos and count total eligible devices in cart
    activePromos.filter(p => p.bogoConfig).forEach(promo => {
        const eligibleCount = (config.devices || []).reduce((count, dev) => {
            const devModel = deviceDatabase.devices.find(d => d.id === dev.modelId);
            if (!devModel) return count;
            
            // Check Tag/ID match
            const hasIdMatch = promo.eligibleDeviceIds && promo.eligibleDeviceIds.includes(dev.modelId!);
            const hasTagMatch = promo.eligibleDeviceTags && 
                                promo.eligibleDeviceTags.length > 0 && 
                                devModel.tags.some(tag => promo.eligibleDeviceTags!.includes(tag));
            const hasConstraints = (promo.eligibleDeviceIds?.length || 0) > 0 || (promo.eligibleDeviceTags?.length || 0) > 0;
            
            if (hasConstraints && !hasIdMatch && !hasTagMatch) return count;
            return count + 1;
        }, 0);
        
        bogoCounts[promo.id] = { totalEligible: eligibleCount, promo };
    });

    // Track how many times each BOGO promo has been applied to prevent over-application
    const bogoApplications: Record<string, number> = {};

    // 3. Apply Device and BTS promotions
    (config.devices || []).forEach(device => {
        if (device.tradeInType === 'promo' && device.appliedPromoId) {
            const promo = promotions.find(p => p.id === device.appliedPromoId);
            if (promo) {
                const generalConditionsMet = (promo.conditions || []).every(c => checkCondition(config, c));
                let deviceReqsMet = true;
                const req = promo.deviceRequirements;
                if (req) {
                    if (req.tradeIn === TradeInRequirement.REQUIRED && (!device.tradeIn || device.tradeIn <= 0)) deviceReqsMet = false;
                    if (req.tradeIn === TradeInRequirement.NOT_ALLOWED && device.tradeIn && device.tradeIn > 0) deviceReqsMet = false;
                }
                
                // BOGO Validation
                if (generalConditionsMet && deviceReqsMet && promo.bogoConfig) {
                    const bogoData = bogoCounts[promo.id];
                    const buyQty = promo.bogoConfig.buyQuantity;
                    // Max number of "Get" rewards allowed based on cart contents
                    const maxRewards = Math.floor((bogoData?.totalEligible || 0) / buyQty);
                    const currentApplications = bogoApplications[promo.id] || 0;

                    if (currentApplications >= maxRewards) {
                        deviceReqsMet = false; // Cap reached, this device doesn't get the credit
                    } else {
                        bogoApplications[promo.id] = currentApplications + 1;
                    }
                }
                
                if (generalConditionsMet && deviceReqsMet) {
                    (promo.effects || []).forEach(effect => {
                        const creditValue = effect.value;
                        if (effect.type === PromotionEffectType.DEVICE_CREDIT_FIXED) {
                            const credit = Math.min(toCents(device.price), toCents(creditValue));
                            monthlyDevicePromoCreditInCents += Math.round(credit / (effect.durationMonths || 24));
                        }
                        if (effect.type === PromotionEffectType.DEVICE_INSTANT_REBATE) {
                            instantDeviceRebateInCents += Math.min(toCents(device.price), toCents(creditValue));
                        }
                    });
                    appliedPromotions.push({ ...promo, discountInCents: 0 }); // discountInCents is for plan-level promos
                }
            }
        }
        
        // Handle BTS Promos (for now, apply the first one that matches)
        const deviceModel = deviceDatabase.devices.find(d => d.id === device.modelId);
        if (device.servicePlanId && deviceModel && deviceModel.category !== DeviceCategory.PHONE) {
             for (const promo of activePromos.filter(p => p.category === PromotionCategory.BTS)) {
                if ((promo.conditions || []).every(c => checkCondition(config, c))) {
                    (promo.effects || []).forEach(effect => {
                        if (effect.type === PromotionEffectType.SERVICE_PLAN_DISCOUNT_FIXED) {
                            monthlyServicePlanPromoCreditInCents += toCents(effect.value);
                        }
                    });
                    appliedPromotions.push({ ...promo, discountInCents: 0 });
                    break; // Apply only one BTS promo per device
                }
            }
        }
    });

    // --- STANDARD DISCOUNT & MONTHLY CALCULATIONS ---
    const { thirdLineFreeDiscountInCents, autopayDiscountInCents, insiderDiscountInCents } = _calculateStandardDiscounts(config, planDetails, discountSettings, basePlanPriceInCents);
    const totalDiscountsInCents = autopayDiscountInCents + insiderDiscountInCents + thirdLineFreeDiscountInCents + promotionDiscountInCents;
    const finalPlanPriceInCents = basePlanPriceInCents - totalDiscountsInCents;

    const financing = _calculateFinancing(config, instantDeviceRebateInCents);
    const { monthlyDevicePaymentInCents, financedAccessoriesMonthlyCostInCents, financedAccessories } = financing;

    // --- UPDATED INSURANCE CALCULATION (Per Device) ---
    // Instead of using global tier/lines, sum the cost of the selected insurance plan for each device.
    const insuranceCostInCents = (devices || []).reduce((sum, device) => {
        if (device.insuranceId) {
            const plan = insurancePlans.find(p => p.id === device.insuranceId);
            return sum + toCents(plan?.price || 0);
        }
        // Backward compatibility: If no insuranceId on device but global tier exists (rare case during migration)
        // logic omitted for clarity, assuming new UI enforces device selection.
        return sum;
    }, 0);

    const monthlyTradeInCreditInCents = toCents(
      devices
        .filter(d => d.tradeInType === 'manual' || !d.tradeInType) // Only include manual trade-ins for direct credit. !d.tradeInType for backward compatibility.
        .reduce((s, d) => s + (d.tradeIn || 0), 0) / 24
    );

    const monthlyServicePlanCostInCents = (devices || []).reduce((total, device) => {
        if (device.servicePlanId) {
            const plan = servicePlans.find(p => p.id === device.servicePlanId);
            return total + toCents(plan?.price || 0);
        }
        return total;
    }, 0);

    const totalMonthlyAddonsInCents = insuranceCostInCents + monthlyDevicePaymentInCents + financedAccessoriesMonthlyCostInCents + monthlyServicePlanCostInCents - monthlyTradeInCreditInCents - monthlyDevicePromoCreditInCents - monthlyServicePlanPromoCreditInCents;
    const taxableMonthlyAmountInCents = basePlanPriceInCents + insuranceCostInCents + monthlyServicePlanCostInCents;
    const calculatedTaxesInCents = planDetails.taxesIncluded ? 0 : Math.round(taxableMonthlyAmountInCents * ((config.taxRate || 0) / 100));
    const totalMonthlyInCents = finalPlanPriceInCents + totalMonthlyAddonsInCents + calculatedTaxesInCents;

    // --- DUE TODAY CALCULATIONS ---
    const dueTodayCosts = _calculateDueTodayCosts(config, financing, instantDeviceRebateInCents);

    return {
        // Monthly
        planName: planDetails.name, taxesIncluded: planDetails.taxesIncluded, basePlanPriceInCents, autopayDiscountInCents,
        insiderDiscountInCents, thirdLineFreeDiscountInCents, promotionDiscountInCents, totalDiscountsInCents,
        finalPlanPriceInCents, insuranceCostInCents, monthlyDevicePaymentInCents, financedAccessoriesMonthlyCostInCents,
        monthlyTradeInCreditInCents, monthlyDevicePromoCreditInCents, instantDeviceRebateInCents, monthlyServicePlanCostInCents, monthlyServicePlanPromoCreditInCents,
        totalMonthlyAddonsInCents, calculatedTaxesInCents,
        totalMonthlyInCents,
        // Due Today
        ...dueTodayCosts,
        requiredDownPaymentInCents: financing.requiredDownPaymentInCents,
        // Details & Financing
        financedAccessories,
        amountToFinanceBeforeLimitInCents: financing.amountToFinanceBeforeLimitInCents,
        financedByDevicesInCents: financing.financedByDevicesInCents, 
        financedByAccessoriesInCents: financing.financedByAccessoriesInCents, totalLinesForEC: financing.totalLinesForEC,
        availableFinancingLimitInCents: financing.availableFinancingLimitInCents, appliedPromotions,
    };
};
