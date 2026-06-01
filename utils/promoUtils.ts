
import { QuoteConfig, Promotion, DeviceDatabase, ServicePlan, PromotionConditionField, PromotionConditionOperator, PromotionCategory, DeviceCategory, BundleConfig, AccessoryPaymentType, StackingGroup } from '../types';

export const applyPromoToConfig = (
    currentConfig: QuoteConfig,
    promo: Promotion,
    deviceDatabase: DeviceDatabase,
    servicePlans: ServicePlan[]
): QuoteConfig => {
    const newConfig = { ...currentConfig };

    // 1. Handle Conditions (Auto-fix plan/type)
    // Only applies to simple top-level conditions for auto-fix
    (promo.conditions || []).forEach(cond => {
        if (!cond.logic) {
            if (cond.field === PromotionConditionField.CUSTOMER_TYPE && cond.operator === PromotionConditionOperator.EQUALS) {
                newConfig.customerType = cond.value;
            }
            if (cond.field === PromotionConditionField.PLAN && cond.operator === PromotionConditionOperator.INCLUDES) {
                const eligiblePlans = String(cond.value).split(',').map(s => s.trim());
                if (!eligiblePlans.includes(newConfig.plan)) {
                    newConfig.plan = eligiblePlans[0] || newConfig.plan;
                }
            }
        }
    });

    // 2. Handle Device Promos (Add placeholder if needed)
    if (promo.category === PromotionCategory.DEVICE) {
        let compatibleModelId: string | undefined;
        if (promo.eligibleDeviceTags && promo.eligibleDeviceTags.length > 0) {
            const matchingModel = deviceDatabase.devices.find(d => 
                d.tags.some(t => promo.eligibleDeviceTags?.includes(t))
            );
            if (matchingModel) compatibleModelId = matchingModel.id;
        }
        if (!compatibleModelId && promo.eligibleDeviceIds && promo.eligibleDeviceIds.length > 0) {
            compatibleModelId = promo.eligibleDeviceIds[0];
        }

        const newDevice = {
            id: crypto.randomUUID(),
            category: DeviceCategory.PHONE,
            modelId: '',
            variantSku: '', 
            price: 0, 
            term: 24,
            downPayment: 0,
            tradeIn: 0,
            tradeInType: 'promo' as const,
            appliedPromoId: promo.id
        };

        if (compatibleModelId) {
            const model = deviceDatabase.devices.find(d => d.id === compatibleModelId);
            if (model) {
                newDevice.category = model.category;
                newDevice.modelId = compatibleModelId;
                newDevice.term = model.defaultTermMonths;
            }
        }
        newConfig.devices = [...newConfig.devices, newDevice];
    }

    // 3. Handle BTS Promos
    if (promo.category === PromotionCategory.BTS) {
         const defaultCategory = DeviceCategory.WATCH; 
         newConfig.devices = [
              ...newConfig.devices,
              {
                  id: crypto.randomUUID(),
                  category: defaultCategory,
                  modelId: '', 
                  variantSku: '',
                  price: 0,
                  term: 24,
                  downPayment: 0,
                  tradeIn: 0,
                  tradeInType: 'manual',
                  appliedPromoId: null,
                  servicePlanId: servicePlans.find(sp => sp.deviceCategory === defaultCategory)?.id
              }
          ];
    }

    // 4. Handle Bundles (Add Missing Items)
    if (promo.bundleConfig) {
        promo.bundleConfig.items.forEach(item => {
            if (item.category === 'accessory') {
                const existingCount = newConfig.accessories.filter(a => a.name.toLowerCase().includes(item.idPattern)).length;
                if (existingCount < item.quantity) {
                    newConfig.accessories.push({
                        id: crypto.randomUUID(),
                        name: item.idPattern === 'screen' ? 'Screen Protector' : 'Protective Case',
                        price: item.idPattern === 'screen' ? 40 : 50,
                        paymentType: AccessoryPaymentType.FINANCED,
                        quantity: item.quantity - existingCount,
                        term: 12,
                        downPayment: 0
                    });
                }
            }
            if (item.category === 'insurance') {
                // Ensure all devices have insurance
                newConfig.devices = newConfig.devices.map(d => {
                    if (!d.insuranceId) return { ...d, insuranceId: 'p360' }; // Default to P360
                    return d;
                });
            }
        });
    }

    return newConfig;
};

// Check for Conflict Matrix
export const checkPromoConflicts = (activePromos: Promotion[]): { conflict: boolean; reasons: string[] } => {
    const reasons: string[] = [];
    let conflict = false;

    // 1. Explicit Exclusions
    activePromos.forEach(p1 => {
        if (p1.excludedPromoIds) {
            activePromos.forEach(p2 => {
                if (p1.id !== p2.id && p1.excludedPromoIds?.includes(p2.id)) {
                    conflict = true;
                    reasons.push(`${p1.name} excludes ${p2.name}`);
                }
            });
        }
    });

    // 2. Stacking Group Violations
    const groups: Record<string, number> = {};
    activePromos.forEach(p => {
        if (p.stackingGroup !== StackingGroup.OPEN) {
            groups[p.stackingGroup] = (groups[p.stackingGroup] || 0) + 1;
        }
    });

    Object.entries(groups).forEach(([group, count]) => {
        if (count > 1) {
            conflict = true;
            reasons.push(`Multiple promotions in exclusive group: ${group}`);
        }
    });

    return { conflict, reasons };
};
