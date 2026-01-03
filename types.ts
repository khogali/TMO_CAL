import { User } from 'firebase/auth';

// types.ts

export enum ActivityLogType {
  CREATED = 'Created',
  STATUS_CHANGE = 'Status Change',
  NOTES_UPDATED = 'Notes Updated',
  FOLLOW_UP_SET = 'Follow-up Set',
  QUOTE_VERSIONED = 'New Quote Version',
  TAGS_UPDATED = 'Tags Updated',
  REASSIGNED = 'Reassigned',
}

export interface ActivityLogEntry {
  id: string;
  type: ActivityLogType;
  timestamp: number;
  from?: string;
  to?: string;
  notes?: string;
  by?: string; // UID of user who made the change
}

export enum UserRole {
  REP = 'Rep',
  STORE_MANAGER = 'Store Manager',
  DISTRICT_MANAGER = 'District Manager',
  ADMIN = 'Admin',
}

export interface Store {
    id: string;
    name: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    phoneNumber: string;
    storeId: string | null;
    role: UserRole;
    managedStoreIds?: string[]; // For District Managers
}

export enum CustomerType {
  STANDARD = 'Standard',
  MILITARY_FR = 'Military/FR',
  PLUS_55 = '55+',
}

export enum PricingModel {
  TIERED = 'Tiered',
  PER_LINE = 'Per-Line',
}

export interface PlanDetails {
  id: string;
  name: string;
  pricingModel: PricingModel;
  tieredPrices?: number[];
  firstLinePrice?: number;
  additionalLinePrice?: number;
  maxLines: number;
  availableFor: CustomerType[];
  taxesIncluded: boolean;
  features?: string[];
  allowedDiscounts?: {
    insider: boolean;
    thirdLineFree: boolean;
  };
}

export type PlanPricingData = PlanDetails[];

// --- DEVICE DATABASE ---
export enum DeviceCategory {
    PHONE = 'Phone',
    WATCH = 'Watch',
    TABLET = 'Tablet',
    TRACKER = 'Tracker',
}

export interface InsurancePlan {
  id: string;
  name: string;
  price: number;
  supportedCategories?: DeviceCategory[]; // NEW: Filter by device type
}

// NEW: Service Plans for non-phone devices (replaces BTS Plans)
export interface ServicePlan {
  id: string;
  name: string;
  price: number;
  deviceCategory: DeviceCategory; // e.g., WATCH, TABLET
  features: string[];
  isPopular?: boolean;
}

export interface DiscountSettings {
  autopay: number;
  insider: number;
  thirdLineFree: number;
}

export interface Device {
  id: string; // Add a unique ID for each device instance in a quote
  category: DeviceCategory; // UI helper to know which dropdowns to filter
  modelId?: string;
  variantSku?: string;
  price: number;
  tradeIn: number;
  tradeInType: 'manual' | 'promo';
  appliedPromoId: string | null;
  term: number;
  downPayment: number;
  servicePlanId?: string; // For non-phone devices
  promoCredit?: number; // For non-phone device promotions
  activationFee?: boolean; // For non-phone device activations
  insuranceId?: string; // NEW: Specific insurance plan for this device
  isByod?: boolean; // NEW: Bring Your Own Device flag
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
  term: number;
  downPayment: number;
}

export interface QuoteFees {
    activation: boolean;
}

export interface QuoteConfig {
  // A potential lead ID if this config is from a saved lead
  id?: string; 
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  plan: string;
  lines: number;
  insuranceTier: string; // DEPRECATED: Kept for backward compat, but logic moving to device level
  insuranceLines: number; // DEPRECATED
  devices: Device[];
  accessories: Accessory[];
  discounts: {
    autopay: boolean;
    insider: boolean;
    thirdLineFree: boolean;
  };
  fees: QuoteFees;
  taxRate: number;
  maxEC: number;
  perLineEC: number;
  notes?: string;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  quoteConfig: QuoteConfig;
}

// From constants.ts
export enum PromotionConditionField {
    CUSTOMER_TYPE = 'customerType',
    PLAN = 'plan',
    LINES = 'lines',
    DEVICE_COUNT = 'deviceCount',
}

export enum PromotionConditionOperator {
    EQUALS = 'equals',
    NOT_EQUALS = 'not_equals',
    GREATER_THAN_OR_EQUAL = 'gte',
    LESS_THAN_OR_EQUAL = 'lte',
    INCLUDES = 'includes'
}

