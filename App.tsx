

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { ref, onValue, set as setRTDB, push } from 'firebase/database';
import { auth, database } from './firebase';

import QuoteForm from './components/QuoteForm';
import QuoteSnapshot from './components/QuoteSnapshot';
import QuoteModal from './components/QuoteModal';
import BottomNavBar from './components/BottomNavBar';
import LeadsPanel from './components/LeadsPanel';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import UserInfoModal from './components/UserInfoModal';
import DarkModeToggle from './components/DarkModeToggle';
import Toast from './components/ui/Toast';
import { QuoteConfig, SavedLead, CustomerType, PlanPricingData, DiscountSettings, InsurancePlan, TradeInType } from './types';
import { PLAN_PRICING, INITIAL_INSURANCE_PLANS } from './constants';

const INITIAL_CONFIG: QuoteConfig = {
  customerName: '',
  customerPhone: '',
  customerType: CustomerType.STANDARD,
  plan: 'go5g-plus',
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
    upgrade: false,
  },
  taxRate: 8.875,
  maxEC: 0,
  perLineEC: 800,
};

const DEFAULT_PREPARED_BY_NAME = 'Ahmed Khogali';
const DEFAULT_PREPARED_BY_NUMBER = '215-954-2339';
const DEFAULT_DISCOUNT_SETTINGS: DiscountSettings = {
    autopay: 5,
    insider: 20,
};

const ADMIN_UIDS = ['ag2HT3FhyCeuHqCsLWm0Vqv80sN2'];

