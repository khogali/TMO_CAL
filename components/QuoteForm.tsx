
import React, { useEffect } from 'react';
import { QuoteConfig, CustomerType, PlanPricingData, PlanDetails, DiscountSettings, InsurancePlan, TradeInType, QuoteFees, Accessory, AccessoryPaymentType, Device } from '../types';
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

// FIX: Defined the missing `Section` component.
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card>
    <CardHeader className="border-b border-border">
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

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
  
  // Automatically switch accessory payment type to "Full" if EC limit is reached by devices
  useEffect(() => {
    const availableFinancingLimit = Math.min(config.maxEC || 0, (config.perLineEC || 0) * config.lines);
    const totalDevicePrice = config.devices.reduce((sum, device) => sum + (device.price || 0) - (device.downPayment || 0), 0);
    const remainingFinancingCredit = availableFinancingLimit - totalDevicePrice;

    if (remainingFinancingCredit <= 0) {
      const needsUpdate = (config.accessories || []).some(acc => acc.paymentType === AccessoryPaymentType.FINANCED);
      if (needsUpdate) {
        setConfig(prev => ({
          ...prev,
          accessories: prev.accessories.map(acc => 
            acc.paymentType === AccessoryPaymentType.FINANCED 
              ? { ...acc, paymentType: AccessoryPaymentType.FULL } 
              : acc
          ),
        }));
      }
    }
  }, [config.maxEC, config.perLineEC, config.lines, config.devices, setConfig]);

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
        const finalValue = type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value);
        setConfig(prev => ({ ...prev, [name]: finalValue }));
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
    const planDetails = planPricing[config.plan];
    if (!planDetails) return;

    const minLines = planDetails.minLines || 1;
    const maxLines = planDetails.maxLines || 8;

    setConfig(prev => {
      const newLines = prev.lines + increment;
      if (newLines >= minLines && newLines <= maxLines) {
        return { ...prev, lines: newLines };
      }
      return prev;
    });
  };

  const handleAddDevice = () => {
      if (config.devices.length < config.lines) {
          setConfig(prev => ({
              ...prev,
              devices: [...prev.devices, { price: 0, tradeIn: 0, tradeInType: TradeInType.MONTHLY_CREDIT, term: 24, downPayment: 0 }],
          }));
      }
  };

  const handleRemoveDevice = (index: number) => {
      setConfig(prev => ({
          ...prev,
          devices: prev.devices.filter((_, i) => i !== index),
      }));
  };

  const handleDeviceChange = (index: number, field: keyof Device, value: string) => {
      const numericValue = Number(value);
      if (!isNaN(numericValue)) {
          setConfig(prev => {
              const newDevices = [...prev.devices];
              (newDevices[index] as any)[field] = numericValue;
              return { ...prev, devices: newDevices };
          });
      }
  };

  const handleDeviceSelectChange = (index: number, field: keyof Device, value: string) => {
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      setConfig(prev => {
          const newDevices = [...prev.devices];
          (newDevices[index] as any)[field] = numericValue;
          return { ...prev, devices: newDevices };
      });
    }
  };

  const handleAddAccessory = () => {
    setConfig(prev => ({
        ...prev,
        accessories: [...(prev.accessories || []), { id: crypto.randomUUID(), name: '', price: 0, paymentType: AccessoryPaymentType.FULL, quantity: 1, term: 12, downPayment: 0 }],
    }));
  };

  const handleRemoveAccessory = (id: string) => {
      setConfig(prev => ({
          ...prev,
          accessories: prev.accessories.filter(acc => acc.id !== id),
      }));
  };

  const handleAccessoryChange = (id: string, field: keyof Accessory, value: string | AccessoryPaymentType) => {
      setConfig(prev => ({
          ...prev,
          accessories: prev.accessories.map(acc => {
              if (acc.id === id) {
                  const finalValue = (field === 'price' || field === 'downPayment' || field === 'term' || field === 'quantity') ? Number(value) : value;
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

  const availablePlans = (Object.entries(planPricing) as [string, PlanDetails][])
    .filter(([, planDetails]) => planDetails.availableFor.includes(config.customerType))
    .map(([planKey, planDetails]) => ({ value: planKey, label: planDetails.name }));
    
  const availableFinancingLimit = Math.min(config.maxEC || 0, (config.perLineEC || 0) * config.lines);
  const totalDevicePrice = config.devices.reduce((sum, device) => sum + (device.price || 0) - (device.downPayment || 0), 0);
  const remainingFinancingCredit = availableFinancingLimit - totalDevicePrice;


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
        <hr className="my-6 border-border" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Input
            label="Max Equipment Credit"
            name="maxEC"
            type="number"
            value={config.maxEC}
            onChange={handleInputChange}
            prefix="$"
          />
           <Input
            label="Per Line EC"
            name="perLineEC"
            type="number"
            value={config.perLineEC}
            onChange={handleInputChange}
            prefix="$"
          />
        </div>
      </Section>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <CardTitle>Customer Type</CardTitle>
            <Select
                name="customerType"
                value={config.customerType}
                onChange={handleCustomerTypeChange}
                options={[
                    { value: CustomerType.STANDARD, label: 'Standard Customer' },
                    { value: CustomerType.MILITARY_FR, label: 'Military & FR' },
                    { value: CustomerType.PLUS_55, label: '55+'},
                ]}
                className="w-full md:w-auto md:min-w-[240px]"
            />
        </CardHeader>
      </Card>

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
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Number of Lines
            </label>
            <div className="flex items-center justify-between w-full h-12 rounded-xl bg-muted px-2">
               <button
                type="button"
                onClick={() => handleLinesChange(-1)}
                disabled={config.lines <= (planPricing[config.plan]?.minLines || 1)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Decrease number of lines"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                </svg>
              </button>
              <div className="text-center font-bold text-lg text-foreground w-12">
                {config.lines}
              </div>
               <button
                type="button"
                onClick={() => handleLinesChange(1)}
                disabled={config.lines >= (planPricing[config.plan]?.maxLines || 8)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Increase number of lines"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
            <div className="space-y-4">
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
            <hr className="my-6 border-border border-dashed" />
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
      
      <Card>
        <CardHeader className={`flex flex-col md:flex-row md:justify-between md:items-center gap-4 ${config.insuranceTier !== 'none' ? 'border-b border-border' : ''}`}>
          <CardTitle>Insurance</CardTitle>
          <Select
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
            className="w-full md:w-auto md:min-w-[240px]"
          />
        </CardHeader>
        {config.insuranceTier !== 'none' && (
          <CardContent>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <label className="block text-sm font-medium text-muted-foreground whitespace-nowrap">
                Lines with Insurance
              </label>
              <div className="flex items-center justify-between w-full md:w-auto md:min-w-[160px] h-12 rounded-xl bg-muted px-2">
                 <button
                  type="button"
                  onClick={() => handleInsuranceLinesChange(-1)}
                  disabled={(config.insuranceLines || 0) <= 0}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Decrease lines with insurance"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </button>
                <div className="text-center font-bold text-lg text-foreground w-12">
                  {config.insuranceLines || 0}
                </div>
                 <button
                  type="button"
                  onClick={() => handleInsuranceLinesChange(1)}
                  disabled={(config.insuranceLines || 0) >= config.lines}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Increase lines with insurance"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                </button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Section title="Device Pricing">
          <div className="space-y-4">
            {config.devices.map((device, index) => (
                <Card key={index} className="overflow-hidden">
                    <CardHeader className="flex justify-between items-center bg-muted/50 p-4">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" /></svg>
                            <p className="font-semibold text-foreground">Device for Line {index + 1}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveDevice(index)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          aria-label={`Remove Device ${index + 1}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                              label="Device Price" type="number" name={`device-price-${index}`}
                              value={device.price} onChange={(e) => handleDeviceChange(index, 'price', e.target.value)} prefix="$"
                          />
                           <Input
                              label="Trade-in Value" type="number" name={`device-tradein-${index}`}
                              value={device.tradeIn} onChange={(e) => handleDeviceChange(index, 'tradeIn', e.target.value)} prefix="$"
                          />
                      </div>
                      {device.tradeIn > 0 && (
                          <div className="pt-2 text-xs text-muted-foreground">
                            Trade-in value will be applied as a monthly credit over 24 months.
                          </div>
                      )}
                      <hr className="border-border/50" />
                      <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-3">Financing Details</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Select
                                  label="Installment Term" name={`device-term-${index}`} value={String(device.term)}
                                  onChange={(_name, value) => handleDeviceSelectChange(index, 'term', value)}
                                  options={[ { value: '24', label: '24 Months' }, { value: '36', label: '36 Months' } ]}
                              />
                               <Input
                                  label="Optional Down Payment" type="number" name={`device-downPayment-${index}`}
                                  value={device.downPayment} onChange={(e) => handleDeviceChange(index, 'downPayment', e.target.value)} prefix="$"
                              />
                          </div>
                      </div>
                    </CardContent>
                </Card>
            ))}
             {config.devices.length < config.lines && (
                <button 
                  type="button"
                  onClick={handleAddDevice}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span className="font-semibold">Add Device ({config.devices.length}/{config.lines})</span>
                </button>
            )}
             {config.devices.length === 0 && config.lines > 0 && (
                 <div className="text-center py-4 text-sm text-muted-foreground">
                     No devices added. Click the button above to include hardware in the quote.
                 </div>
            )}
          </div>
      </Section>

      <Section title="Accessories">
          <div className="space-y-4">
              {(config.accessories || []).map((accessory) => {
                  const isFinancingDisabled = remainingFinancingCredit <= 0;
                  return (
                  <Card key={accessory.id} className="overflow-hidden">
                      <CardHeader className="flex justify-between items-center bg-muted/50 p-4">
                          <div className="flex items-center gap-3">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                              <p className="font-semibold text-foreground">Accessory Details</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveAccessory(accessory.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            aria-label={`Remove Accessory`}
                          >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          </button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Accessory Name" type="text" value={accessory.name}
                                onChange={(e) => handleAccessoryChange(accessory.id, 'name', e.target.value)}
                                placeholder="e.g. Case, Charger"
                            />
                            <Input
                                label="Total Price" type="number" value={accessory.price}
                                onChange={(e) => handleAccessoryChange(accessory.id, 'price', e.target.value)}
                                prefix="$"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                          <ButtonGroup
                            label="Payment Option" name={`accessory-payment-${accessory.id}`} value={accessory.paymentType}
                            onChange={(_name, value) => handleAccessoryChange(accessory.id, 'paymentType', value as AccessoryPaymentType)}
                            options={[
                              { value: AccessoryPaymentType.FULL, label: 'Pay in Full' },
                              { 
                                value: AccessoryPaymentType.FINANCED, 
                                label: isFinancingDisabled ? 'Finance (EC Used)' : 'Finance',
                                disabled: isFinancingDisabled,
                              },
                            ]}
                            className="grid-cols-2"
                          />
                          <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                              Quantity
                            </label>
                            <div className="flex items-center justify-between w-full h-12 rounded-xl bg-muted px-2">
                              <button
                                type="button"
                                onClick={() => handleAccessoryQuantityChange(accessory.id, -1)}
                                disabled={(accessory.quantity || 1) <= 1}
                                className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Decrease accessory quantity"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                                </svg>
                              </button>
                              <div className="text-center font-bold text-lg text-foreground w-12">
                                  {accessory.quantity || 1}
                              </div>
                              <button
                                  type="button"
                                  onClick={() => handleAccessoryQuantityChange(accessory.id, 1)}
                                  className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                                  aria-label="Increase accessory quantity"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                                  </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        {accessory.paymentType === AccessoryPaymentType.FINANCED && (
                          <>
                            <hr className="border-border/50" />
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-3">Financing Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Select
                                    label="Financing Term" name={`accessory-term-${accessory.id}`} value={String(accessory.term)}
                                    onChange={(_name, value) => handleAccessoryChange(accessory.id, 'term', value)}
                                    options={[ { value: '12', label: '12 Months' }, { value: '24', label: '24 Months' } ]}
                                  />
                                  <Input
                                      label="Optional Down Payment" type="number" value={accessory.downPayment}
                                      onChange={(e) => handleAccessoryChange(accessory.id, 'downPayment', e.target.value)}
                                      prefix="$"
                                  />
                                </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                  </Card>
                );
              })}
              <button 
                  type="button"
                  onClick={handleAddAccessory}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  <span className="font-semibold">Add Accessory</span>
                </button>
          </div>
      </Section>

      <Section title="Discounts">
        <div className="space-y-3">
          <DiscountOption
            label="AutoPay Discount"
            description={`$${discountSettings.autopay} off per line with AutoPay`}
            name="discounts.autopay"
            checked={config.discounts.autopay}
            onChange={handleInputChange}
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.5 3.75h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" /></svg>}
          />
          {config.customerType === CustomerType.STANDARD && (
            <DiscountOption
              label="Insider Code"
              description={`${discountSettings.insider}% off voice lines`}
              name="discounts.insider"
              checked={config.discounts.insider}
              onChange={handleInputChange}
              icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m9-12v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18" /></svg>}
            />
          )}
          {config.lines >= 3 && (
              <DiscountOption
                  label="3rd Line Free"
                  description={`$${thirdLineFreeDiscountValue} off with 3+ lines`}
                  name="discounts.thirdLineFree"
                  checked={config.discounts.thirdLineFree}
                  onChange={handleInputChange}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.28a3 3 0 00-4.682-2.72 8.986 8.986 0 003.741-.479m7.5 2.28a8.986 8.986 0 01-3.741-.479m3.741.479c-.38.04-.77.082-1.17.112a9.022 9.022 0 01-7.5 0c-.398-.03-.79-.071-1.17-.112m7.5 2.28a9.043 9.043 0 01-1.17.112m0 0c-3.14.34-5.804.996-7.5 0l-3.75 3.75m11.25 0l3.75 3.75M3 3h3.75M3 7.5h3.75m-3.75 4.5h3.75m13.5 4.5h3.75m-3.75-4.5h3.75m-3.75-4.5h3.75M3 16.5h3.75" /></svg>}
              />
          )}
        </div>
      </Section>
    </div>
  );
};

// FIX: Added default export.
export default QuoteForm;
