
import { QuoteConfig, Promotion, DeviceDatabase, PromotionCategory, PromotionEffectType, TradeInRequirement, Device, StackingGroup, PlanPricingData, ServicePlan, DiscountSettings, InsurancePlan } from '../types';
import { checkCondition } from './conditionUtils';
import { calculateQuoteTotals } from './calculations';

export const optimizeQuote = (
    config: QuoteConfig,
    promotions: Promotion[],
    deviceDatabase: DeviceDatabase
): { config: QuoteConfig; changesMade: number } => {
    let changesMade = 0;
    const optimizedConfig = { ...config, devices: [...config.devices] };

    // --- 1. Identify Valid BOGO Sets ---
    // Group devices by which BOGO promos they qualify for.
    const bogoPromos = promotions.filter(p => p.isActive && p.category === PromotionCategory.DEVICE && p.bogoConfig);
    const deviceIdsUsedForBogo = new Set<string>();

    bogoPromos.forEach(promo => {
        // Find all devices eligible for this specific BOGO promo
        const eligibleDevices = optimizedConfig.devices.filter(device => {
            if (deviceIdsUsedForBogo.has(device.id)) return false; // Already used
            const deviceModel = deviceDatabase.devices.find(d => d.id === device.modelId);
            if (!deviceModel) return false;

            const hasIdMatch = promo.eligibleDeviceIds && promo.eligibleDeviceIds.includes(device.modelId!);
            const hasTagMatch = promo.eligibleDeviceTags && 
                                promo.eligibleDeviceTags.length > 0 && 
                                deviceModel.tags.some(tag => promo.eligibleDeviceTags!.includes(tag));
            const hasConstraints = (promo.eligibleDeviceIds?.length || 0) > 0 || (promo.eligibleDeviceTags?.length || 0) > 0;
            if (hasConstraints && !hasIdMatch && !hasTagMatch) return false;
            
            // Check general conditions
            if (!(promo.conditions || []).every(c => checkCondition(config, c))) return false;

            return true;
        });

        // Determine how many full sets we have
        const buyQty = promo.bogoConfig!.buyQuantity;
        const setsCount = Math.floor(eligibleDevices.length / buyQty);

        if (setsCount > 0) {
            // Sort by price ascending (cheapest first) to apply discount to them
            // In a "Buy 2 Get 1 Free/Discounted", usually the cheapest is free.
            eligibleDevices.sort((a, b) => a.price - b.price);

            for (let i = 0; i < setsCount; i++) {
                // The "Get" device is the cheapest in this pair
                const getDevice = eligibleDevices[i]; 
                
                // Let's check value
                let promoValue = 0;
                promo.effects.forEach(effect => {
                    if (effect.type === PromotionEffectType.DEVICE_CREDIT_FIXED) promoValue += effect.value;
                    else if (effect.type === PromotionEffectType.DEVICE_INSTANT_REBATE) promoValue += effect.value;
                });

                if (promoValue > (getDevice.tradeIn || 0)) {
                    // Apply to the 'Get' device
                    const deviceIndex = optimizedConfig.devices.findIndex(d => d.id === getDevice.id);
                    if (deviceIndex !== -1) {
                        // Check if actually changing
                        if (optimizedConfig.devices[deviceIndex].appliedPromoId !== promo.id) {
                            optimizedConfig.devices[deviceIndex] = {
                                ...optimizedConfig.devices[deviceIndex],
                                tradeInType: 'promo',
                                appliedPromoId: promo.id
                            };
                            changesMade++;
                        }
                        deviceIdsUsedForBogo.add(eligibleDevices[i].id); // Cheapest
                        // Mark the other required devices as used
                        for(let k=1; k<buyQty; k++) {
                             const companionIndex = eligibleDevices.length - 1 - i - (k-1); // Take from end
                             if (companionIndex > i) {
                                 deviceIdsUsedForBogo.add(eligibleDevices[companionIndex].id);
                             }
                        }
                    }
                }
            }
        }
    });

    // --- 2. Optimize Remaining Individual Devices ---
    optimizedConfig.devices = optimizedConfig.devices.map(device => {
        // Skip if already handled by BOGO logic
        if (deviceIdsUsedForBogo.has(device.id)) return device;

        const deviceModel = deviceDatabase.devices.find(d => d.id === device.modelId);
        if (!deviceModel) return device;

        // Filter for Device Promos (Non-BOGO or individual)
        const eligiblePromos = promotions.filter(promo => {
            if (!promo.isActive || promo.category !== PromotionCategory.DEVICE || promo.bogoConfig) return false;

            const hasIdMatch = promo.eligibleDeviceIds && promo.eligibleDeviceIds.includes(device.modelId!);
            const hasTagMatch = promo.eligibleDeviceTags && 
                                promo.eligibleDeviceTags.length > 0 && 
                                deviceModel.tags.some(tag => promo.eligibleDeviceTags!.includes(tag));
            
            const hasConstraints = (promo.eligibleDeviceIds?.length || 0) > 0 || (promo.eligibleDeviceTags?.length || 0) > 0;
            if (hasConstraints && !hasIdMatch && !hasTagMatch) return false;

            if (!(promo.conditions || []).every(c => checkCondition(config, c))) return false;

            if (promo.deviceRequirements) {
                if (promo.deviceRequirements.tradeIn === TradeInRequirement.REQUIRED) {
                    if (!device.tradeIn || device.tradeIn <= 0) return false;
                }
                if (promo.deviceRequirements.tradeIn === TradeInRequirement.NOT_ALLOWED) {
                    if (device.tradeIn && device.tradeIn > 0) return false;
                }
            }

            return true;
        });

        // Calculate Value for each promo
        const valuedPromos = eligiblePromos.map(promo => {
            let totalValue = 0;
            promo.effects.forEach(effect => {
                if (effect.type === PromotionEffectType.DEVICE_CREDIT_FIXED) {
                    totalValue += effect.value;
                } else if (effect.type === PromotionEffectType.DEVICE_INSTANT_REBATE) {
                    totalValue += effect.value;
                }
            });
            return { promo, totalValue };
        });

        valuedPromos.sort((a, b) => b.totalValue - a.totalValue);

        const bestPromo = valuedPromos[0];
        const manualTradeValue = device.tradeIn || 0;

        if (bestPromo && bestPromo.totalValue > manualTradeValue) {
            if (device.tradeInType !== 'promo' || device.appliedPromoId !== bestPromo.promo.id) {
                changesMade++;
                return {
                    ...device,
                    tradeInType: 'promo',
                    appliedPromoId: bestPromo.promo.id
                };
            }
        } 
        
        return device;
    });

    return { config: optimizedConfig, changesMade };
};

