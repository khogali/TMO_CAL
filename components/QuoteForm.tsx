import React from 'react';
import { QuoteConfig, CalculatedTotals, GuidancePlacement } from '../types';
import { useData } from '../context/AppContext';
import GuidanceDisplay from './ui/GuidanceDisplay';
import CustomerInfoSection from './formSections/CustomerInfoSection';
import PlanDetailsSection from './formSections/PlanDetailsSection';
import InsuranceSection from './formSections/InsuranceSection';
import DeviceSection from './formSections/DeviceSection';
import AccessoriesSection from './formSections/AccessoriesSection';
import DiscountsSection from './formSections/DiscountsSection';
import NotesSection from './formSections/NotesSection';

interface QuoteFormProps {
  mode: 'simple' | 'full';
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
  totals: CalculatedTotals | null;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ mode, config, setConfig, totals }) => {
  const { guidanceItems } = useData();

  return (
    <div className="space-y-6">
      <GuidanceDisplay items={guidanceItems} config={config} placement={GuidancePlacement.BEFORE_CUSTOMER_INFO} />
      
      <CustomerInfoSection mode={mode} config={config} setConfig={setConfig} totals={totals} />

      <GuidanceDisplay items={guidanceItems} config={config} placement={GuidancePlacement.BEFORE_PLAN_DETAILS} />
      
      <PlanDetailsSection config={config} setConfig={setConfig} />

      <GuidanceDisplay items={guidanceItems} config={config} placement={GuidancePlacement.BEFORE_INSURANCE} />

      <InsuranceSection config={config} setConfig={setConfig} />
      
      {mode === 'full' && (
        <>
          <GuidanceDisplay items={guidanceItems} config={config} placement={GuidancePlacement.BEFORE_DEVICES} />
          <DeviceSection mode={mode} config={config} setConfig={setConfig} />

          <GuidanceDisplay items={guidanceItems} config={config} placement={GuidancePlacement.BEFORE_ACCESSORIES} />
          <AccessoriesSection config={config} setConfig={setConfig} totals={totals} />
        </>
      )}

      <DiscountsSection config={config} setConfig={setConfig} />

      {mode === 'full' && (
        <NotesSection config={config} setConfig={setConfig} />
      )}
    </div>
  );
};

export default QuoteForm;