export enum PromotionCategory {
    PLAN = 'Plan',
    DEVICE = 'Device',
    BTS = 'BTS',
    ACCESSORY = 'Accessory',
    ACCOUNT = 'Account',
}

export enum PromotionEffectType {
    PLAN_DISCOUNT_FIXED = 'plan_discount_fixed',
    PLAN_DISCOUNT_PERCENTAGE = 'plan_discount_percentage',
    DEVICE_CREDIT_FIXED = 'device_credit_fixed',
    DEVICE_INSTANT_REBATE = 'device_instant_reabte',
    SERVICE_PLAN_DISCOUNT_FIXED = 'service_plan_discount_fixed',
    FREE_DEVICE = 'free_device',
    FREE_LINE = 'free_line',
    ACCESSORY_DISCOUNT_FIXED = 'accessory_discount_fixed',
}

export interface PromotionCondition {
    id: string;
    field: PromotionConditionField;
    operator: PromotionConditionOperator;
    value: any;
}

export interface PromotionEffect {
    id:string;
    type: PromotionEffectType;
    value: number;
    durationMonths?: number;
    appliesToQuantity?: number;
}

export enum TradeInRequirement {
    REQUIRED = 'Required',
    NOT_ALLOWED = 'Not Allowed',
    OPTIONAL = 'Optional',
}

export interface DevicePromoRequirements {
    tradeIn: TradeInRequirement;
    portInRequired: boolean;
    newLineRequired: boolean;
}

// NEW: Stacking Logic Architecture
export enum StackingGroup {
    PLAN_DISCOUNT = 'Plan Discount', // Mutually exclusive (Best one wins)
    DEVICE_OFFER = 'Device Offer',   // Mutually exclusive per device
    BTS_OFFER = 'BTS Offer',         // Mutually exclusive per line
    OPEN = 'Open'                    // Stacks with everything
}

// NEW: BOGO Configuration
export interface BogoConfig {
    buyQuantity: number; // e.g. 2 for "Buy 2..."
    discountTarget: 'lowest_price' | 'fixed'; // Usually lowest price gets credit
}

export interface Promotion {
    id: string;
    name: string;
    description: string;
    category: PromotionCategory;
    isActive: boolean;
    spotlightOnHome?: boolean;
    stackingGroup: StackingGroup; 
    bogoConfig?: BogoConfig; // NEW: BOGO Logic
    conditions: PromotionCondition[];
    deviceRequirements?: DevicePromoRequirements;
    eligibleDeviceIds?: string[];
    eligibleDeviceTags?: string[];
    effects: PromotionEffect[];
}

export enum GuidancePlacement {
  HOME_PAGE = 'Home Page',
  BEFORE_CUSTOMER_INFO = 'Above Customer Info',
  BEFORE_PLAN_DETAILS = 'Above Plan Details',
  BEFORE_INSURANCE = 'Above Insurance',
  BEFORE_DEVICES = 'Above Devices',
  BEFORE_ACCESSORIES = 'Above Accessories',
  BEFORE_SNAPSHOT = 'Above Snapshot',
}

export enum GuidanceConditionField {
  CUSTOMER_TYPE = 'customerType',
  PLAN = 'plan',
  LINES = 'lines',
  DEVICE_COUNT = 'devices.length',
  ACCESSORY_COUNT = 'accessories.length',
  AUTOPAY = 'discounts.autopay',
  INSURANCE_TIER = 'insuranceTier',
  INSURANCE_LINES = 'insuranceLines',
}

export interface GuidanceCondition {
  id: string;
  field: GuidanceConditionField;
  operator: PromotionConditionOperator; // Re-using the same operators
  value: any;
}

export enum GuidanceStyle {
    INFO = 'Info', // Blue
    SUCCESS = 'Success', // Green
    WARNING = 'Warning', // Yellow
    PROMO = 'Promo', // Magenta/Primary
}

export interface GuidanceItem {
  id: string;
  title: string;
  message: string;
  placement: GuidancePlacement;
  style: GuidanceStyle;
  isActive: boolean;
  conditions: GuidanceCondition[];
}

export interface DeviceVariant {
    sku: string;
    storage: number;
    color: string;
    price: number;
}

