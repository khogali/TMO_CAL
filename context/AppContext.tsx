
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { ref, push, set } from 'firebase/database';
import { database } from '../firebase';
import { cleanForFirebase } from '../utils/firebaseUtils';
import { QuoteConfig, SavedLead, LeadStatus, PlanPricingData, DiscountSettings, InsurancePlan, Promotion, GuidanceItem, ActivityLogType, ActivityLogEntry, SavedView, UserProfile, UserRole, Store, TMobileUpgradeData, QuoteTemplate, DeviceDatabase, ServicePlan } from '../types';
import * as firebaseApi from '../services/firebaseApi';
import { db } from '../services/offlineDb';
import { INITIAL_PLANS, INITIAL_INSURANCE_PLANS, INITIAL_PROMOTIONS, INITIAL_GUIDANCE_ITEMS, ADMIN_UIDS, createInitialConfig, INITIAL_STORES, INITIAL_UPGRADE_DATA, INITIAL_DEVICE_DATABASE, INITIAL_SERVICE_PLANS } from '../constants';
import { calculateQuoteTotals } from '../utils/calculations';
import { QuoteConfigSchema } from '../utils/validation';

type View = 'home' | 'new-quote' | 'leads' | 'profile' | 'promotions' | 'wizard';

// --- CONTEXT TYPE DEFINITIONS ---
interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    isAdmin: boolean;
    isAuthModalOpen: boolean;
    isUserInfoModalOpen: boolean;
    isSignUp: boolean;
    authEmail: string;
    authPassword: string;
    authError: string | null;
    authLoading: boolean;
    handleSignOut: () => void;
    handleAuth: () => Promise<void>;
    handleUserInfoSave: (displayName: string, phoneNumber: string) => Promise<void>;
    setIsAuthModalOpen: (isOpen: boolean) => void;
    setIsUserInfoModalOpen: (isOpen: boolean) => void;
    setIsSignUp: (isSigningUp: boolean) => void;
    setAuthEmail: (email: string) => void;
    setAuthPassword: (password: string) => void;
}

interface DataContextType {
    allLeads: SavedLead[];
    allUsers: UserProfile[];
    allStores: Store[];
    savedViews: SavedView[];
    savedTemplates: QuoteTemplate[];
    planPricing: PlanPricingData;
    servicePlans: ServicePlan[];
    discountSettings: DiscountSettings;
    insurancePlans: InsurancePlan[];
    promotions: Promotion[];
    guidanceItems: GuidanceItem[];
    upgradeData: TMobileUpgradeData;
    deviceDatabase: DeviceDatabase;
    leadToLoad: SavedLead | null;
    promoToApply: string | null;
    wizardConfig: QuoteConfig | null; 
    visibleLeads: SavedLead[];
    handleSaveOrUpdateLead: (config: QuoteConfig, options?: { silent?: boolean }) => Promise<string | void>;
    handleUpdateLead: (leadId: string, updates: Partial<Pick<SavedLead, 'status' | 'notes' | 'followUpAt' | 'tags' | 'assignedToUid'>>) => void;
    handleSaveView: (view: Omit<SavedView, 'id'>) => Promise<void>;
    handleDeleteView: (viewId: string) => Promise<void>;
    handleSaveTemplate: (templateName: string, quoteConfig: QuoteConfig) => Promise<void>;
    handleDeleteTemplate: (templateId: string) => Promise<void>;
    handleBulkUpdateLeads: (leadIds: string[], updates: Partial<Pick<SavedLead, 'status'>>) => Promise<void>;
    handleBulkDeleteLeads: (leadIds: string[]) => Promise<void>;
    handleAdminSave: (newSettings: any) => void;
    handleAdminReset: () => void;
    deleteLead: (leadId: string) => Promise<void>;
    setLeadToLoad: (lead: SavedLead | null) => void;
    handleUsePromo: (promoId: string) => void;
    clearPromoToApply: () => void;
    applyWizardConfig: (config: QuoteConfig) => void; 
    clearWizardConfig: () => void; 
}

