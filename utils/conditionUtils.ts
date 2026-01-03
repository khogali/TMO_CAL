import { QuoteConfig, PromotionConditionOperator, Promotion, PromotionConditionField } from '../types';

// Helper for potentially nested properties
const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, k) => (o || {})[k], obj);

/**
 * A generic condition checker that can be used for both promotions and guidance.
 * It accepts a config object and a condition, and it can evaluate fields with dot notation.
 * @param {QuoteConfig} config The current quote configuration.
 * @param {object} condition The condition to check, containing a field, operator, and value.
 * @returns {boolean} Whether the condition is met.
 */
export const checkCondition = (config: QuoteConfig, condition: { field: string; operator: PromotionConditionOperator; value: any }): boolean => {
    let configValue: any;
    
    // Special cases that aren't direct properties of config but are derived
    if (condition.field === 'devices.length') {
        configValue = (config.devices || []).length;
    } else if (condition.field === 'accessories.length') {
        configValue = (config.accessories || []).length;
    } else {
        // Handle all other fields, including direct properties and other dot-notation paths
        configValue = getNestedValue(config, condition.field);
    }

    if (configValue === undefined) return false;
    
    const isNumericComparison = typeof configValue === 'number' || !isNaN(Number(condition.value));
    const conditionValue = isNumericComparison ? Number(condition.value) : condition.value;
    const numericConfigValue = isNumericComparison ? Number(configValue) : configValue;

    switch(condition.operator) {
        case PromotionConditionOperator.EQUALS:
            return numericConfigValue == conditionValue;
        case PromotionConditionOperator.NOT_EQUALS:
            return numericConfigValue != conditionValue;
        case PromotionConditionOperator.GREATER_THAN_OR_EQUAL:
            return isNumericComparison && numericConfigValue >= conditionValue;
        case PromotionConditionOperator.LESS_THAN_OR_EQUAL:
            return isNumericComparison && numericConfigValue <= conditionValue;
        case PromotionConditionOperator.INCLUDES:
            if (typeof condition.value === 'string' && !Array.isArray(condition.value)) {
                return condition.value.split(',').map((s: string) => s.trim()).includes(String(numericConfigValue));
            }
            return Array.isArray(conditionValue) && conditionValue.includes(numericConfigValue);
        default:
            return false;
    }
};

/**
 * Analyzes a promotion against the current config to determine if it is eligible,
 * locked (upsell opportunity), or hidden (irrelevant).
 */
export const analyzePromotion = (config: QuoteConfig, promo: Promotion): { status: 'eligible' | 'locked' | 'hidden'; reasons: string[] } => {
    if (!promo.isActive) return { status: 'hidden', reasons: [] };

    const reasons: string[] = [];
    let isHidden = false;

    for (const condition of (promo.conditions || [])) {
        const passed = checkCondition(config, condition);
        if (!passed) {
            // Mismatching customer type means the promo is likely irrelevant (e.g. 55+ promo for standard user)
            if (condition.field === PromotionConditionField.CUSTOMER_TYPE) {
                isHidden = true;
                break;
            }

            // Identify "Near Miss" conditions that are actionable
            let reason = '';
            switch (condition.field) {
                case PromotionConditionField.PLAN:
                    reason = 'Upgrade Plan to Unlock';
                    break;
                case PromotionConditionField.LINES:
                    if (condition.operator === PromotionConditionOperator.GREATER_THAN_OR_EQUAL) {
                        reason = `Add lines to unlock (Needs ${condition.value})`;
                    } else {
                        reason = 'Line requirement not met';
                    }
                    break;
                case PromotionConditionField.DEVICE_COUNT:
                     reason = `Device count requirement not met`;
                     break;
                default:
                    reason = 'Requirements not met';
            }
            reasons.push(reason);
        }
    }

    if (isHidden) return { status: 'hidden', reasons: [] };
    if (reasons.length > 0) return { status: 'locked', reasons };
    return { status: 'eligible', reasons: [] };
};
