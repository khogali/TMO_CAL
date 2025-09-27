import React, { useState, useEffect } from 'react';
import QuoteForm from './components/QuoteForm';
import QuoteSnapshot from './components/QuoteSnapshot';
import QuoteModal from './components/QuoteModal';
import BottomNavBar from './components/BottomNavBar';
import LeadsPanel from './components/LeadsPanel';
import AdminPanel from './components/AdminPanel';
import PasswordModal from './components/PasswordModal';
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
};

const DEFAULT_PREPARED_BY_NAME = 'Ahmed Khogali';
const DEFAULT_PREPARED_BY_NUMBER = '215-954-2339';
const DEFAULT_DISCOUNT_SETTINGS: DiscountSettings = {
    autopay: 5,
    insider: 20,
};

function App() {
  const [config, setConfig] = useState<QuoteConfig>(INITIAL_CONFIG);
  const [leads, setLeads] = useState<SavedLead[]>([]);
  const [planPricing, setPlanPricing] = useState<PlanPricingData>(PLAN_PRICING);
  const [preparedByName, setPreparedByName] = useState(DEFAULT_PREPARED_BY_NAME);
  const [preparedByNumber, setPreparedByNumber] = useState(DEFAULT_PREPARED_BY_NUMBER);
  const [discountSettings, setDiscountSettings] = useState<DiscountSettings>(DEFAULT_DISCOUNT_SETTINGS);
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>(INITIAL_INSURANCE_PLANS);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLeadsPanelOpen, setIsLeadsPanelOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [panelToOpen, setPanelToOpen] = useState<'admin' | 'leads' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);


  // Load from local storage on mount
  useEffect(() => {
    // Load settings from local storage
    try {
      const savedLeads = localStorage.getItem('savedLeads');
      if (savedLeads) setLeads(JSON.parse(savedLeads));

      const savedPricing = localStorage.getItem('planPricing');
      if (savedPricing) {
        const parsedPricing = JSON.parse(savedPricing);
        setPlanPricing(parsedPricing);
      } else {
        setPlanPricing(PLAN_PRICING);
      }

      const savedName = localStorage.getItem('preparedByName');
      if (savedName) setPreparedByName(JSON.parse(savedName));
      
      const savedNumber = localStorage.getItem('preparedByNumber');
      if (savedNumber) setPreparedByNumber(JSON.parse(savedNumber));

      const savedDiscounts = localStorage.getItem('discountSettings');
      if (savedDiscounts) setDiscountSettings(JSON.parse(savedDiscounts));

      const savedInsurance = localStorage.getItem('insurancePlans');
      if (savedInsurance) {
        setInsurancePlans(JSON.parse(savedInsurance));
      } else {
        const oldSavedInsurance = localStorage.getItem('insurancePricing');
        if (oldSavedInsurance) localStorage.removeItem('insurancePricing');
        setInsurancePlans(INITIAL_INSURANCE_PLANS);
      }

    } catch (error) {
      console.error("Failed to parse from local storage", error);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('savedLeads', JSON.stringify(leads));
  }, [leads]);
  
  useEffect(() => {
    localStorage.setItem('preparedByName', JSON.stringify(preparedByName));
  }, [preparedByName]);

  useEffect(() => {
    localStorage.setItem('preparedByNumber', JSON.stringify(preparedByNumber));
  }, [preparedByNumber]);

  useEffect(() => {
    localStorage.setItem('discountSettings', JSON.stringify(discountSettings));
  }, [discountSettings]);

  useEffect(() => {
    localStorage.setItem('insurancePlans', JSON.stringify(insurancePlans));
  }, [insurancePlans]);

  useEffect(() => {
    try {
      const currentPlanDetails = planPricing[config.plan];
      if (!currentPlanDetails || !currentPlanDetails.availableFor.includes(config.customerType)) {
        const firstAvailablePlan = Object.keys(planPricing).find(pKey => planPricing[pKey].availableFor.includes(config.customerType));
        if (firstAvailablePlan) {
          setConfig(c => ({...c, plan: firstAvailablePlan, lines: 1}));
        }
      }
      localStorage.setItem('planPricing', JSON.stringify(planPricing));
    } catch (error) {
      console.error("Failed to save pricing to local storage", error);
    }
  }, [planPricing]);
  
  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSaveLead = () => {
    const newLead: SavedLead = {
      ...config,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setLeads(prevLeads => [newLead, ...prevLeads]);
    setToastMessage('Quote saved successfully!');
    setIsQuoteModalOpen(false); // Close modal on save
  };

  const handleLoadLead = (lead: SavedLead) => {
    // Ensure the loaded lead has all the necessary properties, providing defaults for missing ones.
    const completeConfig: QuoteConfig = {
      ...INITIAL_CONFIG,
      ...lead,
      // For older leads without `insuranceLines`, default to all lines if a tier was selected.
      insuranceLines: lead.insuranceLines ?? (lead.insuranceTier && lead.insuranceTier !== 'none' ? lead.lines : 0),
      fees: lead.fees || INITIAL_CONFIG.fees,
      discounts: lead.discounts || INITIAL_CONFIG.discounts,
      devices: (lead.devices || []).map(device => ({
          price: device.price || 0,
          tradeIn: device.tradeIn || 0,
          tradeInType: device.tradeInType || TradeInType.MONTHLY_CREDIT,
      })),
      accessories: (lead.accessories || []).map(accessory => ({
        ...accessory,
        quantity: accessory.quantity || 1,
      })),
    };
    setConfig(completeConfig);
    setIsLeadsPanelOpen(false); // Close panel after loading
  };

  const handleDeleteLead = (leadId: string) => {
    setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
  };
  
  const handleSaveAdminSettings = (settings: { pricing: PlanPricingData; name: string; number: string; discounts: DiscountSettings; insurance: InsurancePlan[]; }) => {
    setPlanPricing(settings.pricing);
    setPreparedByName(settings.name);
    setPreparedByNumber(settings.number);
    setDiscountSettings(settings.discounts);
    setInsurancePlans(settings.insurance);
    setIsAdminPanelOpen(false);
    setToastMessage('Admin settings saved successfully!');
  };

  const handleResetAdminSettings = () => {
    setPlanPricing(PLAN_PRICING);
    setPreparedByName(DEFAULT_PREPARED_BY_NAME);
    setPreparedByNumber(DEFAULT_PREPARED_BY_NUMBER);
    setDiscountSettings(DEFAULT_DISCOUNT_SETTINGS);
    setInsurancePlans(INITIAL_INSURANCE_PLANS);
    setIsAdminPanelOpen(false);
  }

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    if (panelToOpen === 'admin') {
      setIsAdminPanelOpen(true);
    } else if (panelToOpen === 'leads') {
      setIsLeadsPanelOpen(true);
    }
    setPanelToOpen(null);
  };

  const handleOpenPasswordModal = (panel: 'admin' | 'leads') => {
    setPanelToOpen(panel);
    setIsPasswordModalOpen(true);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen font-sans text-slate-800 dark:text-slate-200">
      <header className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-40">
        <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-2">
                    <svg className="w-8 h-8 text-tmobile-magenta" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.4 2.6H2.6C1.166 2.6 0 3.766 0 5.2v13.6C0 20.234 1.166 21.4 2.6 21.4h18.8c1.434 0 2.6-1.166 2.6-2.6V5.2c0-1.434-1.166-2.6-2.6-2.6zM7.14 16.8V7.2h1.693v9.6H7.14zm5.826 0V7.2H14.66v8.058h3.322v1.542h-4.992z"/></svg>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Quote Calculator</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    <div className="hidden lg:flex items-center space-x-4">
                        <button 
                            onClick={() => handleOpenPasswordModal('leads')}
                            className="text-slate-500 hover:text-tmobile-magenta dark:text-slate-400 dark:hover:text-tmobile-magenta transition-colors"
                            aria-label="Open Leads Panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => handleOpenPasswordModal('admin')}
                            className="text-slate-500 hover:text-tmobile-magenta dark:text-slate-400 dark:hover:text-tmobile-magenta transition-colors"
                            aria-label="Open Admin Panel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            <QuoteForm 
              config={config} 
              setConfig={setConfig} 
              planPricing={planPricing}
              discountSettings={discountSettings}
              insurancePlans={insurancePlans}
            />
          </div>
          <div className="hidden lg:block lg:col-span-2 space-y-8 sticky top-24">
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

      <div className="lg:hidden fixed bottom-24 right-6 z-30 animate-fade-in-down">
          <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="bg-tmobile-magenta text-white font-bold p-4 rounded-full shadow-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tmobile-magenta dark:focus:ring-offset-slate-900 transition-transform hover:scale-105"
              aria-label="View Quote Summary"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
          </button>
      </div>

      <BottomNavBar
        onOpenLeads={() => handleOpenPasswordModal('leads')}
        onOpenAdmin={() => handleOpenPasswordModal('admin')}
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

      {isPasswordModalOpen && (
        <PasswordModal 
          onClose={() => setIsPasswordModalOpen(false)}
          onSuccess={handlePasswordSuccess}
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

      {isAdminPanelOpen && (
        <AdminPanel
          currentPricing={planPricing}
          preparedByName={preparedByName}
          preparedByNumber={preparedByNumber}
          discountSettings={discountSettings}
          insurancePlans={insurancePlans}
          onSave={handleSaveAdminSettings}
          onReset={handleResetAdminSettings}
          onClose={() => setIsAdminPanelOpen(false)}
        />
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