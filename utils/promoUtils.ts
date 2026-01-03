import { QuoteConfig, Promotion, DeviceDatabase, ServicePlan, PromotionConditionField, PromotionConditionOperator, PromotionCategory, DeviceCategory } from '../types';

export const applyPromoToConfig = (
    currentConfig: QuoteConfig,
    promo: Promotion,
    deviceDatabase: DeviceDatabase,
    servicePlans: ServicePlan[]
): QuoteConfig => {
    const newConfig = { ...currentConfig };

    // 1. Handle Customer Type and Plan adjustments
    (promo.conditions || []).forEach(cond => {
        // Adjust Customer Type
        if (cond.field === PromotionConditionField.CUSTOMER_TYPE && cond.operator === PromotionConditionOperator.EQUALS) {
            newConfig.customerType = cond.value;
        }
        
        // Adjust Plan
        if (cond.field === PromotionConditionField.PLAN && cond.operator === PromotionConditionOperator.INCLUDES) {
            const eligiblePlans = String(cond.value).split(',').map(s => s.trim());
            // Only change if current plan is not eligible
            if (!eligiblePlans.includes(newConfig.plan)) {
                newConfig.plan = eligiblePlans[0] || newConfig.plan;
            }
        }
    });

    // 2. Handle Device Promos (Add placeholder if needed)
    if (promo.category === PromotionCategory.DEVICE) {
        // Determine if we should add a device. 
        // If the user triggered this, they likely want the device involved.
        
        // Identify a compatible device model ID based on tags or IDs
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

        // Create the new device object
        const newDevice = {
            id: crypto.randomUUID(),
            category: DeviceCategory.PHONE, // Default, updated below if model found
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

        // Add to config
        newConfig.devices = [...newConfig.devices, newDevice];
    }

    // 3. Handle BTS Promos (Add Service Plan placeholder)
    if (promo.category === PromotionCategory.BTS) {
         // Default to adding a watch if unspecified, or infer from service plans if we had better mapping
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
                  appliedPromoId: null, // BTS promos usually apply to the plan, not the device trade-in field directly in this model, but context depends
                  servicePlanId: servicePlans.find(sp => sp.deviceCategory === defaultCategory)?.id
              }
          ];
    }

    return newConfig;
};