export interface DeviceModel {
    id: string;
    name: string;
    manufacturer: string;
    category: DeviceCategory; // NEW
    variants: DeviceVariant[];
    defaultTermMonths: number;
    tags: string[];
    whatsInTheBox?: string[];
}

export interface DeviceDatabase {
    devices: DeviceModel[];
}


// From calculations.ts
export interface AppliedPromotion extends Promotion {
    discountInCents: number;
    monthlyCreditInCents?: number;
}

export interface CalculatedTotals {
    planName: string;
    taxesIncluded: boolean;
    basePlanPriceInCents: number;
    autopayDiscountInCents: number;
    insiderDiscountInCents: number;
    thirdLineFreeDiscountInCents: number;
    promotionDiscountInCents: number;
    totalDiscountsInCents: number;
    finalPlanPriceInCents: number;
    insuranceCostInCents: number;
    monthlyDevicePaymentInCents: number; // Now includes all devices
    monthlyServicePlanCostInCents: number; // NEW: For watch/tablet plans
    monthlyServicePlanPromoCreditInCents: number; // NEW
    financedAccessoriesMonthlyCostInCents: number;
    monthlyTradeInCreditInCents: number;
    monthlyDevicePromoCreditInCents: number; // Now includes all devices
    instantDeviceRebateInCents: number; // Now includes all devices
    totalMonthlyAddonsInCents: number;
    calculatedTaxesInCents: number;
    totalMonthlyInCents: number;
    activationFeeInCents: number;
    totalOneTimeFeesInCents: number;
    paidInFullAccessoriesCostInCents: number;
    dueTodayDeviceTaxInCents: number; // Now includes all devices
    dueTodayFeesTaxInCents: number;
    paidInFullAccessoriesTaxInCents: number;
    financedAccessoriesTaxInCents: number;
    lumpSumTradeInInCents: number;
    optionalDownPaymentInCents: number;
    requiredDownPaymentInCents: number;
    dueTodayInCents: number;
    financedAccessories: (Accessory & { monthlyPaymentInCents: number })[];
    paidInFullAccessories: Accessory[];
    totalDeviceCostInCents: number;
    amountToFinanceBeforeLimitInCents: number;
    financedByDevicesInCents: number;
    financedByAccessoriesInCents: number;
    totalLinesForEC: number;
    availableFinancingLimitInCents: number;
    appliedPromotions: AppliedPromotion[];
}


// For saved leads
export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  FOLLOW_UP = 'Follow-up',
  CLOSED_WON = 'Closed - Won',
  CLOSED_LOST = 'Closed - Lost',
}

export interface QuoteVersion {
  // The full QuoteConfig object at a point in time. Note that 'notes' are now at the lead level.
  quoteConfig: Omit<QuoteConfig, 'notes'>;
  versionCreatedAt: number;
  calculatedTotals: CalculatedTotals | null;
}

export interface SavedLead {
  id: string;
  customerName: string; // For display and search
  customerPhone: string; // For display and search
  notes: string; // Lead-level notes, separate from quote versions
  createdAt: number;
  updatedAt: number;
  status: LeadStatus;
  followUpAt?: number;
  activityLog: ActivityLogEntry[];
  tags?: string[];
  versions: QuoteVersion[];
  storeId: string;
  assignedToUid: string;
  // Salesforce Integration
  salesforceId?: string;
  lastSyncedAt?: number;
}

export interface SavedView {
  id: string;
  name: string;
  filters: {
    searchTerm?: string;
    statusFilter?: LeadStatus | 'all';
    tags?: string[];
    dateRange?: { start: number | null; end: number | null };
    followUpRange?: { start: number | null; end: number | null };
  };
}

// Upgrade Calculator Specific Types
export enum DeviceCondition {
    GOOD = 'Good',
    CRACKED = 'Cracked Screen',
    DAMAGED = 'Other Damage'
}

export interface UpgradeConfig {
    currentDevicePrice: number;
    remainingBalance: number;
    deviceCondition: DeviceCondition;
    hasP360: boolean;
    newDevicePrice: number;
    wantsToAddLine: boolean;
    wantsToChangePlan: boolean;
    wantsToAddBts: boolean;
}

export interface UpgradeProgram {
    name: string;
    howItWorks: string;
    whoIsEligible: string;
}

export interface TMobileUpgradeData {
    upgradePrograms: UpgradeProgram[];
    tradeInRequirements: string[];
    creditApplicationInfo: string[];
}