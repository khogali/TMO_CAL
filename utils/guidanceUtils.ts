import { QuoteConfig, GuidanceCondition } from '../types';
import { checkCondition } from './conditionUtils';

/**
 * Checks if a guidance item's condition is met based on the current quote config.
 * This now acts as a wrapper around the centralized condition checking utility.
 * @param {QuoteConfig} config The current quote configuration.
 * @param {GuidanceCondition} condition The guidance condition to check.
 * @returns {boolean} Whether the condition is met.
 */
export const checkGuidanceCondition = (config: QuoteConfig, condition: GuidanceCondition): boolean => {
    return checkCondition(config, condition);
};
