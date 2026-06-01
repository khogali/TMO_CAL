
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
    <Section title="Discounts" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}>
      <div className="space-y-3">
        <DiscountOption label="AutoPay Discount" description={`$${discountSettings.autopay} off per line with AutoPay`} name="discounts.autopay" checked={config.discounts.autopay} onChange={handleInputChange} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>} />
        {(config.customerType === CustomerType.STANDARD && (planDetails?.allowedDiscounts?.insider ?? true)) && (
          <DiscountOption label="Insider Code" description={`${discountSettings.insider}% off voice lines`} name="discounts.insider" checked={config.discounts.insider} onChange={handleInputChange} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>} />
        )}
        {(config.lines >= 3 && planDetails?.pricingModel === PricingModel.TIERED && (planDetails?.allowedDiscounts?.thirdLineFree ?? true)) && (
            <DiscountOption label="3rd Line Free" description={`$${thirdLineFreeDiscountValue} off with 3+ lines`} name="discounts.thirdLineFree" checked={config.discounts.thirdLineFree} onChange={handleInputChange} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h1.125c.621 0 1.129-.504 1.09-1.124a6.75 6.75 0 0114.82 0c-.04.62.468 1.124 1.09 1.124H21a.75.75 0 01.75.75v5.69l-4.197-.96a.75.75 0 00-.552.05l-4.251 1.7a.75.75 0 01-.552 0l-4.25-1.7a.75.75 0 00-.553-.05L2.25 17.69v-5.69a.75.75 0 01.75-.75z" /></svg>} />
        )}
      </div>
    </Section>
  );
};

export default DiscountsSection;
