import { CustomerType, PlanDetails, InsurancePlan, Promotion, PromotionConditionField, PromotionConditionOperator, PromotionEffectType, PricingModel, GuidanceItem, QuoteConfig, PlanPricingData, GuidancePlacement, GuidanceStyle, GuidanceConditionField, Store, UserRole, TMobileUpgradeData, DeviceDatabase, PromotionCategory, DevicePromoRequirements, TradeInRequirement, ServicePlan, DeviceCategory, StackingGroup } from './types';

// IMPORTANT: This is now a fallback for the initial admin user.
// The primary source of truth for admin access is the UserRole.ADMIN in the user's profile in the database.
export const ADMIN_UIDS = ['ag2HT3FhyCeuHqCsLWm0Vqv80sN2'];

export const INITIAL_STORES: Store[] = [
    { id: 'store-downtown', name: 'Downtown Flagship' },
    { id: 'store-mall', name: 'Mall Location' },
    { id: 'store-westside', name: 'Westside Branch' },
];

export const createInitialConfig = (planPricing: PlanPricingData): QuoteConfig => {
    // Safely find a default plan, preventing a crash if planPricing is empty.
    const defaultPlan = planPricing.find(p => p.availableFor.includes(CustomerType.STANDARD)) || planPricing[0];
    return {
        customerName: '',
        customerPhone: '',
        customerType: CustomerType.STANDARD,
        plan: defaultPlan ? defaultPlan.id : '', // Ensure plan is not undefined
        lines: 1,
        insuranceTier: 'none',
        insuranceLines: 0,
        devices: [],
        accessories: [],
        discounts: {
            autopay: true,
            insider: false,
            thirdLineFree: false,
        },
        fees: {
            activation: false,
        },
        taxRate: 6,
        maxEC: 6500,
        perLineEC: 1500,
    }
};

export const INITIAL_PLANS: PlanDetails[] = [
  // Experience Beyond (From Image 1)
  {
    id: 'experience-beyond',
    name: 'Experience Beyond',
    pricingModel: PricingModel.TIERED,
    tieredPrices: [105, 180, 230, 280, 330, 380, 430, 480, 535, 590, 645, 700],
    maxLines: 12,
    availableFor: [CustomerType.STANDARD],
    taxesIncluded: true,
    features: ['Unlimited Premium Data', '60GB High-Speed Hotspot', 'Netflix ON US', 'Apple TV+ ON US', 'International Roaming'],
    allowedDiscounts: { insider: true, thirdLineFree: true },
  },
  {
    id: 'experience-beyond-military',
    name: 'Experience Beyond Military/FR',
    pricingModel: PricingModel.TIERED,
    tieredPrices: [90, 140, 180, 220, 260, 300, 350, 400, 450, 500, 550, 600],
    maxLines: 12,
    availableFor: [CustomerType.MILITARY_FR],
    taxesIncluded: true,
    features: ['Unlimited Premium Data', '60GB High-Speed Hotspot', 'Netflix ON US', 'Apple TV+ ON US', 'International Roaming'],
    allowedDiscounts: { insider: false, thirdLineFree: true },
  },
  {
    id: 'experience-beyond-55',
    name: 'Experience Beyond 55+',
    pricingModel: PricingModel.TIERED,
    tieredPrices: [90, 140],
    maxLines: 2,
    availableFor: [CustomerType.PLUS_55],
    taxesIncluded: true,
    features: ['Unlimited Premium Data', '60GB High-Speed Hotspot', 'Netflix ON US', 'Apple TV+ ON US', 'International Roaming'],
    allowedDiscounts: { insider: false, thirdLineFree: false },
  },
  // Experience More (From Image 2)
  {
    id: 'experience-more',
    name: 'Experience More',
    pricingModel: PricingModel.TIERED,
    tieredPrices: [90, 150, 185, 220, 255, 290, 320, 360, 400, 440, 480, 520],
    maxLines: 12,
    availableFor: [CustomerType.STANDARD],
    taxesIncluded: false,
    features: ['100GB Premium Data', '25GB High-Speed Hotspot', 'Standard Definition Streaming'],
    allowedDiscounts: { insider: true, thirdLineFree: true },
  },
  {
    id: 'experience-more-military',
    name: 'Experience More Military/FR',
    pricingModel: PricingModel.TIERED,
    tieredPrices: [75, 110, 135, 160, 185, 210, 235, 260, 285, 315, 345, 380],
    maxLines: 12,
    availableFor: [CustomerType.MILITARY_FR],
    taxesIncluded: false,
    features: ['100GB Premium Data', '25GB High-Speed Hotspot', 'Standard Definition Streaming'],
    allowedDiscounts: { insider: false, thirdLineFree: true },
  },
  {
    id: 'experience-more-55',
    name: 'Experience More 55+',
    pricingModel: PricingModel.TIERED,
    tieredPrices: [75, 110],
    maxLines: 2,
    availableFor: [CustomerType.PLUS_55],
    taxesIncluded: false,
    features: ['100GB Premium Data', '25GB High-Speed Hotspot', 'Standard Definition Streaming'],
    allowedDiscounts: { insider: false, thirdLineFree: false },
  },
  // Essentials (From Image 3)
  {
    id: 'essentials',
    name: 'Essentials',
    pricingModel: PricingModel.TIERED,
    tieredPrices: [65, 100, 120, 140, 160, 180],
    maxLines: 6,
    availableFor: [CustomerType.STANDARD],
    taxesIncluded: false,
    features: ['Unlimited 5G & 4G LTE Data', '5GB High-Speed Hotspot', 'Basic protection features'],
    allowedDiscounts: { insider: true, thirdLineFree: true },
  },
];


