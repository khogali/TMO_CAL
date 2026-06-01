
import { QuoteConfig, PromotionConditionOperator, Promotion, PromotionConditionField, PromotionCondition, GuidanceCondition } from '../types';

// Helper for potentially nested properties
const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, k) => (o || {})[k], obj);

/**
 * Checks a single atomic condition.
 */
const checkSingleCondition = (config: QuoteConfig, condition: PromotionCondition | GuidanceCondition): boolean => {
    // Cast to PromotionCondition to check for logic/subConditions safely.
    // GuidanceCondition does not have these defined in type but if passed in as "any" it would be undefined.
    // In strict TS, we need to assert or check presence. Since GuidanceCondition doesn't have `logic` key, 
    // it will be undefined, which is falsy, so it's safe at runtime.
    const asPromo = condition as PromotionCondition;
    
    // If it's a group, recurse
    if (asPromo.logic && asPromo.subConditions) {
        if (asPromo.logic === 'AND') {
            return asPromo.subConditions.every(sub => checkSingleCondition(config, sub));
        } else { // OR
            return asPromo.subConditions.some(sub => checkSingleCondition(config, sub));
        }
    }

    // Leaf node check
    if (!condition.field || !condition.operator) return true; 

    let configValue: any;
    
    // Special cases
    if (condition.field === 'devices.length') {
        configValue = (config.devices || []).length;
    } else if (condition.field === 'accessories.length') {
        configValue = (config.accessories || []).length;
    } else if (condition.field === PromotionConditionField.HAS_INSURANCE) {
        configValue = (config.devices || []).some(d => !!d.insuranceId);
    } else {
        configValue = getNestedValue(config, condition.field as string);
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
}

/**
 * Public wrapper that handles the condition structure.
 */
export const checkCondition = (config: QuoteConfig, condition: PromotionCondition | GuidanceCondition): boolean => {
    return checkSingleCondition(config, condition);
};

/**
 * Analyzes a promotion to determine status:
 * - 'eligible': All conditions passed.
 * - 'near_miss': Only 1 condition failed (calculates distance).
 * - 'locked': Multiple conditions failed.
 * - 'hidden': Customer type mismatch or explicitly invalid.
 */
export const analyzePromotion = (config: QuoteConfig, promo: Promotion): { status: 'eligible' | 'near_miss' | 'locked' | 'hidden'; reasons: string[]; fixAction?: string } => {
    if (!promo.isActive) return { status: 'hidden', reasons: [] };

    const failedConditions: PromotionCondition[] = [];
    const reasons: string[] = [];

    // Flatten conditions for analysis if they are simple ANDs at top level
    // For complex groups, we treat the group failure as one failure
    for (const condition of (promo.conditions || [])) {
        const passed = checkSingleCondition(config, condition);
        if (!passed) {
            failedConditions.push(condition);
            
            // Critical mismatch -> Hidden
            if (condition.field === PromotionConditionField.CUSTOMER_TYPE) {
                return { status: 'hidden', reasons: ['Customer type mismatch'] };
            }
        }
    }

    if (failedConditions.length === 0) return { status: 'eligible', reasons: [] };

    // Generate Reasons & Fixes
    let fixAction = '';
    
    failedConditions.forEach(c => {
        if (c.logic) {
            reasons.push('Complex requirement not met (Group)');
        } else {
            switch (c.field) {
                case PromotionConditionField.PLAN:
                    reasons.push(`Requires specific plan`);
                    fixAction = `Switch to eligible plan`;
                    break;
                case PromotionConditionField.LINES:
                    reasons.push(`Needs ${c.value} lines`);
                    fixAction = `Add lines`;
                    break;
                case PromotionConditionField.HAS_INSURANCE:
                    reasons.push('Requires Device Protection');
                    fixAction = 'Add Protection <360>';
                    break;
                default:
                    reasons.push('Requirement not met');
            }
        }
    });

    if (failedConditions.length === 1) {
        return { status: 'near_miss', reasons, fixAction };
    }

    return { status: 'locked', reasons };
};
