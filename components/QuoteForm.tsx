import React, { useEffect } from 'react';
// FIX: Import PlanDetails to be used for explicit type casting.
import { QuoteConfig, CustomerType, InsuranceTier, PlanPricingData, PlanDetails, DiscountSettings, InsurancePricingData } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import DiscountOption from './ui/DiscountOption';

interface QuoteFormProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
  planPricing: PlanPricingData;
  discountSettings: DiscountSettings;
  insurancePricing: InsurancePricingData;
}

const QuoteForm: React.FC<QuoteFormProps> = ({ config, setConfig, planPricing, discountSettings, insurancePricing }) => {
  
  useEffect(() => {
    if (config.devices.length > config.lines) {
        setConfig(prev => ({
            ...prev,
            devices: prev.devices.slice(0, prev.lines)
        }));
    }
  }, [config.lines, config.devices.length, setConfig]);

  useEffect(() => {
    // Automatically manage 3rd Line Free discount state
    const shouldBeActive = config.lines >= 3;
    if (config.discounts.thirdLineFree !== shouldBeActive) {
      setConfig(prev => ({
        ...prev,
        discounts: {
          ...prev.discounts,
          thirdLineFree: shouldBeActive,
        }
      }));
    }
  }, [config.lines, config.discounts.thirdLineFree, setConfig]);

  useEffect(() => {
    // Automatically disable Insider discount if customer type is not Standard
    if (config.customerType !== CustomerType.STANDARD && config.discounts.insider) {
      setConfig(prev => ({
        ...prev,
        discounts: {
          ...prev.discounts,
          insider: false,
        }
      }));
    }
  }, [config.customerType, config.discounts.insider, setConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof QuoteConfig] as object),
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleValueChange = (name: string, value: string | CustomerType | InsuranceTier) => {
    if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setConfig(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent as keyof QuoteConfig] as object),
                [child]: value
            }
        }))
    } else {
       if (name === 'plan') {
           setConfig(prev => {
               if (prev.plan !== value) {
                   return {
                       ...prev,
                       plan: value as string,
                       lines: 1, // Reset lines when plan changes
                   };
               }
               return prev;
           });
       } else {
           setConfig(prev => ({ ...prev, [name]: value }));
       }
    }
  };

  const handleCustomerTypeChange = (_name: string, value: string) => {
    const newCustomerType = value as CustomerType;
    
    setConfig(prev => {
        const availablePlansForNewType = (Object.entries(planPricing) as [string, PlanDetails][])
            .filter(([, planDetails]) => planDetails.availableFor.includes(newCustomerType))
            .map(([planKey]) => planKey);

        let newPlan = prev.plan;
        let shouldResetLines = false;
        
        // If current plan is not available for new customer type, default to the first available one
        if (!availablePlansForNewType.includes(prev.plan)) {
            newPlan = availablePlansForNewType[0] || prev.plan;
            shouldResetLines = true; // Plan is forced to change, so reset lines
        }

        return {
            ...prev,
            customerType: newCustomerType,
            plan: newPlan,
            lines: shouldResetLines ? 1 : prev.lines,
        };
    });
  };
  
  const handleLinesChange = (increment: number) => {
    const maxLines = (planPricing[config.plan] && planPricing[config.plan].maxLines) || 8;
    setConfig(prev => {
      const newLines = prev.lines + increment;
      if (newLines >= 1 && newLines <= maxLines) {
        return { ...prev, lines: newLines };
      }
      return prev;
    });
  };

  const handleAddDevice = () => {
      if (config.devices.length < config.lines) {
          setConfig(prev => ({
              ...prev,
              devices: [...prev.devices, { price: 0, tradeIn: 0 }],
          }));
      }
  };

  const handleRemoveDevice = (index: number) => {
      setConfig(prev => ({
          ...prev,
          devices: prev.devices.filter((_, i) => i !== index),
      }));
  };

  const handleDeviceChange = (index: number, field: 'price' | 'tradeIn', value: string) => {
      const numericValue = Number(value);
      if (!isNaN(numericValue)) {
          setConfig(prev => {
              const newDevices = [...prev.devices];
              newDevices[index] = { ...newDevices[index], [field]: numericValue };
              return { ...prev, devices: newDevices };
          });
      }
  };

  // FIX: Explicitly cast Object.entries to resolve issue where planDetails was of type 'unknown'.
  const availablePlans = (Object.entries(planPricing) as [string, PlanDetails][])
    .filter(([, planDetails]) => planDetails.availableFor.includes(config.customerType))
    .map(([planKey, planDetails]) => ({ value: planKey, label: planDetails.name }));


  return (
    <div className="space-y-6">
      <Section title="Customer Info">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            name="customerName"
            value={config.customerName}
            onChange={handleInputChange}
            placeholder="John Doe"
          />
          <Input
            label="Phone Number"
            name="customerPhone"
            value={config.customerPhone}
            onChange={handleInputChange}
            placeholder="(555) 123-4567"
          />
        </div>
      </Section>

      <Section title="Customer Type">
         <Select
            label="Customer Type"
            name="customerType"
            value={config.customerType}
            onChange={handleCustomerTypeChange}
            options={[
                { value: CustomerType.STANDARD, label: 'Standard Customer' },
                { value: CustomerType.MILITARY_FR, label: 'Military & FR' },
                { value: CustomerType.PLUS_55, label: '55+'},
            ]}
        />
      </Section>

      <Section title="Plan Details">
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <Select
            label="Plan Type"
            name="plan"
            value={config.plan}
            onChange={handleValueChange}
            options={availablePlans}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Number of Lines
            </label>
            <div className="flex items-center justify-between w-full h-[42px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm px-1">
               <button
                type="button"
                onClick={() => handleLinesChange(-1)}
                disabled={config.lines <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-tmobile-magenta"
                aria-label="Decrease number of lines"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              </button>
              <div className="text-center font-semibold text-slate-800 dark:text-slate-100">
                {config.lines}
              </div>
               <button
                type="button"
                onClick={() => handleLinesChange(1)}
                disabled={config.lines >= (planPricing[config.plan]?.maxLines || 8)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-tmobile-magenta"
                aria-label="Increase number of lines"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Section>
      
      <Section title="Insurance">
         <Select
            label="Insurance Tier"
            name="insuranceTier"
            value={config.insuranceTier}
            onChange={handleValueChange}
            options={[
                { value: InsuranceTier.NONE, label: insurancePricing.none.name },
                { value: InsuranceTier.BASIC, label: `${insurancePricing.basic.name} ($${insurancePricing.basic.price}/line)` },
                { value: InsuranceTier.P360, label: `${insurancePricing.p360.name} ($${insurancePricing.p360.price}/line)` },
            ]}
        />
      </Section>

      <Section title="Device Pricing">
          <div className="space-y-4">
            {config.devices.map((device, index) => (
                <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3 relative">
                    <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Device for Line {index + 1}</p>
                        <button 
                          type="button"
                          onClick={() => handleRemoveDevice(index)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove Device ${index + 1}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                            label="Device Price"
                            type="number"
                            name={`device-price-${index}`}
                            value={device.price}
                            onChange={(e) => handleDeviceChange(index, 'price', e.target.value)}
                            prefix="$"
                        />
                        <Input
                            label="Trade-in Value"
                            type="number"
                            name={`device-tradein-${index}`}
                            value={device.tradeIn}
                            onChange={(e) => handleDeviceChange(index, 'tradeIn', e.target.value)}
                            prefix="$"
                        />
                    </div>
                </div>
            ))}
             {config.devices.length < config.lines && (
                <button 
                  type="button"
                  onClick={handleAddDevice}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-tmobile-magenta hover:text-tmobile-magenta dark:hover:border-tmobile-magenta dark:hover:text-tmobile-magenta transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span>Add Device ({config.devices.length}/{config.lines})</span>
                </button>
            )}
             {config.devices.length === 0 && config.lines > 0 && (
                 <div className="text-center py-4 text-sm text-slate-500 dark:text-slate-400">
                     No devices added. Click the button above to include hardware in the quote.
                 </div>
            )}
          </div>
      </Section>

      <Section title="Discounts">
          <div className="space-y-3">
            <DiscountOption
              name="discounts.autopay"
              label="AutoPay Discount"
              description={`$${discountSettings.autopay} off per line with AutoPay`}
              checked={config.discounts.autopay}
              onChange={handleInputChange}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.5 3.75h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" />
                </svg>
              }
            />
            {config.customerType === CustomerType.STANDARD && (
              <DiscountOption
                name="discounts.insider"
                label="Insider Code"
                description={`${discountSettings.insider}% off voice lines`}
                checked={config.discounts.insider}
                onChange={handleInputChange}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                }
              />
            )}
          </div>
      </Section>

       <Section title="Taxes">
          <Input
              label="Tax Rate"
              type="number"
              name="taxRate"
              value={config.taxRate}
              onChange={handleInputChange}
              suffix="%"
              step="0.1"
          />
      </Section>
    </div>
  );
};

interface SectionProps {
    title: string;
    children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, children }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
);


export default QuoteForm;