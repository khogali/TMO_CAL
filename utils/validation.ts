
import { z } from 'zod';
import { DeviceCategory, AccessoryPaymentType, CustomerType } from '../types';

export const DeviceSchema = z.object({
  id: z.string(),
  category: z.nativeEnum(DeviceCategory),
  modelId: z.string().optional(),
  variantSku: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  tradeIn: z.number().min(0, "Trade-in must be non-negative"),
  tradeInType: z.enum(['manual', 'promo']).optional(),
  appliedPromoId: z.string().nullable().optional(),
  term: z.number().int().positive("Term must be positive"),
  downPayment: z.number().min(0, "Down payment must be non-negative"),
  servicePlanId: z.string().optional(),
  insuranceId: z.string().optional(),
  isByod: z.boolean().optional(),
});

export const AccessorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Accessory name is required"),
  price: z.number().min(0),
  paymentType: z.nativeEnum(AccessoryPaymentType),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  term: z.number().int().positive(),
  downPayment: z.number().min(0),
});

export const QuoteConfigSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerType: z.nativeEnum(CustomerType),
  plan: z.string().min(1, "Plan selection is required"),
  lines: z.number().int().min(1, "At least 1 line is required"),
  devices: z.array(DeviceSchema),
  accessories: z.array(AccessorySchema),
  discounts: z.object({
    autopay: z.boolean(),
    insider: z.boolean(),
    thirdLineFree: z.boolean(),
  }),
  fees: z.object({
    activation: z.boolean(),
  }),
  taxRate: z.number().min(0),
  maxEC: z.number().min(0),
  perLineEC: z.number().min(0),
  notes: z.string().optional(),
});
