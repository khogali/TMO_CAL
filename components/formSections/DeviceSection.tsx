
import React, { useState, useMemo } from 'react';
import { QuoteConfig, Device, DeviceDatabase, DeviceCategory, ServicePlan, PromotionCategory, TradeInRequirement, Accessory } from '../../types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import Section from '../ui/Section';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useData } from '../../context/AppContext';
import ButtonGroup from '../ui/ButtonGroup';
import { checkCondition } from '../../utils/conditionUtils';
import { DeviceEngine } from '../../utils/deviceEngine';

interface DeviceCardProps {
  device: Device;
  index: number;
  config: QuoteConfig; // Pass full config for condition checking
  onDeviceChange: (index: number, field: keyof Device, value: any) => void;
  onRemove: (id: string) => void;
  onAddAccessories: (accessories: Accessory[]) => void;
  deviceDatabase: DeviceDatabase;
  servicePlans: ServicePlan[];
  engine: DeviceEngine;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, index, config, onDeviceChange, onRemove, onAddAccessories, deviceDatabase, servicePlans, engine }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { promotions, insurancePlans } = useData();
  const isByod = device.isByod || false;

  const filteredDeviceOptions = useMemo(() => {
    const baseOptions = [{ value: '', label: 'Select a device model...' }];
    const categoryDevices = deviceDatabase.devices.filter(d => d.category === device.category);
    
    if (!searchTerm.trim()) {
      return [...baseOptions, ...categoryDevices.map(d => ({ value: d.id, label: `${d.manufacturer} ${d.name}` }))];
    }

    const filtered = categoryDevices
        .filter(d => 
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(d => ({ value: d.id, label: `${d.manufacturer} ${d.name}` }));
    
    return [...baseOptions, ...filtered];
  }, [searchTerm, deviceDatabase.devices, device.category]);

  const selectedModel = deviceDatabase.devices.find(d => d.id === device.modelId);
  const variantOptions = selectedModel ? [{ value: '', label: 'Select a variant...' }, ...selectedModel.variants.map(v => ({ value: v.sku, label: `${v.storage}GB - ${v.color}` }))] : [{ value: '', label: 'Select a model first' }];
  
  const applicableServicePlans = useMemo(() => {
      // Allow service plans for BYOD non-phones or selected non-phone models
      const category = isByod ? device.category : (selectedModel?.category);
      if (!category || category === DeviceCategory.PHONE) return [];
      
      return servicePlans
          .filter(p => p.deviceCategory === category)
          .map(p => ({ value: p.id, label: `${p.name} ($${p.price})`}));
  }, [selectedModel, servicePlans, isByod, device.category]);
  
  // Filter insurance plans based on device category
  const applicableInsurancePlans = useMemo(() => {
      // Use device category directly if BYOD, otherwise use selected model's category
      const category = isByod ? device.category : selectedModel?.category;
      if (!category) return [];

      return insurancePlans
        .filter(p => !p.supportedCategories || p.supportedCategories.includes(category))
        .map(p => ({ value: p.id, label: `${p.name} ($${p.price})` }));
  }, [selectedModel, insurancePlans, isByod, device.category]);

  const availablePromos = useMemo(() => {
    if ((!device.modelId || !selectedModel) && !isByod) return [];
    if (isByod) return []; 
    
    return promotions.filter(promo => {
      if (!promo.isActive || promo.category !== PromotionCategory.DEVICE) return false;
      
      const hasIdMatch = promo.eligibleDeviceIds && promo.eligibleDeviceIds.includes(device.modelId!);
      const hasTagMatch = promo.eligibleDeviceTags && 
                          promo.eligibleDeviceTags.length > 0 && 
                          selectedModel!.tags.some(tag => promo.eligibleDeviceTags!.includes(tag));

      const hasConstraints = (promo.eligibleDeviceIds?.length || 0) > 0 || (promo.eligibleDeviceTags?.length || 0) > 0;
      
      if (hasConstraints && !hasIdMatch && !hasTagMatch) {
          return false;
      }

      return (promo.conditions || []).every(c => checkCondition(config, c));
    }).map(p => ({ value: p.id, label: p.name }));
  }, [promotions, device.modelId, selectedModel, config, isByod]);

  const selectedPromo = useMemo(() => {
    return promotions.find(p => p.id === device.appliedPromoId);
  }, [device.appliedPromoId, promotions]);

  // --- ENGINE RECOMMENDATIONS ---
  const upsellModel = useMemo(() => {
      if (!selectedModel || isByod) return null;
      return engine.getUpsell(selectedModel.id);
  }, [selectedModel, isByod, engine]);

  const handleUpsellClick = () => {
      if (upsellModel) {
          onDeviceChange(index, 'modelId', upsellModel.id);
          // Also reset variant
          onDeviceChange(index, 'variantSku', '');
      }
  };

  const handleAddBundle = () => {
      if (selectedModel) {
          const accessories = engine.getSuggestedAccessories(selectedModel.id);
          onAddAccessories(accessories);
      }
  };

  const getDeviceIcon = (category: DeviceCategory) => {
    switch (category) {
        case DeviceCategory.WATCH: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case DeviceCategory.TABLET: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" /></svg>;
        case DeviceCategory.TRACKER: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
        case DeviceCategory.PHONE:
        default: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
    }
  };

  return (
      <Card>
          <CardHeader className="flex justify-between items-center bg-muted/50 p-4">
              <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{getDeviceIcon(device.category)}</span>
                  <p className="font-semibold text-foreground">Device {index + 1} ({device.category})</p>
              </div>
              <button type="button" onClick={() => onRemove(device.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10" aria-label={`Remove Device ${index + 1}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none">
                      <input 
                          type="checkbox" 
                          checked={isByod} 
                          onChange={(e) => {
                              onDeviceChange(index, 'isByod', e.target.checked);
                              if (e.target.checked) {
                                  onDeviceChange(index, 'modelId', '');
                                  onDeviceChange(index, 'variantSku', '');
                                  onDeviceChange(index, 'price', 0);
                                  onDeviceChange(index, 'tradeIn', 0);
                                  onDeviceChange(index, 'tradeInType', 'manual');
                                  onDeviceChange(index, 'appliedPromoId', null);
                              }
                          }} 
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      Bring Your Own Device
                  </label>
                  {isByod && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Cost: $0</span>}
              </div>

              {!isByod && (
                  <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select label="Device Model" name="modelId" value={device.modelId || ''} onChange={(_, v) => onDeviceChange(index, 'modelId', v)} options={filteredDeviceOptions} />
                          <Select label="Variant (Color/Storage)" name="variantSku" value={device.variantSku || ''} onChange={(_, v) => onDeviceChange(index, 'variantSku', v)} options={variantOptions} />
                      </div>
                      
                      {/* Engine Suggestions */}
                      {selectedModel && (
                          <div className="flex flex-col gap-2">
                              {/* Upsell */}
                              {upsellModel && (
                                  <div onClick={handleUpsellClick} className="cursor-pointer bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2.5 flex items-center justify-between group hover:border-indigo-400 transition-colors">
                                      <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                                          <span className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded">🚀</span>
                                          <span>
                                              <strong>Upgrade:</strong> Get the <strong>{upsellModel.name}</strong> for +${engine.getPriceDifference(selectedModel.id, upsellModel.id).toFixed(2)}/mo
                                          </span>
                                      </div>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                  </div>
                              )}
                              
                              {/* Accessory Bundle */}
                              <button 
                                type="button"
                                onClick={handleAddBundle}
                                className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                  Auto-Add Essentials (Screen & Case)
                              </button>
                          </div>
                      )}
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isByod || (selectedModel && selectedModel.category !== DeviceCategory.PHONE)) && applicableServicePlans.length > 0 && (
                    <Select label="Service Plan" name="servicePlanId" value={device.servicePlanId || ''} onChange={(_, v) => onDeviceChange(index, 'servicePlanId', v)} options={[{value: '', label: 'No Service Plan'}, ...applicableServicePlans]} />
                )}
                {(isByod || selectedModel) && (
                    <Select label="Insurance Protection" name="insuranceId" value={device.insuranceId || ''} onChange={(_, v) => onDeviceChange(index, 'insuranceId', v)} options={[{value: '', label: 'No Protection'}, ...applicableInsurancePlans]} />
                )}
              </div>
              
              {/* --- CARRIER FREEDOM / SWITCHING LOGIC --- */}
              <div className="mt-4 pt-4 border-t border-border/50">
                  <label className="text-sm font-medium flex items-center gap-2 cursor-pointer select-none mb-2">
                      <input 
                          type="checkbox" 
                          checked={(device.competitorOwedAmount || 0) > 0} 
                          onChange={(e) => {
                              onDeviceChange(index, 'competitorOwedAmount', e.target.checked ? 1 : 0);
                              // Reset trade-in if switching (usually mutually exclusive for same line in some flows, but we'll leave flexible)
                          }} 
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="font-bold text-foreground">Switching from Carrier?</span>
                      <span className="text-xs text-muted-foreground">(Owes money on device)</span>
                  </label>
                  
                  {(device.competitorOwedAmount || 0) > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg animate-fade-in-down mb-4">
                          <Input 
                              label="Amount owed to previous carrier" 
                              type="number" 
                              name="competitorOwedAmount" 
                              value={device.competitorOwedAmount} 
                              onChange={(e) => onDeviceChange(index, 'competitorOwedAmount', Number(e.target.value))} 
                              prefix="$" 
                              placeholder="0.00"
                          />
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                              Qualifies for reimbursement via virtual card.
                          </p>
                      </div>
                  )}
              </div>

              {!isByod && (
                  <>
                  <hr className="border-border/50" />
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <ButtonGroup
                      label="Trade-in / Promotion"
                      name="tradeInType"
                      value={device.tradeInType}
                      onChange={(_, v) => onDeviceChange(index, 'tradeInType', v)}
                      options={[
                        { value: 'manual', label: 'Manual Credit' },
                        { value: 'promo', label: 'Select Promotion', disabled: availablePromos.length === 0 },
                      ]}
                      className="grid-cols-2"
                    />
                    
                    {device.tradeInType === 'manual' ? (
                      <div className="mt-4">
                        <Input label="Trade-in Credit Value" type="number" name="tradeIn" value={device.tradeIn} onChange={(e) => onDeviceChange(index, 'tradeIn', e.target.value)} prefix="$" />
                      </div>
                    ) : (
                      <div className="mt-4">
                        <Select label="Available Promotions" name="appliedPromoId" value={device.appliedPromoId || ''} onChange={(_, v) => onDeviceChange(index, 'appliedPromoId', v)} options={[{value: '', label: 'Select a promotion...'}, ...availablePromos]} />
                        {selectedPromo && (
                            <div className="mt-2 text-xs p-2 bg-primary/10 text-primary rounded-md">
                               <p><strong>{selectedPromo.name}:</strong> {selectedPromo.description}</p>
                               {selectedPromo.deviceRequirements?.tradeIn === TradeInRequirement.REQUIRED && (
                                    <Input label="Required Trade-in Value" type="number" name="tradeIn" value={device.tradeIn} onChange={(e) => onDeviceChange(index, 'tradeIn', e.target.value)} prefix="$" className="mt-2"/>
                               )}
                            </div>
                        )}
                      </div>
                    )}
                  </div>
                  <hr className="border-border/50" />
                  <Input label="Optional Down Payment" type="number" name="downPayment" value={device.downPayment} onChange={(e) => onDeviceChange(index, 'downPayment', e.target.value)} prefix="$" />
                  </>
              )}
          </CardContent>
      </Card>
  );
};

// --- MAIN COMPONENT ---
interface DeviceSectionProps {
  mode: 'simple' | 'full';
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
}

const DeviceSection: React.FC<DeviceSectionProps> = ({ config, setConfig }) => {
  const { deviceDatabase, servicePlans } = useData();
  const engine = useMemo(() => new DeviceEngine(deviceDatabase), [deviceDatabase]);

  const handleAddDevice = (category: DeviceCategory) => {
    const defaultModel = deviceDatabase.devices.find(d => d.category === category);
    setConfig(prev => ({
      ...prev,
      devices: [
        ...(prev.devices || []),
        {
          id: crypto.randomUUID(),
          category,
          price: 0,
          tradeIn: 0,
          tradeInType: 'manual',
          appliedPromoId: null,
          term: defaultModel?.defaultTermMonths || 24,
          downPayment: 0,
          isByod: false, // Initialize as false
        },
      ],
    }));
  };

  const handleRemoveDevice = (id: string) => {
    setConfig(prev => ({ ...prev, devices: prev.devices.filter(dev => dev.id !== id) }));
  };

  const handleDeviceChange = (index: number, field: keyof Device, value: any) => {
    setConfig(prev => {
      const newDevices = [...prev.devices];
      const oldDevice = newDevices[index];
      const newDevice = { ...oldDevice, [field]: value };
      
      if (field === 'modelId') {
        const selectedModel = deviceDatabase.devices.find(d => d.id === value);
        if (selectedModel) {
            newDevice.variantSku = '';
            newDevice.price = 0;
            newDevice.term = selectedModel.defaultTermMonths;
            if (selectedModel.category !== DeviceCategory.PHONE) {
                const popularPlan = servicePlans.find(p => p.deviceCategory === selectedModel.category && p.isPopular);
                newDevice.servicePlanId = popularPlan?.id;
            } else {
                newDevice.servicePlanId = undefined;
            }
            // Reset insurance if model changes
            newDevice.insuranceId = undefined; 
        }
      }
      if (field === 'variantSku') {
        const selectedModel = deviceDatabase.devices.find(d => d.id === newDevice.modelId);
        const selectedVariant = selectedModel?.variants.find(v => v.sku === value);
        newDevice.price = selectedVariant?.price || 0;
      }
      if (field === 'tradeInType' && value === 'manual') {
        newDevice.appliedPromoId = null;
      }
      
      newDevices[index] = newDevice;
      return { ...prev, devices: newDevices };
    });
  };

  const handleAddAccessories = (newAccessories: Accessory[]) => {
    setConfig(prev => ({
        ...prev,
        accessories: [...prev.accessories, ...newAccessories]
    }));
  };

  const phones = config.devices.filter(d => d.category === DeviceCategory.PHONE);
  const canAddPhone = phones.length < config.lines;

  return (
    <Section title="Device Pricing" defaultOpen={false} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}>
      <div className="space-y-4">
        {config.devices.map((device, index) => (
          <DeviceCard
            key={device.id}
            device={device}
            index={index}
            config={config}
            onDeviceChange={handleDeviceChange}
            onRemove={handleRemoveDevice}
            onAddAccessories={handleAddAccessories}
            deviceDatabase={deviceDatabase}
            servicePlans={servicePlans}
            engine={engine}
          />
        ))}
        <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleAddDevice(DeviceCategory.PHONE)} disabled={!canAddPhone} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground"><span className="text-xl">📱</span><span className="font-semibold">Add Phone ({phones.length}/{config.lines})</span></button>
            <button type="button" onClick={() => handleAddDevice(DeviceCategory.WATCH)} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"><span className="text-xl">⌚️</span><span className="font-semibold">Add Watch</span></button>
            <button type="button" onClick={() => handleAddDevice(DeviceCategory.TABLET)} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"><span className="text-xl">📟</span><span className="font-semibold">Add Tablet</span></button>
            <button type="button" onClick={() => handleAddDevice(DeviceCategory.TRACKER)} className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"><span className="text-xl">📍</span><span className="font-semibold">Add Tracker</span></button>
        </div>
      </div>
    </Section>
  );
};

export default DeviceSection;
