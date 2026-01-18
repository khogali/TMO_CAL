
import { DeviceDatabase, DeviceModel, Accessory, AccessoryPaymentType } from '../types';

export class DeviceEngine {
    private database: DeviceDatabase;

    constructor(database: DeviceDatabase) {
        this.database = database;
    }

    /**
     * Generates a list of recommended accessories based on the selected device model.
     * Checks "What's in the box" to suggest chargers if missing.
     */
    getSuggestedAccessories(deviceModelId: string): Accessory[] {
        const device = this.database.devices.find(d => d.id === deviceModelId);
        if (!device) return [];

        const suggestions: Accessory[] = [];
        const baseId = `acc-sugg-${Math.floor(Math.random() * 10000)}`;

        // 1. Screen Protector (High margin, essential)
        suggestions.push({
            id: `${baseId}-screen`,
            name: `${device.manufacturer} Tempered Glass`,
            price: 40,
            paymentType: AccessoryPaymentType.FINANCED,
            quantity: 1,
            term: 12,
            downPayment: 0
        });

        // 2. Protective Case
        suggestions.push({
            id: `${baseId}-case`,
            name: `Impact Case for ${device.name}`,
            price: 50,
            paymentType: AccessoryPaymentType.FINANCED,
            quantity: 1,
            term: 12,
            downPayment: 0
        });

        // 3. Power Adapter Logic (Check if missing from box)
        const boxItems = (device.whatsInTheBox || []).join(' ').toLowerCase();
        // If box doesn't explicitly say adapter/block/charger, suggest one
        if (!boxItems.includes('adapter') && !boxItems.includes('block') && !boxItems.includes('charger')) {
             suggestions.push({
                id: `${baseId}-block`,
                name: '20W USB-C Power Adapter',
                price: 20,
                paymentType: AccessoryPaymentType.FULL, // Lower cost items often paid in full
                quantity: 1,
                term: 12,
                downPayment: 0
            });
        }

        return suggestions;
    }

    /**
     * Finds a logical upsell device (same manufacturer, higher price)
     */
    getUpsell(currentModelId: string): DeviceModel | null {
        const current = this.database.devices.find(d => d.id === currentModelId);
        if (!current) return null;

        const currentPrice = current.variants[0]?.price || 0;
        
        // Find devices of same make/category that are more expensive
        const upsells = this.database.devices.filter(d => 
            d.manufacturer === current.manufacturer &&
            d.category === current.category &&
            (d.variants[0]?.price || 0) > currentPrice
        ).sort((a, b) => (a.variants[0].price || 0) - (b.variants[0].price || 0)); // Get the next immediate step up

        return upsells.length > 0 ? upsells[0] : null;
    }

    /**
     * Calculates the monthly price difference between two models (assuming 24mo term)
     */
    getPriceDifference(currentModelId: string, targetModelId: string): number {
        const current = this.database.devices.find(d => d.id === currentModelId);
        const target = this.database.devices.find(d => d.id === targetModelId);
        
        if (!current || !target) return 0;
        
        const priceA = current.variants[0]?.price || 0;
        const priceB = target.variants[0]?.price || 0;
        
        return (priceB - priceA) / 24;
    }
}
