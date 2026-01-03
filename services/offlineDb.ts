import Dexie, { Table } from 'dexie';
import { SavedLead, UserProfile, Store, PlanPricingData, DiscountSettings, InsurancePlan, Promotion, GuidanceItem, TMobileUpgradeData, DeviceDatabase, ServicePlan } from '../types';

export interface Settings {
    id: 'main'; // Use a singleton ID for the settings object
    plans: PlanPricingData;
    servicePlans: ServicePlan[];
    discounts: DiscountSettings;
    insurance: InsurancePlan[];
    promotions: Promotion[];
    guidanceItems: GuidanceItem[];
    upgradeData: TMobileUpgradeData;
    deviceDatabase: DeviceDatabase;
}

export class AppDB extends Dexie {
    leads!: Table<SavedLead>;
    users!: Table<UserProfile>;
    stores!: Table<Store>;
    settings!: Table<Settings>;

    constructor() {
        super('QuoteCalcDB');
        
        // FIX: Cast `this` to Dexie to resolve a TypeScript type inference issue.
        (this as Dexie).version(1).stores({
            leads: 'id, customerName, customerPhone, status, assignedToUid, storeId, followUpAt',
            users: 'uid, email, displayName, role, storeId',
            stores: 'id, name',
            settings: 'id',
        });

        // Handle the "Database deleted by request of the user" error.
        // This event fires if the user clears site data while the app is open.
        // We close the DB and reload the page to re-initialize a clean state.
        (this as Dexie).on('versionchange', function(event) {
            console.warn('Database version changed (likely deleted by user). Reloading...');
            event.target.close();
            window.location.reload();
            return false; // Prevent default error handling
        });

        // Handle blocked events (e.g. if another tab is trying to upgrade the DB)
        (this as Dexie).on('blocked', () => {
            console.warn('Database upgrade blocked. Reloading...');
            window.location.reload();
        });
    }
}

export const db = new AppDB();