function App() {
  const [config, setConfig] = useState<QuoteConfig>(INITIAL_CONFIG);
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [planPricing, setPlanPricing] = useState<PlanPricingData>(PLAN_PRICING);
  const [preparedByName, setPreparedByName] = useState(DEFAULT_PREPARED_BY_NAME);
  const [preparedByNumber, setPreparedByNumber] = useState(DEFAULT_PREPARED_BY_NUMBER);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettings>(DEFAULT_DISCOUNT_SETTINGS);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>(INITIAL_INSURANCE_PLANS);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLeadsPanelOpen, setIsLeadsPanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isUserInfoModalOpen, setIsUserInfoModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Firebase Effects ---

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAdmin(ADMIN_UIDS.includes(currentUser.uid));
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch settings from Realtime Database
  useEffect(() => {
    const settingsRef = ref(database, 'settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPlanPricing(data.planPricing || PLAN_PRICING);
        setPreparedByName(data.preparedByName || DEFAULT_PREPARED_BY_NAME);
        setPreparedByNumber(data.preparedByNumber || DEFAULT_PREPARED_BY_NUMBER);
        setDiscountSettings(data.discountSettings || DEFAULT_DISCOUNT_SETTINGS);
        setInsurancePlans(data.insurancePlans || INITIAL_INSURANCE_PLANS);
        setWelcomeMessage(data.welcomeMessage || null);
      } else {
        console.warn('Settings not found in Realtime Database. Using default values.');
      }
    }, (error) => {
        console.error("Failed to fetch settings from Realtime Database:", error);
        setToastMessage(`Could not load app settings. Error: ${error.code}`);
    });
    return () => unsubscribe();
  }, []);

  // Fetch leads from Realtime Database when user is logged in
  useEffect(() => {
    if (!user) {
      setLeads([]);
      return;
    }
    const leadsRef = ref(database, `leads/${user.uid}`);
    const unsubscribe = onValue(leadsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const fetchedLeads = Object.entries(data).map(([id, leadData]) => ({
          id,
          ...(leadData as Omit<SavedLead, 'id'>),
        }));
        // Sort descending by createdAt
        fetchedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLeads(fetchedLeads);
      } else {
        setLeads([]);
      }
    }, (error) => {
      console.error("Failed to fetch leads from Realtime Database:", error);
      setToastMessage('Could not load saved leads.');
    });

    return () => unsubscribe();
  }, [user]);

  // --- Local Effects ---

  // Auto-switch plan if current one becomes unavailable for the selected customer type
  useEffect(() => {
    const currentPlanDetails = planPricing[config.plan];
    if (!currentPlanDetails || !currentPlanDetails.availableFor.includes(config.customerType)) {
      const firstAvailablePlan = Object.keys(planPricing).find(pKey => planPricing[pKey].availableFor.includes(config.customerType));
      if (firstAvailablePlan) {
        setConfig(c => ({...c, plan: firstAvailablePlan, lines: 1}));
      }
    }
  }, [planPricing, config.plan, config.customerType]);
  
  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Handlers ---

  const handleSaveLead = async () => {
    if (!user) {
        setToastMessage('Please sign in to save a quote.');
        setIsAuthModalOpen(true);
        return;
    }
    const newLeadData: Omit<SavedLead, 'id'> = {
      ...config,
      createdAt: new Date().toISOString(),
    };
    try {
        const userLeadsRef = ref(database, `leads/${user.uid}`);
        const newLeadRef = push(userLeadsRef);
        await setRTDB(newLeadRef, newLeadData);
        setToastMessage('Quote saved successfully!');
        setIsQuoteModalOpen(false);
    } catch (error) {
        console.error("Error saving lead:", error);
        setToastMessage('Failed to save quote.');
    }
  };

  const handleLoadLead = (lead: SavedLead) => {
    const completeConfig: QuoteConfig = {
      ...INITIAL_CONFIG,
      ...lead,
      maxEC: lead.maxEC ?? INITIAL_CONFIG.maxEC,
      perLineEC: lead.perLineEC ?? INITIAL_CONFIG.perLineEC,
      insuranceLines: lead.insuranceLines ?? (lead.insuranceTier && lead.insuranceTier !== 'none' ? lead.lines : 0),
      fees: lead.fees || INITIAL_CONFIG.fees,
      discounts: lead.discounts || INITIAL_CONFIG.discounts,
      devices: (lead.devices || []).map(device => {
          const loadedDevice = device as any; // Handle legacy devices with 'ec'
          return {
              price: loadedDevice.price || 0,
              tradeIn: loadedDevice.tradeIn || 0,
              tradeInType: loadedDevice.tradeInType || TradeInType.MONTHLY_CREDIT,
              term: loadedDevice.term || 24,
              downPayment: loadedDevice.downPayment || 0,
          };
      }),
      accessories: (lead.accessories || []).map(accessory => ({
        ...accessory,
        quantity: accessory.quantity || 1,
      })),
    };
    setConfig(completeConfig);
    setIsLeadsPanelOpen(false);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!user) return;
    try {
        const leadRef = ref(database, `leads/${user.uid}/${leadId}`);
        await setRTDB(leadRef, null); // Using set with null to delete
        setToastMessage('Lead deleted.');
    } catch (error) {
        console.error("Error deleting lead:", error);
        setToastMessage('Failed to delete lead.');
    }
  };
  
  const handleSaveAdminSettings = async (settings: { pricing: PlanPricingData; name: string; number: string; discounts: DiscountSettings; insurance: InsurancePlan[]; welcomeMessage: string; }) => {
    try {
        const settingsRef = ref(database, 'settings');
        await setRTDB(settingsRef, {
            planPricing: settings.pricing,
            preparedByName: settings.name,
            preparedByNumber: settings.number,
            discountSettings: settings.discounts,
            insurancePlans: settings.insurance,
            welcomeMessage: settings.welcomeMessage || null,
        });
        
        setIsAdminPanelOpen(false);
        setToastMessage('Admin settings saved successfully!');
    } catch (error: any) {
        console.error("Error saving admin settings:", error.code, error.message);
        setToastMessage(`Failed to save settings: ${error.message}`);
    }
  };

  const handleResetAdminSettings = async () => {
    try {
        const settingsRef = ref(database, 'settings');
        await setRTDB(settingsRef, {
            planPricing: PLAN_PRICING,
            preparedByName: DEFAULT_PREPARED_BY_NAME,
            preparedByNumber: DEFAULT_PREPARED_BY_NUMBER,
            discountSettings: DEFAULT_DISCOUNT_SETTINGS,
            insurancePlans: INITIAL_INSURANCE_PLANS,
            welcomeMessage: null,
        });

        setIsAdminPanelOpen(false);
        setToastMessage('Settings reset to default.');
    } catch (error: any) {
        console.error("Error resetting settings:", error);
        setToastMessage(`Failed to reset settings: ${error.message}`);
    }
  }

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        setIsAdminPanelOpen(false);
        setIsLeadsPanelOpen(false);
        setIsUserInfoModalOpen(false);
        setToastMessage("You've been signed out.");
    } catch (error) {
        console.error("Error signing out:", error);
        setToastMessage('Failed to sign out.');
    }
  };

  const openLeadsPanel = () => {
    if (user) setIsLeadsPanelOpen(true);
    else setIsAuthModalOpen(true);
  };

  const openAdminPanel = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (isAdmin) {
      setIsAdminPanelOpen(true);
    } else {
      setToastMessage("You don't have permission to access the admin panel.");
    }
  };
  
  const renderAuthControls = () => {
    if (authLoading) {
      return <div className="h-10 w-24 bg-muted rounded-full animate-pulse"></div>;
    }
    if (user) {
      return (
        <>
          <button onClick={() => setIsUserInfoModalOpen(true)} className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Open User Info">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </button>
          <button onClick={openLeadsPanel} className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Open Leads Panel">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </button>
          {isAdmin && (
            <button onClick={openAdminPanel} className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Open Admin Panel">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          )}
          <button onClick={handleSignOut} className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </>
      );
    }
    return (
        <button onClick={() => setIsAuthModalOpen(true)} className="bg-muted hover:bg-border text-foreground font-bold py-2 px-5 rounded-full transition-colors text-sm">
            Sign In
        </button>
    );
  };


  return (
    <div className="bg-background min-h-screen font-sans text-foreground">
      <header className="bg-background/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
                {/* Logo and Title */}
                <div className="flex items-center">
                    <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Quote <span className="text-muted-foreground">Calculator</span>
                    </h1>
                </div>
                {/* Controls */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    <div className="hidden md:flex items-center gap-2">
                        {renderAuthControls()}
                    </div>
                </div>
            </div>
        </div>
      </header>
      
      {welcomeMessage && (
        <div className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-pink-300 py-2.5 px-4 text-center text-sm font-medium animate-fade-in-down">
          <p>{welcomeMessage}</p>
        </div>
      )}

      <main className="container mx-auto p-4 md:p-6 lg:p-8 pb-32 md:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-2 lg:col-span-3">
            <QuoteForm 
              config={config} 
              setConfig={setConfig} 
              planPricing={planPricing}
              discountSettings={discountSettings}
              insurancePlans={insurancePlans}
            />
          </div>
          <div className="hidden md:block md:col-span-1 lg:col-span-2 space-y-8 sticky top-28">
            <QuoteSnapshot 
              config={config} 
              planPricing={planPricing} 
              onSave={handleSaveLead}
              preparedByName={preparedByName}
              preparedByNumber={preparedByNumber}
              discountSettings={discountSettings}
              insurancePlans={insurancePlans}
            />
          </div>
        </div>
      </main>

      <div className="md:hidden fixed bottom-28 right-6 z-30 animate-fade-in-down">
          <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="bg-primary text-white font-bold w-16 h-16 rounded-2xl shadow-lg shadow-primary/30 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-transform hover:scale-105 flex items-center justify-center"
              aria-label="View Quote Summary"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
          </button>
      </div>

      <BottomNavBar
        user={user}
        onOpenLeads={openLeadsPanel}
        onOpenAdmin={openAdminPanel}
        isAdmin={isAdmin}
        onSignIn={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenUserInfo={() => setIsUserInfoModalOpen(true)}
      />

      {isQuoteModalOpen && (
        <QuoteModal onClose={() => setIsQuoteModalOpen(false)}>
            <QuoteSnapshot 
              config={config} 
              planPricing={planPricing} 
              onSave={handleSaveLead}
              preparedByName={preparedByName}
              preparedByNumber={preparedByNumber}
              discountSettings={discountSettings}
              insurancePlans={insurancePlans}
            />
        </QuoteModal>
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            setToastMessage('Signed in successfully!');
          }}
        />
      )}
      
      {isLeadsPanelOpen && (
        <LeadsPanel
            leads={leads}
            planPricing={planPricing}
            onLoad={handleLoadLead}
            onDelete={handleDeleteLead}
            onClose={() => setIsLeadsPanelOpen(false)}
            discountSettings={discountSettings}
            insurancePlans={insurancePlans}
        />
      )}

      {isAdmin && isAdminPanelOpen && (
        <AdminPanel
          currentPricing={planPricing}
          preparedByName={preparedByName}
          preparedByNumber={preparedByNumber}
          discountSettings={discountSettings}
          insurancePlans={insurancePlans}
          welcomeMessage={welcomeMessage}
          onSave={handleSaveAdminSettings}
          onReset={handleResetAdminSettings}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      {isUserInfoModalOpen && user && (
        <UserInfoModal user={user} onClose={() => setIsUserInfoModalOpen(false)} />
      )}
      
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </div>
  );
}

export default App;