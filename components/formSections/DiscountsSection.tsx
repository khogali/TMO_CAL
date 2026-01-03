import React, { useEffect } from 'react';
import { QuoteConfig, CustomerType, PricingModel } from '../../types';
import { useData } from '../../context/AppContext';
import Section from '../ui/Section';
import DiscountOption from '../ui/DiscountOption';

interface DiscountsSectionProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
}

const DiscountsSection: React.FC<DiscountsSectionProps> = ({ config, setConfig }) => {
  const { planPricing, discountSettings } = useData();
  const planDetails = planPricing.find(p => p.id === config.plan);

  useEffect(() => {
    if (config.customerType !== CustomerType.STANDARD && config.discounts.insider) {
      setConfig(prev => ({ ...prev, discounts: { ...prev.discounts, insider: false } }));
    }
  }, [config.customerType, config.discounts.insider, setConfig]);
  
  useEffect(() => {
    if (!planDetails) return;
    const canHaveInsider = planDetails.allowedDiscounts?.insider ?? true;
    const canHave3rdLineFree = planDetails.allowedDiscounts?.thirdLineFree ?? true;
    let needsUpdate = false;
    const newDiscounts = { ...config.discounts };
    if (!canHaveInsider && newDiscounts.insider) { newDiscounts.insider = false; needsUpdate = true; }
    if (!canHave3rdLineFree && newDiscounts.thirdLineFree) { newDiscounts.thirdLineFree = false; needsUpdate = true; }
    if (needsUpdate) setConfig(prev => ({ ...prev, discounts: newDiscounts }));
  }, [config.plan, planPricing, config.discounts, setConfig, planDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const [parent, child] = name.split('.');
    setConfig(prev => ({ ...prev, [parent]: { ...((prev[parent as keyof QuoteConfig] as object) || {}), [child]: checked } }));
  };

  let thirdLineFreeDiscountValue = 0;
  if (planDetails && planDetails.pricingModel === PricingModel.TIERED && planDetails.tieredPrices && planDetails.tieredPrices.length >= 3) {
      const twoLinePrice = planDetails.tieredPrices[1];
      const threeLinePrice = planDetails.tieredPrices[2];
      thirdLineFreeDiscountValue = threeLinePrice - twoLinePrice;
  }

  return (
    <Section title="Discounts" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}>
      <div className="space-y-3">
        <DiscountOption label="AutoPay Discount" description={`$${discountSettings.autopay} off per line with AutoPay`} name="discounts.autopay" checked={config.discounts.autopay} onChange={handleInputChange} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.5 3.75h15a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25h-15a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25z" /></svg>} />
        {(config.customerType === CustomerType.STANDARD && (planDetails?.allowedDiscounts?.insider ?? true)) && (
          <DiscountOption label="Insider Code" description={`${discountSettings.insider}% off voice lines`} name="discounts.insider" checked={config.discounts.insider} onChange={handleInputChange} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m9-12v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18" /></svg>} />
        )}
        {(config.lines >= 3 && planDetails?.pricingModel === PricingModel.TIERED && (planDetails?.allowedDiscounts?.thirdLineFree ?? true)) && (
            <DiscountOption label="3rd Line Free" description={`$${thirdLineFreeDiscountValue} off with 3+ lines`} name="discounts.thirdLineFree" checked={config.discounts.thirdLineFree} onChange={handleInputChange} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.28a3 3 0 00-4.682-2.72 8.986 8.986 0 003.741-.479m7.5 2.28a8.986 8.986 0 01-3.741-.479m3.741.479c-.38.04-.77.082-1.17.112a9.022 9.022 0 01-7.5 0c-.398-.03-.79-.071-1.17-.112m7.5 2.28a9.043 9.043 0 01-1.17.112m0 0c-3.14.34-5.804.996-7.5 0l-3.75 3.75m11.25 0l3.75 3.75M3 3h3.75M3 7.5h3.75m-3.75 4.5h3.75m13.5 4.5h3.75m-3.75-4.5h3.75m-3.75-4.5h3.75M3 16.5h3.75" /></svg>} />
        )}
      </div>
    </Section>
  );
};

export default DiscountsSection;
