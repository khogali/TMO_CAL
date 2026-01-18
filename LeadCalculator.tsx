
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { QuoteConfig } from './types';
import { useData, useUI } from './context/AppContext';
import QuoteForm from './components/QuoteForm';
import QuoteSnapshot from './components/QuoteSnapshot';
import { QuoteWizard } from './components/QuoteWizard'; 
import PresentationMode from './components/PresentationMode'; 
import CompetitorComparisonModal from './components/CompetitorComparisonModal'; 
import { calculateQuoteTotals } from './utils/calculations';
import { createInitialConfig } from './constants';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import Button from './components/ui/Button';
import { optimizeQuote } from './utils/optimization';
import AIQuoteBuilderModal from './components/AIQuoteBuilderModal';
import { applyPromoToConfig } from './utils/promoUtils';

// --- Launcher Mode Component ---
const LauncherMode: React.FC<{
    onSelectWizard: () => void;
    onSelectEditor: () => void;
}> = ({ onSelectWizard, onSelectEditor }) => (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-background animate-fade-in-down overflow-y-auto">
        <div className="max-w-4xl w-full text-center space-y-10 py-10">
            <div className="space-y-3">
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight sm:text-6xl">New Quote</h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">Select your workflow to get started.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                <button 
                    onClick={onSelectWizard}
                    className="group relative flex flex-col items-center p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-2 border-border hover:border-primary shadow-sm hover:shadow-2xl transition-all duration-300 text-center transform hover:-translate-y-1"
                >
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <span className="text-5xl">✨</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Magic Wizard</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                        Step-by-step guided experience. Perfect for complex family plans and new customers.
                    </p>
                </button>

                <button 
                    onClick={onSelectEditor}
                    className="group relative flex flex-col items-center p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-2 border-border hover:border-emerald-500 shadow-sm hover:shadow-2xl transition-all duration-300 text-center transform hover:-translate-y-1"
                >
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                        <span className="text-5xl">🛠️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Power Editor</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                        Direct data entry form. Best for quick estimates and experienced reps.
                    </p>
                </button>
            </div>
        </div>
    </div>
);

// --- Mode Switcher Floating Pill ---
const ModeSwitcher: React.FC<{
    mode: 'wizard' | 'editor';
    onChange: (mode: 'wizard' | 'editor') => void;
}> = ({ mode, onChange }) => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground/90 backdrop-blur-md text-background p-1.5 rounded-full shadow-2xl flex gap-1 ring-1 ring-white/10 scale-90 sm:scale-100">
        <button 
            onClick={() => onChange('wizard')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${mode === 'wizard' ? 'bg-background text-foreground shadow-sm' : 'text-background/60 hover:text-background'}`}
        >
            Wizard
        </button>
        <button 
            onClick={() => onChange('editor')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${mode === 'editor' ? 'bg-background text-foreground shadow-sm' : 'text-background/60 hover:text-background'}`}
        >
            Editor
        </button>
    </div>
);