// --- NEW: Best Stack Solver ---
export const solveBestStack = (
    config: QuoteConfig,
    promotions: Promotion[],
    planPricing: PlanPricingData,
    servicePlans: ServicePlan[],
    discountSettings: DiscountSettings,
    insurancePlans: InsurancePlan[],
    deviceDatabase: DeviceDatabase
): { config: QuoteConfig; savingsInCents: number; promosApplied: string[] } => {
    
    // 1. Calculate Baseline (Current Config)
    const baselineTotals = calculateQuoteTotals(config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase);
    const baselineCost = baselineTotals ? baselineTotals.totalMonthlyInCents : Infinity;

    // 2. Optimize Devices First (Greedy approach for device promos is usually safe)
    const { config: deviceOptimizedConfig } = optimizeQuote(config, promotions, deviceDatabase);
    
    // 3. Test Plan Switching
    // Check if switching to a premium plan unlocks better device/plan promos that offset the plan cost increase
    const potentialPlans = planPricing.filter(p => p.availableFor.includes(config.customerType) && p.id !== config.plan);
    
    let bestConfig = deviceOptimizedConfig;
    let bestCost = baselineCost;
    
    // Calculate cost for device-optimized config on current plan first
    const devOptTotals = calculateQuoteTotals(deviceOptimizedConfig, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase);
    if (devOptTotals && devOptTotals.totalMonthlyInCents < bestCost) {
        bestCost = devOptTotals.totalMonthlyInCents;
        bestConfig = deviceOptimizedConfig;
    }

    // Try other plans
    for (const plan of potentialPlans) {
        // Create temp config with new plan
        let tempConfig = { ...deviceOptimizedConfig, plan: plan.id };
        
        // Re-optimize devices for this new plan (promos might unlock)
        const { config: reOptimizedConfig } = optimizeQuote(tempConfig, promotions, deviceDatabase);
        
        const totals = calculateQuoteTotals(reOptimizedConfig, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase);
        
        if (totals && totals.totalMonthlyInCents < bestCost) {
            bestCost = totals.totalMonthlyInCents;
            bestConfig = reOptimizedConfig;
        }
    }

    const savings = Math.max(0, baselineCost - bestCost);
    const appliedIds = bestConfig.devices
        .map(d => d.appliedPromoId)
        .filter((id): id is string => !!id);

    return { 
        config: bestConfig, 
        savingsInCents: savings, 
        promosApplied: Array.from(new Set(appliedIds)) 
    };
};