interface UIContextType {
    view: View;
    isDarkMode: boolean;
    isPasswordModalOpen: boolean;
    isAdminPanelOpen: boolean;
    toastMessage: string | null;
    setView: (view: View) => void;
    setIsDarkMode: (isDark: boolean) => void;
    setIsPasswordModalOpen: (isOpen: boolean) => void;
    setIsAdminPanelOpen: (isOpen: boolean) => void;
    setToastMessage: (message: string | null) => void;
}


// --- CONTEXT CREATION ---
const AuthContext = createContext<AuthContextType | null>(null);
const DataContext = createContext<DataContextType | null>(null);
const UIContext = createContext<UIContextType | null>(null);


// --- APP PROVIDER COMPONENT ---
export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    // --- UI STATE ---
    const [view, setView] = useState<View>('home');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // --- AUTH STATE ---
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpenState] = useState(false);
    const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(false);
    
    // --- DATA STATE ---
    const [allLeads, setAllLeads] = useState<SavedLead[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [allStores, setAllStores] = useState<Store[]>([]);
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [savedTemplates, setSavedTemplates] = useState<QuoteTemplate[]>([]);
    const [planPricing, setPlanPricing] = useState<PlanPricingData>(INITIAL_PLANS);
    const [servicePlans, setServicePlans] = useState<ServicePlan[]>(INITIAL_SERVICE_PLANS);
    const [discountSettings, setDiscountSettings] = useState<DiscountSettings>({ autopay: 5, insider: 20, thirdLineFree: 0 });
    const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>(INITIAL_INSURANCE_PLANS);
    const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
    const [guidanceItems, setGuidanceItems] = useState<GuidanceItem[]>(INITIAL_GUIDANCE_ITEMS);
    const [upgradeData, setUpgradeData] = useState<TMobileUpgradeData>(INITIAL_UPGRADE_DATA);
    const [deviceDatabase, setDeviceDatabase] = useState<DeviceDatabase>(INITIAL_DEVICE_DATABASE);
    const [leadToLoad, setLeadToLoad] = useState<SavedLead | null>(null);
    const [promoToApply, setPromoToApply] = useState<string | null>(null);
    const [wizardConfig, setWizardConfig] = useState<QuoteConfig | null>(null);

    // --- SIDE EFFECTS & LOGIC ---

    const setIsAuthModalOpen = useCallback((isOpen: boolean) => {
        setIsAuthModalOpenState(isOpen);
        if (!isOpen) {
            setAuthEmail('');
            setAuthPassword('');
            setAuthError(null);
            setAuthLoading(false);
            setIsSignUp(false);
        }
    }, []);

    useEffect(() => {
      const handleShowToast = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (typeof detail === 'string') setToastMessage(detail);
      };
      window.addEventListener('show-toast', handleShowToast);
      return () => window.removeEventListener('show-toast', handleShowToast);
    }, []);

    // OFFLINE-FIRST DATA LOADING & SYNC
    useEffect(() => {
        const syncSettings = async () => {
            // Load from local DB first for instant startup
            try {
                if ((db as any).isOpen()) {
                    const cachedSettings = await db.settings.get('main');
                    if (cachedSettings) {
                        setPlanPricing(cachedSettings.plans);
                        setServicePlans(cachedSettings.servicePlans);
                        setDiscountSettings(cachedSettings.discounts);
                        setInsurancePlans(cachedSettings.insurance);
                        setPromotions(cachedSettings.promotions);
                        setGuidanceItems(cachedSettings.guidanceItems);
                        setUpgradeData(cachedSettings.upgradeData);
                        setDeviceDatabase(cachedSettings.deviceDatabase);
                    }
                }
            } catch (error) {
                console.warn('Failed to load settings from offline DB:', error);
            }

            // Subscribe to Firebase for live updates
            return firebaseApi.subscribeToSettings(async (liveData) => {
                if (liveData) {
                    // Update state
                    setPlanPricing(liveData.plans || INITIAL_PLANS);
                    setServicePlans(liveData.servicePlans || INITIAL_SERVICE_PLANS);
                    setDiscountSettings(liveData.discounts || { autopay: 5, insider: 20, thirdLineFree: 0 });
                    setInsurancePlans(liveData.insurance || INITIAL_INSURANCE_PLANS);
                    setPromotions(liveData.promotions || INITIAL_PROMOTIONS);
                    setGuidanceItems(liveData.guidanceItems || INITIAL_GUIDANCE_ITEMS);
                    setUpgradeData(liveData.upgradeData || INITIAL_UPGRADE_DATA);
                    setDeviceDatabase(liveData.deviceDatabase || INITIAL_DEVICE_DATABASE);

                    // Update local cache
                    try {
                        if ((db as any).isOpen()) {
                            await db.settings.put({
                                id: 'main',
                                plans: liveData.plans || INITIAL_PLANS,
                                servicePlans: liveData.servicePlans || INITIAL_SERVICE_PLANS,
                                discounts: liveData.discounts || { autopay: 5, insider: 20, thirdLineFree: 0 },
                                insurance: liveData.insurance || INITIAL_INSURANCE_PLANS,
                                promotions: liveData.promotions || INITIAL_PROMOTIONS,
                                guidanceItems: liveData.guidanceItems || INITIAL_GUIDANCE_ITEMS,
                                upgradeData: liveData.upgradeData || INITIAL_UPGRADE_DATA,
                                deviceDatabase: liveData.deviceDatabase || INITIAL_DEVICE_DATABASE,
                            });
                        }
                    } catch (error) {
                        console.warn('Failed to update settings in offline DB:', error);
                    }
                }
            });
        };
        const unsubscribe = syncSettings();
        return () => { unsubscribe.then(unsub => unsub && unsub()); };
    }, []);


    useEffect(() => {
        if (!userProfile) return;
        
        const syncAppData = async () => {
             // Load from local DB first
            try {
                if ((db as any).isOpen()) {
                    setAllLeads(await db.leads.toArray());
                    setAllStores(await db.stores.toArray());
                    setAllUsers(await db.users.toArray());
                }
            } catch (error) {
                console.warn('Failed to load app data from offline DB:', error);
            }

            // Subscribe to Firebase for live updates
            const unsubLeads = firebaseApi.subscribeToLeads(async (leads) => {
                setAllLeads(leads);
                try {
                    if ((db as any).isOpen()) {
                        await (db as any).transaction('rw', db.leads, async () => {
                            await db.leads.clear();
                            await db.leads.bulkAdd(leads);
                        });
                    }
                } catch (error) {
                    console.warn('Failed to sync leads to offline DB:', error);
                }
            });
            const unsubStores = firebaseApi.subscribeToStores(async (stores) => {
                 if (stores.length === 0) {
                    firebaseApi.initializeStores(INITIAL_STORES);
                } else {
                    setAllStores(stores);
                    try {
                        if ((db as any).isOpen()) {
                            await (db as any).transaction('rw', db.stores, async () => {
                                await db.stores.clear();
                                await db.stores.bulkAdd(stores);
                            });
                        }
                    } catch (error) {
                        console.warn('Failed to sync stores to offline DB:', error);
                    }
                }
            });

            let unsubUsers = () => {};
            if ([UserRole.ADMIN, UserRole.DISTRICT_MANAGER, UserRole.STORE_MANAGER].includes(userProfile.role)) {
                unsubUsers = firebaseApi.subscribeToUsers(async (users) => {
                    setAllUsers(users);
                    try {
                        if ((db as any).isOpen()) {
                            await (db as any).transaction('rw', db.users, async () => {
                                await db.users.clear();
                                await db.users.bulkAdd(users);
                            });
                        }
                    } catch (error) {
                        console.warn('Failed to sync users to offline DB:', error);
                    }
                });
            }
            return { unsubLeads, unsubStores, unsubUsers };
        }
        
        const unsubPromise = syncAppData();

        return () => {
            unsubPromise.then(({ unsubLeads, unsubStores, unsubUsers }) => {
                unsubLeads && unsubLeads();
                unsubStores && unsubStores();
                unsubUsers && unsubUsers();
            });
        };
    }, [userProfile]);


    useEffect(() => {
        if (user) {
            const unsubViews = firebaseApi.subscribeToSavedViews(user.uid, setSavedViews);
            const unsubTemplates = firebaseApi.subscribeToQuoteTemplates(user.uid, setSavedTemplates);
            return () => {
                unsubViews && unsubViews();
                unsubTemplates && unsubTemplates();
            };
        } else {
            setSavedViews([]);
            setSavedTemplates([]);
        }
    }, [user]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        const unsubscribe = firebaseApi.onAuthStateChange(async (currentUser, profile) => {
            setUser(currentUser);
            if (currentUser && profile) {
                const isLegacyAdmin = ADMIN_UIDS.includes(currentUser.uid);
                if (isLegacyAdmin && profile.role !== UserRole.ADMIN) {
                    profile.role = UserRole.ADMIN;
                    await firebaseApi.updateUserProfile(currentUser.uid, profile);
                }
                setUserProfile(profile);
                setIsAdmin(profile.role === UserRole.ADMIN);
            } else {
                setUserProfile(null);
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleAuth = async () => {
        if (authLoading) return; // Prevent double submit
        setAuthLoading(true);
        setAuthError(null);
        
        try {
            await firebaseApi.authenticateUser(authEmail, authPassword, isSignUp);
            setIsAuthModalOpenState(false); // Close directly, useEffect clears fields
            setToastMessage(`Welcome back!`);
        } catch (err: any) {
            console.error("Auth Error:", err);
            // Provide friendly error messages
            let msg = err.message;
            if (msg.includes("auth/invalid-email")) msg = "Invalid email format.";
            if (msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password") || msg.includes("invalid-credential")) msg = "Invalid email or password.";
            if (msg.includes("auth/email-already-in-use")) msg = "This email is already registered.";
            if (msg.includes("auth/network-request-failed")) msg = "Network error. Please check your connection.";
            setAuthError(msg);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await firebaseApi.signOutUser();
            setView('home');
            setToastMessage('Signed out successfully.');
        } catch (e) {
            console.error(e);
        }
    };
    
    const handleUserInfoSave = async (displayName: string, phoneNumber: string) => {
        if (user && userProfile) {
            const updatedProfile = { ...userProfile, displayName, phoneNumber };
            await firebaseApi.updateUserProfile(user.uid, updatedProfile);
            setUserProfile(updatedProfile);
            setToastMessage('Preferences saved.');
        }
    };

    const handleSaveOrUpdateLead = useCallback(async (config: QuoteConfig, options?: { silent?: boolean }) => {
        if (!user || !userProfile) { 
            if (!options?.silent) setIsAuthModalOpenState(true); 
            return; 
        }
        if (!userProfile.storeId) { 
            if (!options?.silent) setToastMessage("Error: You must be assigned to a store to save leads."); 
            return; 
        }

        // --- ZOD VALIDATION ---
        try {
            QuoteConfigSchema.parse(config);
        } catch (e: any) {
            console.error("Validation error", e);
            if (!options?.silent) {
                const errorMessage = e.errors?.[0]?.message || "Invalid Data";
                setToastMessage(`Cannot save: ${errorMessage}`);
            }
            return;
        }

        const now = Date.now();
        const totals = calculateQuoteTotals(config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase);
        const { id: configId, notes: configNotes, ...quoteConfig } = config;
        let savedLeadId = configId;

        if (configId) {
            const existingLead = allLeads.find(l => l.id === configId);
            if (!existingLead) { 
                if (!options?.silent) setToastMessage('Error: Could not find lead to update.'); 
                return; 
            }
            const newVersion = { quoteConfig, versionCreatedAt: now, calculatedTotals: totals };
            const newActivityLogEntry: ActivityLogEntry = { id: crypto.randomUUID(), type: ActivityLogType.QUOTE_VERSIONED, timestamp: now, by: userProfile.uid, notes: `Version ${(existingLead.versions || []).length + 1} created.` };
            const updatedLead: SavedLead = { ...existingLead, customerName: config.customerName, customerPhone: config.customerPhone, notes: configNotes || existingLead.notes, updatedAt: now, versions: [...(existingLead.versions || []), newVersion], activityLog: [...(existingLead.activityLog || []), newActivityLogEntry] };
            await firebaseApi.updateLead(configId, updatedLead);
            if (!options?.silent) setToastMessage('Lead updated with new version!');
        } else {
            const initialLog: ActivityLogEntry = { id: crypto.randomUUID(), type: ActivityLogType.CREATED, timestamp: now, by: userProfile.uid };
            const newLead: Omit<SavedLead, 'id'> = { customerName: config.customerName, customerPhone: config.customerPhone, notes: configNotes || 'No notes added.', createdAt: now, updatedAt: now, status: LeadStatus.NEW, storeId: userProfile.storeId, assignedToUid: user.uid, activityLog: [initialLog], tags: [], versions: [{ quoteConfig, versionCreatedAt: now, calculatedTotals: totals }] };
            
            // Manually creating reference to get the ID immediately
            const newLeadRef = push(ref(database, 'leads'));
            await set(newLeadRef, cleanForFirebase(newLead));
            savedLeadId = newLeadRef.key as string;
            
            if (!options?.silent) setToastMessage('Lead saved successfully!');
        }
        
        if (!options?.silent) {
            setView('leads');
        }
        return savedLeadId;
    }, [user, userProfile, allLeads, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]);

    const handleUpdateLead = useCallback((leadId: string, updates: Partial<Pick<SavedLead, 'status' | 'notes' | 'followUpAt' | 'tags' | 'assignedToUid'>>) => {
        if (!user || !userProfile) return;
        const currentLead = allLeads.find(l => l.id === leadId);
        if (!currentLead) return;
        firebaseApi.updateLeadDetails(leadId, updates, currentLead, userProfile, allUsers);
    }, [user, userProfile, allLeads, allUsers]);

    const handleSaveView = async (view: Omit<SavedView, 'id'>) => {
        if (!user) return;
        await firebaseApi.saveUserView(user.uid, view);
        setToastMessage('View saved!');
    };

    const handleDeleteView = async (viewId: string) => {
        if (!user) return;
        await firebaseApi.deleteUserView(user.uid, viewId);
        setToastMessage('View deleted.');
    };

    const handleSaveTemplate = useCallback(async (templateName: string, quoteConfig: QuoteConfig) => {
        if (!user) { setIsAuthModalOpenState(true); return; }
        const newTemplate: QuoteTemplate = {
            id: crypto.randomUUID(),
            name: templateName,
            quoteConfig: quoteConfig
        };
        const updatedTemplates = [...savedTemplates, newTemplate];
        await firebaseApi.saveUserTemplates(user.uid, updatedTemplates);
        setToastMessage(`Template "${templateName}" saved!`);
    }, [user, savedTemplates]);

    const handleDeleteTemplate = useCallback(async (templateId: string) => {
        if (!user) return;
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
        await firebaseApi.saveUserTemplates(user.uid, updatedTemplates);
        setToastMessage('Template deleted.');
    }, [user, savedTemplates]);

    const handleBulkUpdateLeads = async (leadIds: string[], updates: Partial<Pick<SavedLead, 'status'>>) => {
        if (!user || leadIds.length === 0 || !userProfile) return;
        const result = await firebaseApi.bulkUpdateLeads(leadIds, updates, allLeads, userProfile);
        if (result.success) {
            setToastMessage(`${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} updated.`);
        }
    };

    const handleBulkDeleteLeads = async (leadIds: string[]) => {
        if (!user || leadIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to permanently delete ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''}?`)) return;
        await firebaseApi.bulkDeleteLeads(leadIds);
        setToastMessage(`${leadIds.length} lead${leadIds.length > 1 ? 's' : ''} deleted.`);
    };
    
    const handleAdminSave = async (newSettings: any) => {
        try {
            await firebaseApi.saveAllAdminSettings(newSettings, allStores, allUsers);
            setIsAdminPanelOpen(false);
            setToastMessage('Admin settings saved successfully!');
        } catch (error: any) {
            console.error("Firebase multi-path update failed:", error);
            setToastMessage(`Error: Failed to save settings. ${error.message}`);
        }
    };

    const handleAdminReset = async () => {
        if (window.confirm('Are you sure you want to reset all settings to their default values? This cannot be undone.')) {
            await firebaseApi.resetDefaultSettings();
            setIsAdminPanelOpen(false);
            setToastMessage('Settings have been reset to default.');
        }
    };
    
    const deleteLead = async (leadId: string) => {
        await firebaseApi.deleteLead(leadId);
    };

    // --- PROMO ENGINE HANDLERS ---
    const handleUsePromo = (promoId: string) => {
        setPromoToApply(promoId);
        setView('new-quote');
    };

    const clearPromoToApply = () => setPromoToApply(null);

    // --- WIZARD HANDLERS ---
    const applyWizardConfig = (config: QuoteConfig) => {
        setWizardConfig(config);
        setView('new-quote');
    };

    const clearWizardConfig = () => setWizardConfig(null);

    const visibleLeads = useMemo(() => {
        if (!userProfile) return [];
        switch (userProfile.role) {
            case UserRole.ADMIN: return allLeads;
            case UserRole.DISTRICT_MANAGER: return allLeads.filter(lead => userProfile.managedStoreIds?.includes(lead.storeId));
            case UserRole.STORE_MANAGER:
            case UserRole.REP: return allLeads.filter(lead => lead.storeId === userProfile.storeId);
            default: return [];
        }
    }, [allLeads, userProfile]);
    
    
    // --- MEMOIZED CONTEXT VALUES ---

    const authContextValue = useMemo(() => ({
        user, userProfile, isAdmin, isAuthModalOpen, isUserInfoModalOpen, isSignUp,
        authEmail, authPassword, authError, authLoading, handleSignOut, handleAuth,
        handleUserInfoSave, setIsAuthModalOpen, setIsUserInfoModalOpen, setIsSignUp,
        setAuthEmail, setAuthPassword
    }), [user, userProfile, isAdmin, isAuthModalOpen, isUserInfoModalOpen, isSignUp, authEmail, authPassword, authError, authLoading, handleSignOut, handleAuth, handleUserInfoSave, setIsAuthModalOpen, setIsUserInfoModalOpen, setIsSignUp, setAuthEmail, setAuthPassword]);

    const dataContextValue = useMemo(() => ({
        allLeads, allUsers, allStores, savedViews, planPricing, servicePlans, discountSettings,
        insurancePlans, promotions, guidanceItems, upgradeData, deviceDatabase, leadToLoad,
        visibleLeads, handleSaveOrUpdateLead, handleUpdateLead, handleSaveView,
        handleDeleteView, handleBulkUpdateLeads, handleBulkDeleteLeads, handleAdminSave,
        handleAdminReset, deleteLead, setLeadToLoad, savedTemplates, handleSaveTemplate, handleDeleteTemplate,
        promoToApply, handleUsePromo, clearPromoToApply,
        wizardConfig, applyWizardConfig, clearWizardConfig
    }), [allLeads, allUsers, allStores, savedViews, planPricing, servicePlans, discountSettings, insurancePlans, promotions, guidanceItems, upgradeData, deviceDatabase, leadToLoad, visibleLeads, handleSaveOrUpdateLead, handleUpdateLead, handleSaveView, handleDeleteView, handleBulkUpdateLeads, handleBulkDeleteLeads, handleAdminSave, handleAdminReset, deleteLead, setLeadToLoad, savedTemplates, handleSaveTemplate, handleDeleteTemplate, promoToApply, wizardConfig]);

    const uiContextValue = useMemo(() => ({
        view, isDarkMode, isPasswordModalOpen, isAdminPanelOpen, toastMessage, 
        setView, setIsDarkMode, setIsPasswordModalOpen, setIsAdminPanelOpen, setToastMessage
    }), [view, isDarkMode, isPasswordModalOpen, isAdminPanelOpen, toastMessage]);


    return (
        <AuthContext.Provider value={authContextValue}>
            <DataContext.Provider value={dataContextValue}>
                <UIContext.Provider value={uiContextValue}>
                    {children}
                </UIContext.Provider>
            </DataContext.Provider>
        </AuthContext.Provider>
    );
};

// --- CUSTOM HOOKS ---
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AppProvider');
    return context;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within an AppProvider');
    return context;
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within an AppProvider');
    return context;
};
