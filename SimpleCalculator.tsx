import React, { useState, useMemo, useEffect } from 'react';
import { QuoteConfig } from './types';
import { useData, useUI } from './context/AppContext';
import QuoteForm from './components/QuoteForm';
import QuoteSnapshot from './components/QuoteSnapshot';
import { calculateQuoteTotals } from './utils/calculations';
import { createInitialConfig } from './constants';
import Button from './components/ui/Button';

const SimpleCalculator: React.FC = () => {
  const { planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase } = useData();
  const { setView } = useUI();
  
  const [config, setConfig] = useState<QuoteConfig>(() => createInitialConfig(planPricing));
  
  const totals = useMemo(() => calculateQuoteTotals(config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase), [config, planPricing, servicePlans, discountSettings, insurancePlans, promotions, deviceDatabase]);

  useEffect(() => {
    if (planPricing.length > 0 && !planPricing.some(p => p.id === config.plan)) {
      const newDefaultPlan = planPricing.find(p => p.availableFor.includes(config.customerType)) || planPricing[0];
      if (newDefaultPlan) {
        setConfig(prev => ({ ...createInitialConfig(planPricing), plan: newDefaultPlan.id }));
      }
    }
  }, [planPricing, config.plan, config.customerType]);


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-page-slide-in-right">
       <header className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Quick Calculator</h1>
                <p className="mt-1 text-base text-muted-foreground">Generate a fast, simple quote.</p>
            </div>
            <Button onClick={() => setView('new-quote')} variant="secondary" size="sm">
                <span>Switch to Full Calculator</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <QuoteForm
            mode="simple"
            config={config}
            setConfig={setConfig}
            totals={totals}
          />
        </div>
        <div>
          <div className="sticky top-24">
            <QuoteSnapshot 
              mode="simple" 
              config={config} 
              totals={totals} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleCalculator;