export const INITIAL_INSURANCE_PLANS: InsurancePlan[] = [
    { id: 'basic', name: 'Basic Device Protection (Phone)', price: 12, supportedCategories: [DeviceCategory.PHONE] },
    { id: 'p360', name: 'Protection <360> (Phone)', price: 18, supportedCategories: [DeviceCategory.PHONE] },
    { id: 'p360_bts', name: 'Protection <360> (Watch/Tablet)', price: 12, supportedCategories: [DeviceCategory.WATCH, DeviceCategory.TABLET] },
    { id: 'basic_bts', name: 'Basic Protection (Watch/Tablet)', price: 8, supportedCategories: [DeviceCategory.WATCH, DeviceCategory.TABLET] },
];

export const INITIAL_SERVICE_PLANS: ServicePlan[] = [
    { id: 'watch_paired_15', name: 'Watch Paired DIGITS', price: 15, deviceCategory: DeviceCategory.WATCH, features: ['Unlimited Talk & Text', 'High-Speed Data', 'Paired with your number'], isPopular: true },
    { id: 'watch_standalone_20', name: 'Watch Standalone', price: 20, deviceCategory: DeviceCategory.WATCH, features: ['Unlimited Talk & Text', 'High-Speed Data', 'Standalone Number'] },
    { id: 'tablet_10gb_10', name: 'Tablet 10GB', price: 10, deviceCategory: DeviceCategory.TABLET, features: ['10GB High-Speed Data', 'SD Video Streaming', 'Great for light use'] },
    { id: 'tablet_unlimited_25', name: 'Tablet Unlimited', price: 25, deviceCategory: DeviceCategory.TABLET, features: ['Unlimited High-Speed Data', 'HD Video Streaming', 'Mobile Hotspot'], isPopular: true },
    { id: 'tracker_5', name: 'SyncUP Tracker', price: 5, deviceCategory: DeviceCategory.TRACKER, features: ['Real-time location', 'Virtual boundaries', '24/7 tracking'] },
];

