
import { CalculatedTotals, PlanDetails, QuoteConfig, Device, Accessory } from '../types';

// --- Types ---

export interface PublicQuoteView {
  monthlyTotal: number;
  dueToday: number;
  planName: string;
  lineCount: number;
  deviceCount: number;
  includedFeatures: string[];
  assumptions: string[];
  discountsApplied: boolean;
}

export interface AffiliateItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  imageUrl?: string;
  affiliateUrl: string;
}

// --- Config ---

export const AFFILIATE_ITEMS: AffiliateItem[] = [
  {
    id: 'aff-case',
    title: 'Ultra-Clear Protective Case',
    description: 'Military-grade drop protection that stays clear.',
    price: '$19.99',
    affiliateUrl: '#', // Replace with real link
  },
  {
    id: 'aff-charger',
    title: '20W Fast Wall Charger',
    description: 'Charge your new device to 50% in 30 minutes.',
    price: '$14.99',
    affiliateUrl: '#',
  },
  {
    id: 'aff-screen',
    title: 'Tempered Glass Screen Protector (2-Pack)',
    description: 'Easy install kit included. Scratch resistant.',
    price: '$12.99',
    affiliateUrl: '#',
  }
];

// --- Transformers ---

export const transformToPublicView = (
  totals: CalculatedTotals,
  config: QuoteConfig,
  plan?: PlanDetails
): PublicQuoteView => {
  
  const assumptions = [
    'Taxes and fees are estimated based on provided location/rate.',
    'AutoPay discount is included in monthly price.',
    'Credit approval required for device financing.',
    'Limited time offers subject to change.'
  ];

  if (config.devices.some(d => d.tradeIn > 0)) {
    assumptions.push('Trade-in values assume devices are in good condition.');
  }

  // Sanitize features: mix of plan features and general benefits
  const features = [
    ...(plan?.features || []),
    config.lines > 1 ? 'Free calls between lines' : '',
    config.devices.length > 0 ? '0% APR Device Financing' : '',
  ].filter(Boolean);

  return {
    monthlyTotal: totals.totalMonthlyInCents / 100,
    dueToday: totals.dueTodayInCents / 100,
    planName: plan?.name || 'Selected Plan',
    lineCount: config.lines,
    deviceCount: config.devices.length,
    includedFeatures: features,
    assumptions,
    discountsApplied: totals.totalDiscountsInCents > 0
  };
};

// --- Storage & Sharing ---

export const saveQuoteToLocal = (config: QuoteConfig, totals: CalculatedTotals) => {
  const savedItem = {
    id: crypto.randomUUID(),
    date: Date.now(),
    config,
    summary: {
      monthly: totals.totalMonthlyInCents,
      due: totals.dueTodayInCents,
      plan: totals.planName
    }
  };
  
  const existing = JSON.parse(localStorage.getItem('customer_saved_quotes') || '[]');
  localStorage.setItem('customer_saved_quotes', JSON.stringify([savedItem, ...existing]));
  return savedItem.id;
};

export const getSavedQuotes = () => {
  return JSON.parse(localStorage.getItem('customer_saved_quotes') || '[]');
};

export const generateShareLink = (config: QuoteConfig) => {
  // Simple Base64 encoding for shareable URL
  // In a production app, use a database ID or a shorter compression
  const json = JSON.stringify(config);
  const encoded = btoa(json);
  const url = new URL(window.location.href);
  url.hash = `#customer/shared/${encoded}`;
  return url.toString();
};

export const parseShareLink = (encoded: string): QuoteConfig | null => {
  try {
    const json = atob(encoded);
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to parse share link", e);
    return null;
  }
};
