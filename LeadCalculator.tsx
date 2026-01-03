
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QuoteConfig } from './types';
import { useData, useUI } from './context/AppContext';
import QuoteForm from './components/QuoteForm';
import QuoteSnapshot from './components/QuoteSnapshot';
import { calculateQuoteTotals } from './utils/calculations';
import { createInitialConfig } from './constants';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';
import { optimizeQuote } from './utils/optimization';
import AIQuoteBuilderModal from './components/AIQuoteBuilderModal';
import { applyPromoToConfig } from './utils/promoUtils';

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
    handleDeleteTemplate,
    promoToApply,      
    clearPromoToApply,
    wizardConfig, // NEW
    clearWizardConfig // NEW
  } = useData();
  const { setToastMessage } = useUI();

  const [config, setConfig] = useState<QuoteConfig>(() => createInitialConfig(planPricing));
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  
  const lastSavedConfigRef = useRef<string>(JSON.stringify(createInitialConfig(planPricing)));
  const configRef = useRef(config);

  // Keep config ref updated for the interval
  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  // Logic to apply a promotion if passed from another screen
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

  // Logic to apply Wizard Config
  useEffect(() => {
      if (wizardConfig) {
          setConfig(wizardConfig);
          clearWizardConfig();
          setToastMessage("Generated quote from wizard!");
      }
  }, [wizardConfig, clearWizardConfig, setToastMessage]);

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
  
  useEffect(() => {
    if (planPricing.length > 0 && !planPricing.some(p => p.id === config.plan)) {
      const newDefaultPlan = planPricing.find(p => p.availableFor.includes(config.customerType)) || planPricing[0];
      setConfig(prev => ({ ...prev, plan: newDefaultPlan.id, lines: 1 }));
    } else if (planPricing.length === 0) {
      setConfig(prev => ({ ...prev, plan: '' }));
    }
  }, [planPricing, config.plan, config.customerType]);

  // Auto-Save Interval
  useEffect(() => {
    const intervalId = setInterval(async () => {
        const currentConfig = configRef.current;
        const currentConfigStr = JSON.stringify(currentConfig);
        
        // Don't auto-save empty drafts (basic init state)
        const hasContent = currentConfig.customerName || currentConfig.devices.length > 0 || (currentConfig.lines > 1) || currentConfig.id;
        
        if (currentConfigStr !== lastSavedConfigRef.current && hasContent) {
            setIsAutoSaving(true);
            try {
                // Call save silently
                const leadId = await handleSaveOrUpdateLead(currentConfig, { silent: true });
                
                // If it was a new lead, update the local config with the ID so next save is an update
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
          id: config.id, // Keep current ID if we are editing an existing lead
          customerName: config.customerName, // Keep current customer details
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
          setToastMessage('Your quote is already optimized for the best available deals.');
      }
  };

  const handleAiBuild = () => {
    setIsAiBuilderOpen(true);
  };

  const handleApplyAiConfig = (newConfig: QuoteConfig) => {
      setConfig(newConfig);
      setToastMessage('Quote updated from AI assistant!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
      <header>
          <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">New Quote</h1>
                  <p className="mt-1 text-base text-muted-foreground">Build a comprehensive quote, or use AI to speed things up.</p>
              </div>
              <div className="flex items-center gap-3">
                  {(isAutoSaving || lastAutoSave) && (
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground animate-fade-in-down mr-1">
                          {isAutoSaving ? (
                              <>
                                <svg className="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Saving...</span>
                              </>
                          ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Saved {lastAutoSave?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </>
                          )}
                      </div>
                  )}
                  <Button variant="secondary" onClick={handleOptimize} disabled={config.devices.length === 0}>
                      ⚡️ Optimize Deals
                  </Button>
                  <Button onClick={handleAiBuild} className="bg-gradient-to-r from-indigo-500 to-purple-600 border-none hover:from-indigo-600 hover:to-purple-700 text-white shadow-md">
                      ✨ Build with AI
                  </Button>
              </div>
          </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {savedTemplates && savedTemplates.length > 0 && (
              <Card>
                  <CardHeader>
                      <CardTitle>Load from Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="flex flex-wrap gap-2">
                          {savedTemplates.map(template => (
                              <div key={template.id} className="relative group">
                                  <Button variant="secondary" onClick={() => handleLoadTemplate(template.quoteConfig)}>
                                      {template.name}
                                  </Button>
                                  <button
                                      onClick={() => handleDeleteTemplate(template.id)}
                                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete Template"
                                  >
                                      &times;
                                  </button>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          )}
          <QuoteForm
            mode="full"
            config={config}
            setConfig={setConfig}
            totals={totals}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="sticky top-28 space-y-6">
            <QuoteSnapshot 
              mode="full" 
              config={config} 
              totals={totals} 
              onSave={() => handleSaveOrUpdateLead(config)} 
              onSaveTemplate={handleSaveTemplateClick}
            />
          </div>
        </div>
      </div>

      <AIQuoteBuilderModal 
        isOpen={isAiBuilderOpen} 
        onClose={() => setIsAiBuilderOpen(false)} 
        onApplyConfig={handleApplyAiConfig}
        currentConfig={config}
      />
    </div>
  );
};

export default LeadCalculator;