export const INITIAL_DEVICE_DATABASE: DeviceDatabase = {
    devices: [
        { 
            id: 'iphone-15-pro', 
            name: 'iPhone 15 Pro', 
            manufacturer: 'Apple',
            category: DeviceCategory.PHONE,
            defaultTermMonths: 24,
            tags: ['5g', 'flagship', 'new_release', 'promo_eligible_bogo', 'apple_pro'],
            whatsInTheBox: ['iPhone 15 Pro', 'USB-C Charge Cable'],
            variants: [
                { sku: 'APL-IP15P-128-NTL', storage: 128, color: 'Natural Titanium', price: 999 },
                { sku: 'APL-IP15P-256-NTL', storage: 256, color: 'Natural Titanium', price: 1099 },
                { sku: 'APL-IP15P-512-BLU', storage: 512, color: 'Blue Titanium', price: 1299 },
            ]
        },
        { 
            id: 'iphone-15', 
            name: 'iPhone 15', 
            manufacturer: 'Apple',
            category: DeviceCategory.PHONE,
            defaultTermMonths: 24,
            tags: ['5g', 'new_release', 'apple_base'],
            whatsInTheBox: ['iPhone 15', 'USB-C Charge Cable'],
            variants: [
                { sku: 'APL-IP15-128-BLK', storage: 128, color: 'Black', price: 829 },
                { sku: 'APL-IP15-256-BLK', storage: 256, color: 'Black', price: 929 },
            ]
        },
        { 
            id: 'samsung-s24-ultra', 
            name: 'Samsung S24 Ultra', 
            manufacturer: 'Samsung',
            category: DeviceCategory.PHONE,
            defaultTermMonths: 24,
            tags: ['5g', 'flagship', 'new_release', 'android', 'samsung_s'],
            whatsInTheBox: ['Samsung S24 Ultra', 'S Pen', 'USB-C Cable', 'Ejection Pin'],
            variants: [
                { sku: 'SAM-S24U-256-GRY', storage: 256, color: 'Titanium Gray', price: 1299 },
                { sku: 'SAM-S24U-512-GRY', storage: 512, color: 'Titanium Gray', price: 1419 },
            ]
        },
        {
            id: 'apple-watch-se',
            name: 'Apple Watch SE',
            manufacturer: 'Apple',
            category: DeviceCategory.WATCH,
            defaultTermMonths: 24,
            tags: ['wearable', 'new_release', 'apple_watch'],
            whatsInTheBox: ['Apple Watch SE', 'Watch Band', 'Magnetic Charging Cable'],
            variants: [
                { sku: 'APL-WSE-40-MID', storage: 32, color: 'Midnight', price: 299 }
            ]
        },
        {
            id: 'ipad-10',
            name: 'iPad (10th Gen)',
            manufacturer: 'Apple',
            category: DeviceCategory.TABLET,
            defaultTermMonths: 24,
            tags: ['tablet', 'apple_ipad'],
            whatsInTheBox: ['iPad', 'USB-C Charge Cable', 'USB-C Power Adapter'],
            variants: [
                { sku: 'APL-IP10-64-BLU', storage: 64, color: 'Blue', price: 599 }
            ]
        }
    ]
};

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'military-discount',
    name: 'Military & First Responder Plan Discount',
    description: 'Special pricing for Military and First Responders.',
    category: PromotionCategory.PLAN,
    isActive: true,
    stackingGroup: StackingGroup.PLAN_DISCOUNT,
    conditions: [
      { id: 'c1', field: PromotionConditionField.CUSTOMER_TYPE, operator: PromotionConditionOperator.EQUALS, value: CustomerType.MILITARY_FR }
    ],
    effects: [
      { id: 'e1', type: PromotionEffectType.PLAN_DISCOUNT_FIXED, value: 25 }
    ]
  },
  {
    id: 'plus55-discount',
    name: '55+ Plan Discount',
    description: 'Special pricing for customers over 55.',
    category: PromotionCategory.PLAN,
    isActive: true,
    stackingGroup: StackingGroup.PLAN_DISCOUNT,
    conditions: [
      { id: 'c1', field: PromotionConditionField.CUSTOMER_TYPE, operator: PromotionConditionOperator.EQUALS, value: CustomerType.PLUS_55 }
    ],
    effects: [
      { id: 'e1', type: PromotionEffectType.PLAN_DISCOUNT_FIXED, value: 15 }
    ]
  },
  {
    id: 'iphone-15-on-us',
    name: 'iPhone 15 On Us (Any Pro)',
    description: 'Get up to $830 off any iPhone 15 Pro model via 24 monthly bill credits with eligible trade-in on a premium plan.',
    category: PromotionCategory.DEVICE,
    isActive: true,
    spotlightOnHome: true,
    stackingGroup: StackingGroup.DEVICE_OFFER,
    conditions: [
      { id: 'c1', field: PromotionConditionField.PLAN, operator: PromotionConditionOperator.INCLUDES, value: 'experience-beyond,experience-beyond-military' }
    ],
    deviceRequirements: {
        tradeIn: TradeInRequirement.REQUIRED,
        portInRequired: false,
        newLineRequired: true
    },
    // Updated to use tags instead of brittle IDs
    eligibleDeviceTags: ['apple_pro'], 
    // Fallback eligibleDeviceIds kept empty or removed as tags take precedence in new logic, 
    // but kept here for backward compat if needed (though our new logic handles both).
    eligibleDeviceIds: [], 
    effects: [
      { 
        id: 'e1', 
        type: PromotionEffectType.DEVICE_CREDIT_FIXED, 
        value: 830,
        durationMonths: 24,
      }
    ]
  },
  {
    id: 'iphone-bogo-700',
    name: 'Buy 2 iPhones, Save $700',
    description: 'Purchase 2 eligible iPhone models and get $700 off the second one via monthly bill credits. Requires new line.',
    category: PromotionCategory.DEVICE,
    isActive: true,
    stackingGroup: StackingGroup.DEVICE_OFFER,
    conditions: [
        { id: 'c1', field: PromotionConditionField.PLAN, operator: PromotionConditionOperator.INCLUDES, value: 'experience-beyond,experience-more' }
    ],
    deviceRequirements: {
        tradeIn: TradeInRequirement.OPTIONAL,
        portInRequired: false,
        newLineRequired: true
    },
    // Matches any iPhone, including Pro and Base models
    eligibleDeviceTags: ['apple_pro', 'apple_base'],
    bogoConfig: {
        buyQuantity: 2,
        discountTarget: 'lowest_price'
    },
    effects: [
        {
            id: 'e1',
            type: PromotionEffectType.DEVICE_CREDIT_FIXED,
            value: 700,
            durationMonths: 24
        }
    ]
  },
  {
    id: 'new-line-no-trade-100-off',
    name: '$100 Instant Rebate (No Trade-In)',
    description: 'Get a $100 instant rebate when you add a new line without a trade-in.',
    category: PromotionCategory.DEVICE,
    isActive: true,
    stackingGroup: StackingGroup.DEVICE_OFFER,
    conditions: [
      { id: 'c1', field: PromotionConditionField.PLAN, operator: PromotionConditionOperator.INCLUDES, value: 'experience-beyond,experience-more' }
    ],
    deviceRequirements: {
        tradeIn: TradeInRequirement.NOT_ALLOWED,
        portInRequired: false,
        newLineRequired: true
    },
    effects: [
      { 
        id: 'e1', 
        type: PromotionEffectType.DEVICE_INSTANT_REBATE, 
        value: 100,
      }
    ]
  },
  {
    id: 'watch-plan-5-off',
    name: '$5 Off Watch Plan',
    description: 'Get $5 off per month on your watch service plan for 24 months when adding a new watch.',
    category: PromotionCategory.BTS,
    isActive: true,
    stackingGroup: StackingGroup.BTS_OFFER,
    conditions: [],
    effects: [
      { 
        id: 'e1', 
        type: PromotionEffectType.SERVICE_PLAN_DISCOUNT_FIXED, 
        value: 5,
        durationMonths: 24,
      }
    ]
  }
];

