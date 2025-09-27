import { InsuranceTier, CustomerType, PlanPricingData, InsurancePricingData } from './types';

export const PLAN_PRICING: PlanPricingData = {
  'go5g': {
    name: 'Go5G',
    price: [75, 130, 155, 180, 205, 230, 255, 280],
    maxLines: 8,
    availableFor: [CustomerType.STANDARD, CustomerType.MILITARY_FR, CustomerType.PLUS_55],
    taxesIncluded: false,
  },
  'go5g-plus': {
    name: 'Go5G Plus',
    price: [90, 150, 170, 190, 220, 250, 280, 310],
    maxLines: 8,
    availableFor: [CustomerType.STANDARD, CustomerType.MILITARY_FR, CustomerType.PLUS_55],
    taxesIncluded: false,
  },
  'go5g-next': {
    name: 'Go5G Next',
    price: [100, 170, 190, 210, 240, 270, 300, 330],
    maxLines: 8,
    availableFor: [CustomerType.STANDARD, CustomerType.MILITARY_FR, CustomerType.PLUS_55],
    taxesIncluded: true,
  },
};

export const INSURANCE_PRICING: InsurancePricingData = {
    [InsuranceTier.NONE]: {
        name: 'None',
        price: 0,
    },
    [InsuranceTier.BASIC]: {
        name: 'Basic Device Protection',
        price: 12,
    },
    [InsuranceTier.P360]: {
        name: 'Protection <360>',
        price: 18,
    },
};
