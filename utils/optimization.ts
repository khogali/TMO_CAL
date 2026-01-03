import { QuoteConfig, Promotion, DeviceDatabase, PromotionCategory, PromotionEffectType, TradeInRequirement, Device, StackingGroup } from '../types';
import { checkCondition } from './conditionUtils';

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

            // Calculate Value of BOGO vs Manual Trade-in for the "Get" devices
            // For each set, the first N devices (where N = discount target count, usually 1) get the promo.
            // Actually, usually in a set of 2, 1 gets it.
            // If buyQty is 2, and we have 2 devices. Cheapest one gets it.
            
            for (let i = 0; i < setsCount; i++) {
                // The "Get" device is the cheapest in this pair
                const getDevice = eligibleDevices[i]; 
                // The "Buy" device(s) are the others in the chunk
                // We mark ALL as "used" so they aren't picked up by other BOGOs, 
                // but we only apply the promo ID to the one getting the credit.
                // Wait, typically you apply the promo code to the line receiving the credit.
                
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
                        // Mark the 'Buy' companion as "used" too so it doesn't trigger another pair
                        // The 'Buy' companion is the next one in the sorted list (more expensive)
                        // Actually, we just need to consume 'buyQty' devices from the pool.
                        // Since we sorted by price, [0] is cheapest, [1] is next... 
                        // The indices involved in this set are i*buyQty to (i+1)*buyQty - 1 ??
                        // No, eligibleDevices is a flat list.
                        // If buyQty=2. Set 1 is devices[0] and devices[1]. Device[0] gets credit.
                        deviceIdsUsedForBogo.add(eligibleDevices[i].id); // Cheapest
                        // Mark the other required devices as used
                        for(let k=1; k<buyQty; k++) {
                             // The expensive ones are at the end of the array?
                             // Sort was ascending: [Cheapest, ..., Most Expensive]
                             // If we have 4 devices. [Cheap1, Cheap2, Exp1, Exp2].
                             // Pair 1: Cheap1 gets credit. Exp2 pays.
                             // Pair 2: Cheap2 gets credit. Exp1 pays.
                             // So we should pair from ends? Or just consume?
                             // Simple consumption: Just mark them used.
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