export const INITIAL_GUIDANCE_ITEMS: GuidanceItem[] = [
  {
    id: 'promo1',
    title: 'New Insider Codes Available!',
    message: 'Great news! We have a new batch of Insider Codes. Remember to apply them for <strong>20% off</strong> on eligible voice lines.',
    placement: GuidancePlacement.HOME_PAGE,
    style: GuidanceStyle.PROMO,
    isActive: true,
    conditions: [],
  },
  {
    id: 'promo2',
    title: 'Updated Plan Pricing',
    message: 'Plan pricing has been updated to reflect the latest Q3 changes. Please review the new rates in the calculators.',
    placement: GuidancePlacement.HOME_PAGE,
    style: GuidanceStyle.INFO,
    isActive: true,
    conditions: [],
  },
  {
    id: 'third-line-free-tip',
    title: 'Promotion Alert: 3rd Line Free',
    message: 'This customer is eligible for the <strong>3rd Line Free</strong> discount. Make sure to select it in the Discounts section!',
    placement: GuidancePlacement.BEFORE_PLAN_DETAILS,
    style: GuidanceStyle.SUCCESS,
    isActive: true,
    conditions: [
      { id: 'c1', field: GuidanceConditionField.LINES, operator: PromotionConditionOperator.GREATER_THAN_OR_EQUAL, value: 3 },
    ],
  },
  {
    id: 'protection-upsell',
    title: 'Protect Your Investment',
    message: 'You have devices on this quote without insurance. Consider adding <strong>Protection <360></strong> for full coverage, including AppleCare+.',
    placement: GuidancePlacement.BEFORE_INSURANCE,
    style: GuidanceStyle.WARNING,
    isActive: true,
    conditions: [
      { id: 'c1', field: GuidanceConditionField.DEVICE_COUNT, operator: PromotionConditionOperator.GREATER_THAN_OR_EQUAL, value: 1 },
      { id: 'c2', field: GuidanceConditionField.INSURANCE_TIER, operator: PromotionConditionOperator.EQUALS, value: 'none' },
    ],
  },
  {
    id: 'accessory-attach',
    title: 'Complete the Solution',
    message: 'Don\'t forget the essentials! Add a case and screen protector to bundle them into the monthly payment.',
    placement: GuidancePlacement.BEFORE_ACCESSORIES,
    style: GuidanceStyle.INFO,
    isActive: true,
    conditions: [
        { id: 'c1', field: GuidanceConditionField.DEVICE_COUNT, operator: PromotionConditionOperator.GREATER_THAN_OR_EQUAL, value: 1 },
        { id: 'c2', field: GuidanceConditionField.ACCESSORY_COUNT, operator: PromotionConditionOperator.EQUALS, value: 0 },
    ],
  },
  {
    id: 'plan-upsell',
    title: 'Upgrade for Better Promos',
    message: 'The selected plan may not qualify for the highest device trade-in values. Switching to <strong>Experience Beyond</strong> can unlock up to $830 off per device.',
    placement: GuidancePlacement.BEFORE_PLAN_DETAILS,
    style: GuidanceStyle.PROMO,
    isActive: true,
    conditions: [
        { id: 'c1', field: GuidanceConditionField.PLAN, operator: PromotionConditionOperator.EQUALS, value: 'essentials' },
        { id: 'c2', field: GuidanceConditionField.LINES, operator: PromotionConditionOperator.GREATER_THAN_OR_EQUAL, value: 2 }
    ],
  },
  {
    id: 'autopay-tip',
    title: 'Save with AutoPay',
    message: 'Enable <strong>AutoPay</strong> to save $5 per line on eligible plans!',
    placement: GuidancePlacement.BEFORE_PLAN_DETAILS,
    style: GuidanceStyle.INFO,
    isActive: true,
    conditions: [
        { id: 'c1', field: GuidanceConditionField.AUTOPAY, operator: PromotionConditionOperator.EQUALS, value: false }
    ],
  }
];

