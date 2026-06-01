
import { Device, DeviceCategory, InsurancePlan } from '../types';

export interface InsuranceOption {
    id: string;
    name: string;
    price: number;
    type: 'p360' | 'basic';
    isRecommended?: boolean;
    features: string[];
}

export class InsuranceEngine {
    
    /**
     * Determines the insurance pricing tier based on device MSRP.
     * Simulates T-Mobile's Tier 1-6 structure.
     */
    static getTier(price: number): number {
        if (price >= 1200) return 6; // Foldables, Pro Max 1TB
        if (price >= 800) return 5;  // Standard Flagships (iPhone Pro, S24)
        if (price >= 600) return 4;  // Entry Flagships
        if (price >= 400) return 3;  // Mid-range
        if (price >= 200) return 2;  // Budget
        return 1;                    // Entry
    }

    /**
     * Returns the P360 price for a given device based on its tier/category.
     */
    static getP360Price(device: Device): number {
        // BYOD P360 Pricing (Open Enrollment)
        if (device.isByod) {
            return device.category === DeviceCategory.PHONE ? 18 : 12;
        }

        // BTS Pricing
        if (device.category !== DeviceCategory.PHONE) {
            return 12; // Standard BTS P360
        }

        // Phone Tiered Pricing
        const tier = this.getTier(device.price);
        switch (tier) {
            case 6: return 25; // Tier 6 (Foldables/High Value)
            case 5: return 18; // Tier 5 (Standard High End)
            case 4: return 16; // Tier 4
            case 3: return 13; // Tier 3
            case 2: return 9;  // Tier 2
            case 1: return 7;  // Tier 1
            default: return 18;
        }
    }

    /**
     * Returns the Basic Protection price.
     */
    static getBasicPrice(device: Device): number {
        if (device.category !== DeviceCategory.PHONE) return 8; // BTS Basic
        
        const tier = this.getTier(device.price);
        // Simplified Basic pricing model
        if (tier >= 5) return 12;
        if (tier >= 3) return 9;
        return 5;
    }

    /**
     * Generates all available insurance options for a specific device.
     */
    static getOptionsForDevice(device: Device): InsuranceOption[] {
        const options: InsuranceOption[] = [];
        
        // P360 Option (Includes AppleCare+ for Apple devices)
        const isApple = device.modelId?.toLowerCase().includes('iphone') || device.modelId?.toLowerCase().includes('apple');
        const p360Price = this.getP360Price(device);
        
        options.push({
            id: 'p360',
            name: `Protection <360>`,
            price: p360Price,
            type: 'p360',
            isRecommended: true,
            features: [
                isApple ? 'AppleCare+ Included' : 'Extended Warranty',
                'Unlimited Screen Repairs',
                'JUMP! Upgrades',
                'Loss & Theft'
            ]
        });

        // Basic Option
        const basicPrice = this.getBasicPrice(device);
        options.push({
            id: 'basic',
            name: 'Basic Protection',
            price: basicPrice,
            type: 'basic',
            features: [
                'Device Malfunction',
                'Accidental Damage'
            ]
        });

        return options;
    }

    /**
     * Calculates the cost of a selected plan for a specific device.
     * This ensures the totals calculation matches the UI display.
     */
    static calculateCost(device: Device, insuranceId: string): number {
        if (!insuranceId) return 0;
        
        if (insuranceId === 'p360' || insuranceId.includes('p360')) {
            return this.getP360Price(device);
        }
        if (insuranceId === 'basic' || insuranceId.includes('basic')) {
            return this.getBasicPrice(device);
        }
        
        // Fallback for legacy IDs
        return 18; 
    }
}
