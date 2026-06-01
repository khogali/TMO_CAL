
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QuoteConfig } from './types';
import { useData, useUI } from './context/AppContext';
import QuoteForm from './components/QuoteForm';
import QuoteSnapshot from './components/QuoteSnapshot';
import { calculateQuoteTotals } from './utils/calculations';
import { createInitialConfig } from './constants';
import Button from './components/ui/Button';
import { optimizeQuote } from './utils/optimization';
import { applyPromoToConfig } from './utils/promoUtils';
import MobileAppShell from './components/ui/MobileAppShell';

const LeadCalculator: React.FC = () => {
  const { 
    planPricing, 
    servicePlans, 
    discountSettings, 
    insurancePlans, 
    promotions, 
    deviceDatabase,
    handleSaveOrUpdateLead, 
    leadToLoad, 
    setLeadToLoad, 
    savedTemplates,
    handleSaveTemplate,
    promoToApply,      
    clearPromoToApply,
    wizardConfig,
    clearWizardConfig,
    sessionQuote,
    setSessionQuote
  } = useData();
  const { setToastMessage } = useUI();

  // Initialize config
  const [config, setConfig] = useState<QuoteConfig>(() => sessionQuote || createInitialConfig(planPricing));
  
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const lastSavedConfigRef = useRef<string>(JSON.stringify(createInitialConfig(planPricing)));
  const configRef = useRef(config);

  // Sync refs
  useEffect(() => {
    configRef.current = config;
    setSessionQuote(config);
  }, [config, setSessionQuote]);
  
  // Apply Promo
  useEffect(() => {
      if (promoToApply && promotions.length > 0) {
          const promo = promotions.find(p => p.id === promoToApply);
          if (promo) {
              setConfig(prev => {
                  const newConfig = applyPromoToConfig(prev, promo, deviceDatabase, servicePlans);
                  setToastMessage(`Applied promotion: ${promo.name}`);
                  return newConfig;
              });
          }
          clearPromoToApply();
      }
  }, [promoToApply, promotions, deviceDatabase, servicePlans, clearPromoToApply, setToastMessage]);

  // Apply Wizard
  useEffect(() => {
      if (wizardConfig) {
          setConfig(wizardConfig);
          clearWizardConfig();
          setToastMessage("Generated quote from wizard!");
      }
  }, [wizardConfig, clearWizardConfig, setToastMessage]);

  // Load Lead
  useEffect(() => {
    if (leadToLoad) {
      const latestVersion = leadToLoad.versions?.[leadToLoad.versions.length - 1];
      if (latestVersion) {
        const baseConfig = createInitialConfig(planPricing);
        const loadedConfig = {
          ...baseConfig,
          ...latestVersion.quoteConfig,
          id: leadToLoad.id,
          notes: leadToLoad.notes,
          discounts: { ...baseConfig.discounts, ...(latestVersion.quoteConfig.discounts || {}) },
          fees: { ...baseConfig.fees, ...(latestVersion.quoteConfig.fees || {}) },
          devices: latestVersion.quoteConfig.devices || [],
          accessories: latestVersion.quoteConfig.accessories || [],
        };
        setConfig(loadedConfig);
        lastSavedConfigRef.current = JSON.stringify(loadedConfig);
      }
      setLeadToLoad(null); 
    }
  }, [leadToLoad, setLeadToLoad, planPricing]);
  
  // Default Plan Check
  useEffect(() => {
    if (planPricing.length > 0 && !planPricing.some(p => p.id === config.plan)) {
      const newDefaultPlan = planPricing.find(p => p.availableFor.includes(config.customerType)) || planPricing[0];
      setConfig(prev => ({ ...prev, plan: newDefaultPlan.id, lines: 1 }));
    } else if (planPricing.length === 0) {
      setConfig(prev => ({ ...prev, plan: '' }));
    }
  }, [planPricing, config.plan, config.customerType]);

  // Auto-Save
  useEffect(() => {
    const intervalId = setInterval(async () => {
        const currentConfig = configRef.current;
        const currentConfigStr = JSON.stringify(currentConfig);
        
        const hasContent = currentConfig.customerName || currentConfig.devices.length > 0 || (currentConfig.lines > 1) || currentConfig.id;
        
        if (currentConfigStr !== lastSavedConfigRef.current && hasContent) {
            setIsAutoSaving(true);
            try {
                const leadId = await handleSaveOrUpdateLead(currentConfig, { silent: true });
                if (leadId && typeof leadId === 'string' && !currentConfig.id) {
                    setConfig(prev => ({ ...prev, id: leadId }));
                    configRef.current = { ...configRef.current, id: leadId }; 
                }
                lastSavedConfigRef.current = JSON.stringify(configRef.current);
                setLastAutoSave(new Date());
            } catch (error) {
                console.error("Auto-save failed", error);
            } finally {
                setIsAutoSaving(false);
            }
        }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [handleSaveOrUpdateLead]);
  
  const totals = useMemo(() => calculateQuoteTotals(config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase), [config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]);

  const handleSaveTemplateClick = () => {
    const templateName = window.prompt("Enter a name for this template:");
    if (templateName) {
        const { id, customerName, customerPhone, notes, ...restConfig } = config;
        const templateConfig: QuoteConfig = {
            ...restConfig,
            customerName: '',
            customerPhone: '',
        };
        handleSaveTemplate(templateName, templateConfig);
    }
  };

  const handleLoadTemplate = (templateConfig: QuoteConfig) => {
      const newConfig = {
          ...createInitialConfig(planPricing),
          ...templateConfig,
          id: config.id,
          customerName: config.customerName,
          customerPhone: config.customerPhone,
          notes: config.notes
      };
      setConfig(newConfig);
      setToastMessage('Template loaded!');
  };

  const handleOptimize = () => {
      const { config: optimizedConfig, changesMade } = optimizeQuote(config, promotions, deviceDatabase);
      if (changesMade > 0) {
          setConfig(optimizedConfig);
          setToastMessage(`Optimization complete! Applied ${changesMade} better promotion${changesMade !== 1 ? 's' : ''}.`);
      } else {
          setToastMessage('Your quote is already optimized.');
      }
  };

  const handleClear = () => {
      if(window.confirm("Reset this quote to default?")) {
          setConfig(createInitialConfig(planPricing));
          setSessionQuote(null);
          setToastMessage("Quote reset.");
      }
  };

  return (
    <MobileAppShell>
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-foreground tracking-tight">Calculator</h1>
                    {isAutoSaving && <p className="text-[10px] text-muted-foreground animate-pulse">Saving...</p>}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleClear} className="hover:bg-muted font-medium text-xs h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-50" title="Reset Quote">
                        Reset
                    </Button>
                </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-40">
            
            {savedTemplates && savedTemplates.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                    {savedTemplates.map(template => (
                        <button 
                            key={template.id} 
                            onClick={() => handleLoadTemplate(template.quoteConfig)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                        >
                            {template.name}
                        </button>
                    ))}
                </div>
            )}

            <QuoteForm
                mode="full"
                config={config}
                setConfig={setConfig}
                totals={totals}
            />

            {/* Optimize Button */}
            {config.devices.length > 0 && (
                <Button 
                    variant="secondary" 
                    onClick={handleOptimize} 
                    className="w-full h-12 rounded-xl font-bold shadow-sm"
                >
                    ⚡️ Optimize Deals
                </Button>
            )}

            <div className="border-t border-border pt-6">
                <QuoteSnapshot 
                    mode="full" 
                    config={config} 
                    totals={totals} 
                    onSave={() => handleSaveOrUpdateLead(config)} 
                    onSaveTemplate={handleSaveTemplateClick}
                />
            </div>
        </div>
    </MobileAppShell>
  );
};

export default LeadCalculator;
