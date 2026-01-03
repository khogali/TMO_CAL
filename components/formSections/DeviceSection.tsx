import React, { useState, useMemo } from 'react';
import { QuoteConfig, Device, DeviceDatabase, DeviceCategory, ServicePlan, PromotionCategory, TradeInRequirement } from '../../types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import Section from '../ui/Section';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useData } from '../../context/AppContext';
import ButtonGroup from '../ui/ButtonGroup';
import { checkCondition } from '../../utils/conditionUtils';

interface DeviceCardProps {
  device: Device;
  index: number;
  config: QuoteConfig; // Pass full config for condition checking
  onDeviceChange: (index: number, field: keyof Device, value: any) => void;
  onRemove: (id: string) => void;
  deviceDatabase: DeviceDatabase;
  servicePlans: ServicePlan[];
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, index, config, onDeviceChange, onRemove, deviceDatabase, servicePlans }) => {
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
    // BYOD promos might exist, usually Service/BTS promos apply to plans not devices, 
    // but some device promos might be "Bring your own device get X". 
    // For now, assume device promos require a sold device unless configured otherwise.
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


  const getDeviceIcon = (category: DeviceCategory) => {
    switch (category) {
        case DeviceCategory.WATCH: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case DeviceCategory.TABLET: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
        case DeviceCategory.TRACKER: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
        case DeviceCategory.PHONE:
        default: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label="Device Model" name="modelId" value={device.modelId || ''} onChange={(_, v) => onDeviceChange(index, 'modelId', v)} options={filteredDeviceOptions} />
                      <Select label="Variant (Color/Storage)" name="variantSku" value={device.variantSku || ''} onChange={(_, v) => onDeviceChange(index, 'variantSku', v)} options={variantOptions} />
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

  const phones = config.devices.filter(d => d.category === DeviceCategory.PHONE);
  const canAddPhone = phones.length < config.lines;

  return (
    <Section title="Device Pricing" defaultOpen={false} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}>
      <div className="space-y-4">
        {config.devices.map((device, index) => (
          <DeviceCard
            key={device.id}
            device={device}
            index={index}
            config={config}
            onDeviceChange={handleDeviceChange}
            onRemove={handleRemoveDevice}
            deviceDatabase={deviceDatabase}
            servicePlans={servicePlans}
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
