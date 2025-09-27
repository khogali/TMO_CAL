// FIX: Removed circular dependency where the file was importing types from itself.

export enum CustomerType {
  STANDARD = 'standard',
  MILITARY_FR = 'military-fr',
  PLUS_55 = 'plus-55',
}

export enum InsuranceTier {
  NONE = 'none',
  BASIC = 'basic',
  P360 = 'p360',
}

export interface QuoteDiscounts {
  autopay: boolean;
  insider: boolean;
  thirdLineFree: boolean;
}

export interface Device {
  price: number;
  tradeIn: number;
}

export interface QuoteConfig {
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  plan: string; // Changed from Plan enum to string
  lines: number;
  insuranceTier: InsuranceTier;
  devices: Device[];
  discounts: QuoteDiscounts;
  taxRate: number;
}

export interface SavedLead extends QuoteConfig {
  id: string;
  createdAt: string;
}

export interface PlanDetails {
  name: string;
  price: number[];
  maxLines: number;
  availableFor: CustomerType[];
  taxesIncluded: boolean;
}

export type PlanPricingData = Record<string, PlanDetails>; // Changed from Record<Plan, ...>

export interface DiscountSettings {
  autopay: number;
  insider: number;
}

export interface InsuranceDetails {
    name: string;
    price: number;
}

export type InsurancePricingData = Record<InsuranceTier, InsuranceDetails>;