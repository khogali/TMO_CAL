// FIX: Removed circular dependency where the file was importing a type from itself.

export enum CustomerType {
  STANDARD = 'standard',
  MILITARY_FR = 'military-fr',
  PLUS_55 = 'plus-55',
}

export enum TradeInType {
  LUMP_SUM = 'lump_sum',
  MONTHLY_CREDIT = 'monthly_credit',
}

export enum AccessoryPaymentType {
  FULL = 'full',
  FINANCED = 'financed',
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  paymentType: AccessoryPaymentType;
  quantity: number;
}

export interface InsurancePlan {
  id: string;
  name: string;
  price: number;
}

export interface QuoteFees {
  activation: boolean;
  upgrade: boolean;
}

export interface QuoteDiscounts {
  autopay: boolean;
  insider: boolean;
  thirdLineFree: boolean;
}

export interface Device {
  price: number;
  tradeIn: number;
  tradeInType: TradeInType;
}

export interface QuoteConfig {
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  plan: string; // Changed from Plan enum to string
  lines: number;
  insuranceTier: string; // Was InsuranceTier enum, now string (plan id or 'none')
  insuranceLines: number;
  devices: Device[];
  accessories: Accessory[];
  discounts: QuoteDiscounts;
  fees: QuoteFees;
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