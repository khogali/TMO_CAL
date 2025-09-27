import React, { useEffect } from 'react';
// FIX: Import PlanDetails to be used for explicit type casting.
import { QuoteConfig, CustomerType, PlanPricingData, PlanDetails, DiscountSettings, InsurancePlan, TradeInType, QuoteFees, Accessory, AccessoryPaymentType } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';
import DiscountOption from './ui/DiscountOption';
import ButtonGroup from './ui/ButtonGroup';
import Toggle from './ui/Toggle';

interface QuoteFormProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
  planPricing: PlanPricingData;
  discountSettings: DiscountSettings;
  insurancePlans: InsurancePlan[];
}

const QuoteForm: React.FC<QuoteFormProps> = ({ config, setConfig, planPricing, discountSettings, insurancePlans }) => {
  const planDetails = planPricing[config.plan];
  let thirdLineFreeDiscountValue = 0;
  if (planDetails && planDetails.price.length >= 3) {
      const twoLinePrice = planDetails.price[1];
      const threeLinePrice = planDetails.price[2];
      thirdLineFreeDiscountValue = threeLinePrice - twoLinePrice;
  }

  useEffect(() => {
    setConfig(prev => {
        const devicesChanged = prev.devices.length > prev.lines;
        const thirdLineFreeChanged = prev.lines < 3 && prev.discounts.thirdLineFree;
        const insuranceLinesChanged = (prev.insuranceLines ?? 0) > prev.lines;

        if (!devicesChanged && !thirdLineFreeChanged && !insuranceLinesChanged) {
            return prev;
        }
        
        const newConfig = {...prev};
        if (devicesChanged) {
            newConfig.devices = prev.devices.slice(0, prev.lines);
        }
        if (thirdLineFreeChanged) {
            newConfig.discounts = {...prev.discounts, thirdLineFree: false};
        }
        if (insuranceLinesChanged) {
            newConfig.insuranceLines = prev.lines;
        }
        
        return newConfig;
    });
  }, [config.lines, config.devices.length, config.discounts.thirdLineFree, config.insuranceLines, setConfig]);

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
    if (name.startsWith('fees.')) {
        const feeType = name.split('.')[1] as keyof QuoteFees;
        setConfig(prev => {
            const newFees: QuoteFees = {
                activation: false,
                upgrade: false,
            };

            // If the toggle is being checked, set it to true.
            // The other fee is already false from initialization.
            // If it's being unchecked, both will be false.
            if (checked) {
                newFees[feeType] = true;
            }

            return {
                ...prev,
                fees: newFees,
            };
        });
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof QuoteConfig] as object) || {}),
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setConfig(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleValueChange = (name: string, value: string | CustomerType) => {
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
              devices: [...prev.devices, { price: 0, tradeIn: 0, tradeInType: TradeInType.MONTHLY_CREDIT }],
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

  const handleAddAccessory = () => {
    setConfig(prev => ({
        ...prev,
        accessories: [...(prev.accessories || []), { id: crypto.randomUUID(), name: '', price: 0, paymentType: AccessoryPaymentType.FULL, quantity: 1 }],
    }));
  };

  const handleRemoveAccessory = (id: string) => {
      setConfig(prev => ({
          ...prev,
          accessories: prev.accessories.filter(acc => acc.id !== id),
      }));
  };

  const handleAccessoryChange = (id: string, field: 'name' | 'price' | 'paymentType', value: string) => {
      setConfig(prev => ({
          ...prev,
          accessories: prev.accessories.map(acc => {
              if (acc.id === id) {
                  const finalValue = field === 'price' ? Number(value) : value;
                  return { ...acc, [field]: finalValue };
              }
              return acc;
          }),
      }));
  };

  const handleAccessoryQuantityChange = (id: string, increment: number) => {
      setConfig(prev => ({
          ...prev,
          accessories: prev.accessories.map(acc => {
              if (acc.id === id) {
                  const newQuantity = (acc.quantity || 1) + increment;
                  return { ...acc, quantity: newQuantity >= 1 ? newQuantity : 1 };
              }
              return acc;
          }),
      }));
  };

  const handleInsuranceTierChange = (_name: string, value: string) => {
    const newTierId = value;
    setConfig(prev => {
        const newConfig = { ...prev, insuranceTier: newTierId };
        if (newTierId === 'none') {
            newConfig.insuranceLines = 0;
        } else if (prev.insuranceTier === 'none') {
            // When moving from None to a tier, default to insuring all lines.
            newConfig.insuranceLines = prev.lines;
        }
        return newConfig;
    });
  };
  
  const handleInsuranceLinesChange = (increment: number) => {
    setConfig(prev => {
        const newLines = (prev.insuranceLines || 0) + increment;
        if (newLines >= 0 && newLines <= prev.lines) {
            if (newLines === 0) {
                return { ...prev, insuranceLines: 0, insuranceTier: 'none' };
            }
            return { ...prev, insuranceLines: newLines };
        }
        return prev;
    });
  };

  // FIX: Explicitly cast Object.entries to resolve issue where planDetails was of type 'unknown'.
  const availablePlans = (Object.entries(planPricing) as [string, PlanDetails][])
    .filter(([, planDetails]) => planDetails.availableFor.includes(config.customerType))
    .map(([planKey, planDetails]) => ({ value: planKey, label: planDetails.name }));


  return (
    <div className="space-y-6">
      <Section title="Customer Info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
                <Toggle
                    label="Activation Fee"
                    description="$10 per line, one-time fee"
                    name="fees.activation"
                    checked={config.fees?.activation || false}
                    onChange={handleInputChange}
                />
                <Toggle
                    label="Upgrade Fee"
                    description="$35 per line, one-time fee"
                    name="fees.upgrade"
                    checked={config.fees?.upgrade || false}
                    onChange={handleInputChange}
                />
            </div>
            <hr className="my-4 border-slate-200 dark:border-slate-700 border-dashed" />
            <Input
              label="Tax Rate"
              type="number"
              name="taxRate"
              value={config.taxRate}
              onChange={handleInputChange}
              suffix="%"
              step="0.1"
            />
        </div>
      </Section>
      
      <Section title="Insurance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
         <Select
            label="Insurance Tier"
            name="insuranceTier"
            value={config.insuranceTier}
            onChange={handleInsuranceTierChange}
            options={[
                { value: 'none', label: 'None' },
                ...insurancePlans.map(plan => ({
                    value: plan.id,
                    label: `${plan.name} ($${plan.price}/line)`
                }))
            ]}
        />
        {config.insuranceTier !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Lines with Insurance
              </label>
              <div className="flex items-center justify-between w-full h-[42px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm px-1">
                 <button
                  type="button"
                  onClick={() => handleInsuranceLinesChange(-1)}
                  disabled={(config.insuranceLines || 0) <= 0}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-tmobile-magenta"
                  aria-label="Decrease lines with insurance"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </button>
                <div className="text-center font-semibold text-slate-800 dark:text-slate-100">
                  {config.insuranceLines || 0}
                </div>
                 <button
                  type="button"
                  onClick={() => handleInsuranceLinesChange(1)}
                  disabled={(config.insuranceLines || 0) >= config.lines}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-tmobile-magenta"
                  aria-label="Increase lines with insurance"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {device.tradeIn > 0 && (
                        <div className="pt-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {device.tradeInType === TradeInType.MONTHLY_CREDIT
                                    ? 'Trade-in value will be applied as a monthly credit over 24 months.'
                                    : 'Trade-in value will be applied as an upfront credit.'}
                            </p>
                        </div>
                    )}
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

      <Section title="Accessories">
          <div className="space-y-4">
              {(config.accessories || []).map((accessory, index) => (
                  <div key={accessory.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3 relative">
                      <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Accessory #{index + 1}</p>
                          <button 
                            type="button"
                            onClick={() => handleRemoveAccessory(accessory.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            aria-label={`Remove Accessory ${index + 1}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                              label="Accessory Name"
                              type="text"
                              name={`accessory-name-${index}`}
                              value={accessory.name}
                              onChange={(e) => handleAccessoryChange(accessory.id, 'name', e.target.value)}
                              placeholder="e.g. Case, Screen Protector"
                          />
                          <Input
                              label="Accessory Price"
                              type="number"
                              name={`accessory-price-${index}`}
                              value={accessory.price}
                              onChange={(e) => handleAccessoryChange(accessory.id, 'price', e.target.value)}
                              prefix="$"
                          />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <ButtonGroup
                          label="Payment Option"
                          name={`accessory-payment-${index}`}
                          value={accessory.paymentType}
                          onChange={(_name, value) => handleAccessoryChange(accessory.id, 'paymentType', value)}
                          options={[
                            { value: AccessoryPaymentType.FULL, label: 'Pay in Full' },
                            { value: AccessoryPaymentType.FINANCED, label: 'Finance (12 mo)' },
                          ]}
                          className="grid-cols-2"
                        />
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Quantity
                          </label>
                          <div className="flex items-center justify-between w-full h-[42px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm px-1">
                            <button
                              type="button"
                              onClick={() => handleAccessoryQuantityChange(accessory.id, -1)}
                              disabled={accessory.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-tmobile-magenta"
                              aria-label="Decrease accessory quantity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                            </button>
                            <div className="text-center font-semibold text-slate-800 dark:text-slate-100">
                              {accessory.quantity}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAccessoryQuantityChange(accessory.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-tmobile-magenta"
                              aria-label="Increase accessory quantity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                  </div>
              ))}
              <button 
                type="button"
                onClick={handleAddAccessory}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-tmobile-magenta hover:text-tmobile-magenta dark:hover:border-tmobile-magenta dark:hover:text-tmobile-magenta transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Add Accessory</span>
              </button>
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
            {config.lines >= 3 && (
                <DiscountOption
                    name="discounts.thirdLineFree"
                    label="3rd Line Free"
                    description={`Save $${thirdLineFreeDiscountValue} on your monthly bill`}
                    checked={config.discounts.thirdLineFree}
                    onChange={handleInputChange}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.625 7.5H9.375A2.625 2.625 0 1012 4.875zM21 11.25H3.75" />
                        </svg>
                    }
                />
            )}
          </div>
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