export const INITIAL_UPGRADE_DATA: TMobileUpgradeData = {
  upgradePrograms: [
    {
      name: "Standard Upgrade (EIP)",
      howItWorks: "Finance your device over 24 months (0% interest). Upgrade anytime by paying off your current device (you can then trade it in or keep it) and starting a new device payment plan. No special enrollment required.",
      whoIsEligible: "All T-Mobile customers (any plan) can use EIP financing. No additional cost, aside from device payments."
    },
    {
      name: "JUMP! (via Protection360)",
      howItWorks: "After you’ve paid ≥50% of your phone’s price on EIP, you can trade in the device (must be in good condition) and T-Mobile will forgive the remaining payments (up to the last 50%). This allows a new upgrade without waiting for full payoff. JUMP! comes with the Protection360 insurance program, which has a monthly fee.",
      whoIsEligible: "Customers who add Protection360 coverage (available on most postpaid plans). Good for those who want flexibility to upgrade more often than the standard 2 years."
    },
    {
      name: "Yearly Upgrade (Go5G Next / Experience Beyond)",
      howItWorks: "Upgrade every year. After making 12 monthly payments (50% of device cost), you can trade in your eligible device in good condition. T-Mobile pays off the remaining EIP balance, allowing you to start a new device payment plan.",
      whoIsEligible: "Customers on the Go5G Next / Experience Beyond plan. This benefit is included in the plan price."
    }
  ],
  tradeInRequirements: [
      "Device must turn on and function correctly",
      "Screen must not be cracked or damaged",
      "Liquid damage indicator must not be triggered",
      "Find My iPhone / Anti-theft locking must be disabled",
      "Device must be reset to factory settings"
  ],
  creditApplicationInfo: [
      "Soft credit check required for financing (does not affect credit score)",
      "Down payment amount depends on credit class and device price",
      "Well-qualified customers often get $0 down on base models",
      "Financing limit (EC) determines total amount that can be financed across the account"
  ]
};