// --- Main LeadCalculator Component ---
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
    wizardConfig, 
    clearWizardConfig,
  } = useData();
  const { setToastMessage, setIsWizardMode } = useUI();

  // 'launcher' is the initial state unless data is loaded
  const [interactionMode, setInteractionMode] = useState<'launcher' | 'wizard' | 'editor'>('launcher');
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [config, setConfig] = useState<QuoteConfig>(() => createInitialConfig(planPricing));
  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  
  // Sync wizard mode state with context for global header/footer visibility control
  useEffect(() => {
      setIsWizardMode(interactionMode === 'wizard');
  }, [interactionMode, setIsWizardMode]);

  // Handle incoming external data (Leads, Promos, Wizard)
  useEffect(() => {
      if (leadToLoad) {
          const latestVersion = leadToLoad.versions?.[leadToLoad.versions.length - 1];
          if (latestVersion) {
              const baseConfig = createInitialConfig(planPricing);
              const loadedConfig = { ...baseConfig, ...latestVersion.quoteConfig, id: leadToLoad.id, notes: leadToLoad.notes };
              setConfig(loadedConfig);
              setInteractionMode('editor'); // Default to editor for existing leads
          }
          setLeadToLoad(null);
      } else if (wizardConfig) {
          setConfig(wizardConfig);
          clearWizardConfig();
          setInteractionMode('editor'); // Wizard finished externally -> go to editor
          setToastMessage("Quote generated!");
      } else if (promoToApply) {
          const promo = promotions.find(p => p.id === promoToApply);
          if (promo) {
              setConfig(prev => applyPromoToConfig(prev, promo, deviceDatabase, servicePlans));
              setInteractionMode('editor');
              setToastMessage(`Applied promotion: ${promo.name}`);
          }
          clearPromoToApply();
      }
  }, [leadToLoad, wizardConfig, promoToApply, planPricing, promotions, deviceDatabase, servicePlans]);

  // Mode Switching
  const switchToMode = (mode: 'wizard' | 'editor') => {
      setInteractionMode(mode);
  };

  const totals = useMemo(() => calculateQuoteTotals(config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase), [config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]);

  const handleOptimize = () => {
      const { config: optimizedConfig, changesMade } = optimizeQuote(config, promotions, deviceDatabase);
      if (changesMade > 0) {
          setConfig(optimizedConfig);
          setToastMessage(`Applied ${changesMade} optimizations.`);
      } else {
          setToastMessage('Already optimized.');
      }
  };

  const handleSaveTemplateClick = () => {
      const name = window.prompt("Template Name:");
      if (name) handleSaveTemplate(name, { ...config, id: undefined, customerName: '', customerPhone: '' });
  };

  const handleLoadTemplate = (templateConfig: QuoteConfig) => {
      setConfig({ ...createInitialConfig(planPricing), ...templateConfig });
      setToastMessage('Template loaded.');
  };

  const handleWizardComplete = (newConfig: QuoteConfig) => {
      setConfig(newConfig);
      setInteractionMode('editor');
      setToastMessage("Quote created from Wizard!");
  };

  return (
    <div className="h-full w-full relative flex flex-col bg-background overflow-hidden">
      
      {/* 1. Launcher Screen */}
      {interactionMode === 'launcher' && (
          <LauncherMode 
            onSelectWizard={() => switchToMode('wizard')} 
            onSelectEditor={() => switchToMode('editor')} 
          />
      )}

      {/* 2. Wizard Screen */}
      {interactionMode === 'wizard' && (
          <div className="absolute inset-0 bg-background z-20 flex flex-col">
              <QuoteWizard 
                  initialConfig={config} 
                  onConfigChange={handleWizardComplete} 
              />
              {/* Floating switcher allows bailing out if needed */}
              <div className="fixed top-6 right-6 z-50">
                  <button onClick={() => setInteractionMode('launcher')} className="text-muted-foreground hover:text-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
          </div>
      )}

      {/* 3. Editor Screen */}
      {interactionMode === 'editor' && (
          <div className="h-full w-full relative flex flex-col">
              {/* Toolbar */}
              <div className="flex-shrink-0 bg-background/80 backdrop-blur-md border-b border-border p-4 flex gap-2 overflow-x-auto scrollbar-hide z-10">
                  <div className="flex items-center gap-2 mr-auto">
                        <Button size="sm" variant="outline" onClick={() => setInteractionMode('launcher')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Button>
                        {savedTemplates.length > 0 && (
                            <div className="flex gap-2 mr-2 border-r border-border pr-2">
                                {savedTemplates.slice(0, 2).map(t => (
                                    <Button key={t.id} variant="secondary" size="sm" onClick={() => handleLoadTemplate(t.quoteConfig)} className="whitespace-nowrap bg-muted">
                                        Load {t.name}
                                    </Button>
                                ))}
                            </div>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => setIsCompareModalOpen(true)}>Compare</Button>
                        <Button size="sm" variant="secondary" onClick={() => setIsPresentationMode(true)}>Present</Button>
                        <Button size="sm" variant="secondary" onClick={handleOptimize}>⚡️ Optimize</Button>
                  </div>
                  <Button size="sm" onClick={() => setIsAiBuilderOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 text-white shadow-md">
                      ✨ AI Assist
                  </Button>
              </div>

              {/* Scrollable Form Area */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-32">
                  <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
                      <div className="lg:col-span-3 space-y-6">
                          <QuoteForm mode="full" config={config} setConfig={setConfig} totals={totals} />
                      </div>
                      <div className="lg:col-span-2">
                          <div className="lg:sticky lg:top-4 space-y-6">
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
              </div>
              
              <ModeSwitcher mode="editor" onChange={switchToMode} />
          </div>
      )}

      {/* Modals */}
      <AIQuoteBuilderModal 
        isOpen={isAiBuilderOpen} 
        onClose={() => setIsAiBuilderOpen(false)} 
        onApplyConfig={(c) => { setConfig(c); setToastMessage("AI Quote Applied"); }} 
        currentConfig={config} 
      />
      <CompetitorComparisonModal 
        isOpen={isCompareModalOpen} 
        onClose={() => setIsCompareModalOpen(false)} 
        currentQuote={totals} 
        config={config} 
      />
      {isPresentationMode && (
          <PresentationMode 
              config={config} 
              totals={totals} 
              onClose={() => setIsPresentationMode(false)} 
          />
      )}
    </div>
  );
};

export default LeadCalculator;
