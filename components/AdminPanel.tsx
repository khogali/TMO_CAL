import React, { useState } from 'react';
import { PlanDetails, InsurancePlan, Promotion, GuidanceItem, CustomerType, PricingModel, PromotionConditionField, PromotionConditionOperator, PromotionEffectType, PromotionCondition, PromotionEffect, GuidancePlacement, GuidanceStyle, GuidanceConditionField, UserProfile, Store, UserRole, GuidanceCondition, TMobileUpgradeData, UpgradeProgram, DeviceModel, DeviceVariant, PromotionCategory, TradeInRequirement, ServicePlan, DeviceCategory, StackingGroup } from '../types';
import { useData, useUI } from '../context/AppContext';
import Input from './ui/Input';
import Select from './ui/Select';
import Toggle from './ui/Toggle';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Modal from './ui/Modal';

type Tab = 'plans' | 'servicePlans' | 'insurance' | 'discounts' | 'promotions' | 'guidance' | 'devices' | 'users' | 'stores' | 'upgrade';

// ManageStoresModal sub-component (now using the Modal component)
const ManageStoresModal: React.FC<{ isOpen: boolean; onClose: () => void; user: UserProfile; allStores: Store[]; onSave: (managedStoreIds: string[]) => void; }> = ({ isOpen, onClose, user, allStores, onSave }) => {
    const [selectedStores, setSelectedStores] = useState<string[]>(user.managedStoreIds || []);
    const handleToggleStore = (storeId: string) => setSelectedStores(prev => prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]);
    const handleSave = () => { onSave(selectedStores); onClose(); };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md bg-card rounded-2xl border border-border">
            <div className="p-4 border-b border-border"><h3 className="font-semibold text-lg">Manage Stores for {user.displayName}</h3></div>
            <div className="p-4 max-h-64 overflow-y-auto space-y-2">
                {allStores.map(store => (
                    <label key={store.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                        <input type="checkbox" checked={selectedStores.includes(store.id)} onChange={() => handleToggleStore(store.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <span className="text-sm font-medium">{store.name}</span>
                    </label>
                ))}
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg bg-muted hover:bg-border">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">Save</button>
            </div>
        </Modal>
    );
};

const AdminPanel: React.FC = () => {
  const {
    planPricing, servicePlans, discountSettings, insurancePlans, promotions, guidanceItems,
    deviceDatabase, allUsers, allStores, upgradeData, handleAdminSave, handleAdminReset
  } = useData();
  const { setIsAdminPanelOpen } = useUI();

  const [activeTab, setActiveTab] = useState<Tab>('plans');
  const [isStoreManagerModalOpen, setIsStoreManagerModalOpen] = useState(false);
  const [editingUserIndex, setEditingUserIndex] = useState<number | null>(null);

  const [settings, setSettings] = useState(() => ({
    plans: JSON.parse(JSON.stringify(planPricing)),
    servicePlans: JSON.parse(JSON.stringify(servicePlans)),
    discounts: { ...discountSettings },
    insurance: JSON.parse(JSON.stringify(insurancePlans)),
    promotions: JSON.parse(JSON.stringify(promotions)),
    guidanceItems: JSON.parse(JSON.stringify(guidanceItems)),
    deviceDatabase: JSON.parse(JSON.stringify(deviceDatabase)),
    users: JSON.parse(JSON.stringify(allUsers)),
    stores: JSON.parse(JSON.stringify(allStores)),
    upgradeData: JSON.parse(JSON.stringify(upgradeData)),
  }));
  
  const onClose = () => setIsAdminPanelOpen(false);

  // ... (keeping existing handler functions exactly as they were for brevity, assume they are preserved)
  // Re-implementing them here just to be safe and complete since I'm replacing the file content.
  
  const handleSave = () => {
    const processedSettings = { ...settings, plans: settings.plans.map((plan: any) => ({ ...plan, tieredPrices: plan.pricingModel === PricingModel.TIERED ? String(plan.tieredPrices).split(',').map(Number).filter(n => !isNaN(n)) : [] })) };
    handleAdminSave(processedSettings);
  };
  
  const handleValueChange = (section: keyof typeof settings | 'deviceDatabase.devices', index: number, field: string, value: any) => {
    setSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        if (section === 'deviceDatabase.devices') {
            newSettings.deviceDatabase.devices[index][field] = value;
        } else {
            newSettings[section][index] = { ...newSettings[section][index], [field]: value };
        }
        return newSettings;
    });
  };

  const handleDeviceVariantChange = (deviceIndex: number, variantIndex: number, field: keyof DeviceVariant, value: any) => {
    setSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        newSettings.deviceDatabase.devices[deviceIndex].variants[variantIndex][field] = value;
        return newSettings;
    });
  };
  
  const handleUpgradeDataChange = (section: keyof TMobileUpgradeData, index: number, field: keyof UpgradeProgram | null, value: string) => {
    setSettings(prev => {
        const newUpgradeData = JSON.parse(JSON.stringify(prev.upgradeData));
        if (field) {
            newUpgradeData[section][index][field] = value;
        } else {
            newUpgradeData[section][index] = value;
        }
        return { ...prev, upgradeData: newUpgradeData };
    });
  };

  const handleRemoveUpgradeDataItem = (section: keyof TMobileUpgradeData, index: number) => {
    setSettings(prev => {
        const newUpgradeData = { ...prev.upgradeData };
        newUpgradeData[section] = (newUpgradeData[section] as any[]).filter((_, i) => i !== index);
        return { ...prev, upgradeData: newUpgradeData };
    });
  };

  const handleAddUpgradeDataItem = (section: keyof TMobileUpgradeData) => {
    setSettings(prev => {
        const newUpgradeData = { ...prev.upgradeData };
        const newItem = section === 'upgradePrograms' 
            ? { name: 'New Program', howItWorks: '', whoIsEligible: '' } 
            : 'New requirement';
        newUpgradeData[section] = [...(newUpgradeData[section] as any[]), newItem];
        return { ...prev, upgradeData: newUpgradeData };
    });
  };

  const handleNestedValueChange = (section: keyof typeof settings, index: number, parentField: string, childField: string, value: any) => {
    setSettings(prev => {
        const newSection = [...(prev[section] as any[])];
        newSection[index] = {
            ...newSection[index],
            [parentField]: {
                ...newSection[index][parentField],
                [childField]: value,
            },
        };
        return { ...prev, [section]: newSection };
    });
  };

  const handleBogoChange = (index: number, field: string, value: any) => {
      setSettings(prev => {
          const newPromos = [...prev.promotions];
          const currentPromo = newPromos[index];
          if (!currentPromo.bogoConfig) {
              currentPromo.bogoConfig = { buyQuantity: 2, discountTarget: 'lowest_price' };
          }
          if (field === 'enabled') {
              if (!value) delete currentPromo.bogoConfig;
          } else {
              currentPromo.bogoConfig = { ...currentPromo.bogoConfig, [field]: value };
          }
          return { ...prev, promotions: newPromos };
      });
  };

  const handleNestedChange = (section: keyof typeof settings, pIndex: number, nestedKey: 'conditions' | 'effects', nIndex: number, field: string, value: any) => setSettings(prev => {
    const newSection = JSON.parse(JSON.stringify(prev[section]));
    newSection[pIndex][nestedKey][nIndex] = { ...newSection[pIndex][nestedKey][nIndex], [field]: value };
    return { ...prev, [section]: newSection };
  });
  const handleAddItem = (section: keyof typeof settings | 'deviceDatabase.devices', newItem: any) => {
    setSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        if (section === 'deviceDatabase.devices') {
            newSettings.deviceDatabase.devices.push(newItem);
        } else {
            newSettings[section].push(newItem);
        }
        return newSettings;
    });
  };
  const handleRemoveItem = (section: keyof typeof settings | 'deviceDatabase.devices', index: number) => {
    if (section === 'users' && !window.confirm(`Are you sure you want to remove user: ${settings.users[index].displayName}? This will remove their profile.`)) return;
    setSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        if (section === 'deviceDatabase.devices') {
            newSettings.deviceDatabase.devices.splice(index, 1);
        } else {
            (newSettings[section] as any[]).splice(index, 1);
        }
        return newSettings;
    });
  };
  const handleAddDeviceVariant = (deviceIndex: number) => {
    setSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        newSettings.deviceDatabase.devices[deviceIndex].variants.push({ sku: `SKU-${Date.now()}`, storage: 128, color: 'New Color', price: 0 });
        return newSettings;
    });
  };
  const handleRemoveDeviceVariant = (deviceIndex: number, variantIndex: number) => {
    setSettings(prev => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        newSettings.deviceDatabase.devices[deviceIndex].variants.splice(variantIndex, 1);
        return newSettings;
    });
  };
  const handleRemoveNestedItem = (section: keyof typeof settings, pIndex: number, nestedKey: 'conditions' | 'effects', nIndex: number) => setSettings(prev => {
    const newSection = JSON.parse(JSON.stringify(prev[section]));
    newSection[pIndex][nestedKey] = newSection[pIndex][nestedKey].filter((_: any, i: number) => i !== nIndex);
    return { ...prev, [section]: newSection };
  });
  const handleAddNestedItem = (section: keyof typeof settings, pIndex: number, nestedKey: 'conditions' | 'effects', newItem: any) => setSettings(prev => {
    const newSection = JSON.parse(JSON.stringify(prev[section]));
    newSection[pIndex][nestedKey].push(newItem);
    return { ...prev, [section]: newSection };
  });
  
  const TabButton: React.FC<{ tab: Tab, label: string }> = ({ tab, label }) => <button onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors w-full text-left ${activeTab === tab ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:bg-border'}`}>{label}</button>;

  const renderConditionValueInput = (itemType: 'promotions' | 'guidanceItems', itemIndex: number, condIndex: number) => {
        const condition = settings[itemType][itemIndex].conditions[condIndex];
        const field = condition.field;

        const commonProps = {
            label: 'Value',
            name: "val",
            value: condition.value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange(itemType, itemIndex, 'conditions', condIndex, 'value', e.target.value)
        };
        
        const commonSelectProps = {
            label: 'Value',
            value: condition.value,
            onChange: (_: string, v: string) => handleNestedChange(itemType, itemIndex, 'conditions', condIndex, 'value', v)
        }

        switch (field) {
            case PromotionConditionField.PLAN:
            case GuidanceConditionField.PLAN:
                return <Select {...commonSelectProps} name="plan_select" options={settings.plans.map((p: PlanDetails) => ({ value: p.id, label: p.name }))} />;
            case PromotionConditionField.CUSTOMER_TYPE:
            case GuidanceConditionField.CUSTOMER_TYPE:
                 return <Select {...commonSelectProps} name="customer_type_select" options={Object.values(CustomerType).map(ct => ({ value: ct, label: ct }))} />;
            default:
                return <Input {...commonProps} />;
        }
    };

  const renderContent = () => {
    switch (activeTab) {
        case 'plans': return (<div className="space-y-4">{settings.plans.map((plan: PlanDetails, index: number) => (<Card key={plan.id || index}><CardHeader className="flex justify-between items-center"><CardTitle>{plan.name || 'New Plan'}</CardTitle><button onClick={() => handleRemoveItem('plans', index)} className="text-sm font-semibold text-red-500 hover:text-red-700">Remove</button></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="ID" name={`plan-id-${index}`} value={plan.id} onChange={e => handleValueChange('plans', index, 'id', e.target.value)} /><Input label="Name" name={`plan-name-${index}`} value={plan.name} onChange={e => handleValueChange('plans', index, 'name', e.target.value)} /><Select label="Pricing Model" name={`plan-model-${index}`} value={plan.pricingModel} onChange={(_, v) => handleValueChange('plans', index, 'pricingModel', v)} options={Object.values(PricingModel).map(m => ({ value: m, label: m }))} />{plan.pricingModel === PricingModel.TIERED ? (<Input label="Tiered Prices (comma-sep)" name={`plan-tiered-${index}`} value={(plan.tieredPrices || []).join(',')} onChange={e => handleValueChange('plans', index, 'tieredPrices', e.target.value)} />) : (<><Input label="First Line Price" name={`plan-first-${index}`} type="number" value={plan.firstLinePrice || 0} onChange={e => handleValueChange('plans', index, 'firstLinePrice', Number(e.target.value))} /><Input label="Additional Line Price" name={`plan-add-${index}`} type="number" value={plan.additionalLinePrice || 0} onChange={e => handleValueChange('plans', index, 'additionalLinePrice', Number(e.target.value))} /></>)}<Input label="Max Lines" name={`plan-max-${index}`} type="number" value={plan.maxLines} onChange={e => handleValueChange('plans', index, 'maxLines', Number(e.target.value))} /><Input label="Features (comma-sep)" name={`plan-feat-${index}`} value={(plan.features || []).join(',')} onChange={e => handleValueChange('plans', index, 'features', e.target.value.split(',').map(s => s.trim()))} className="md:col-span-2" /></div><div className="pt-4 border-t border-border"><label className="block text-sm font-medium text-muted-foreground mb-2">Available For</label><div className="flex flex-wrap gap-x-4 gap-y-2">{Object.values(CustomerType).map(type => (<label key={type} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(plan.availableFor || []).includes(type)} onChange={e => { const current = plan.availableFor || []; const newTypes = e.target.checked ? [...current, type] : current.filter(t => t !== type); handleValueChange('plans', index, 'availableFor', newTypes); }} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />{type}</label>))}</div></div><div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4"><Toggle label="Taxes Included" name={`plan-tax-${index}`} checked={plan.taxesIncluded} onChange={e => handleValueChange('plans', index, 'taxesIncluded', e.target.checked)} /><Toggle label="Insider Eligible" name={`plan-insider-${index}`} checked={plan.allowedDiscounts?.insider || false} onChange={e => handleNestedValueChange('plans', index, 'allowedDiscounts', 'insider', e.target.checked)} /><Toggle label="3rd Line Free Eligible" name={`plan-3rd-${index}`} checked={plan.allowedDiscounts?.thirdLineFree || false} onChange={e => handleNestedValueChange('plans', index, 'allowedDiscounts', 'thirdLineFree', e.target.checked)} /></div></CardContent></Card>))}<button onClick={() => handleAddItem('plans', { id: `new-plan-${Date.now()}`, name: 'New Plan', pricingModel: PricingModel.TIERED, tieredPrices: [], maxLines: 12, availableFor: [CustomerType.STANDARD], taxesIncluded: true, features: [], allowedDiscounts: { insider: true, thirdLineFree: true } })} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">Add Plan</button></div>);
        case 'servicePlans': return (<div className="space-y-4">{settings.servicePlans.map((plan: ServicePlan, index: number) => (<Card key={plan.id || index}><CardHeader className="flex justify-between items-center"><CardTitle>{plan.name}</CardTitle><button onClick={() => handleRemoveItem('servicePlans', index)} className="text-sm font-semibold text-red-500 hover:text-red-700">Remove</button></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="ID" name={`sp-id-${index}`} value={plan.id} onChange={e => handleValueChange('servicePlans', index, 'id', e.target.value)} /><Input label="Name" name={`sp-name-${index}`} value={plan.name} onChange={e => handleValueChange('servicePlans', index, 'name', e.target.value)} /><Input label="Price" name={`sp-price-${index}`} type="number" value={plan.price} onChange={e => handleValueChange('servicePlans', index, 'price', Number(e.target.value))} /><Select name="deviceCategory" label="Device Category" value={plan.deviceCategory} onChange={(_, v) => handleValueChange('servicePlans', index, 'deviceCategory', v)} options={Object.values(DeviceCategory).filter(c => c !== DeviceCategory.PHONE).map(t => ({ value: t, label: t }))} /><Input label="Features (comma-sep)" name={`sp-features-${index}`} value={(plan.features || []).join(',')} onChange={e => handleValueChange('servicePlans', index, 'features', e.target.value.split(',').map(s => s.trim()))} className="col-span-2" /><Toggle label="Is Popular" name={`sp-popular-${index}`} checked={plan.isPopular || false} onChange={e => handleValueChange('servicePlans', index, 'isPopular', e.target.checked)} /></CardContent></Card>))}<button onClick={() => handleAddItem('servicePlans', { id: `new-service-plan-${Date.now()}`, name: 'New Service Plan', price: 10, deviceCategory: DeviceCategory.WATCH, features: [], isPopular: false })} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">Add Service Plan</button></div>);
        case 'insurance': return (<div className="space-y-4">{settings.insurance.map((plan: InsurancePlan, index: number) => (<Card key={plan.id || index}><CardHeader className="flex justify-between items-center"><CardTitle>{plan.name}</CardTitle><button onClick={() => handleRemoveItem('insurance', index)} className="text-sm font-semibold text-red-500 hover:text-red-700">Remove</button></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4"><Input label="ID" name={`ins-id-${index}`} value={plan.id} onChange={e => handleValueChange('insurance', index, 'id', e.target.value)} /><Input label="Name" name={`ins-name-${index}`} value={plan.name} onChange={e => handleValueChange('insurance', index, 'name', e.target.value)} /><Input label="Price" name={`ins-price-${index}`} type="number" value={plan.price} onChange={e => handleValueChange('insurance', index, 'price', Number(e.target.value))} /></CardContent></Card>))}<button onClick={() => handleAddItem('insurance', { id: `new-ins-${Date.now()}`, name: 'New Insurance', price: 15 })} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">Add Insurance</button></div>);
        case 'discounts': return (<Card><CardHeader><CardTitle>Discount Settings</CardTitle></CardHeader><CardContent className="space-y-4 max-w-sm"><Input label="Autopay Discount per Line ($)" name="autopay" type="number" value={settings.discounts.autopay} onChange={e => setSettings(p => ({ ...p, discounts: { ...p.discounts, autopay: Number(e.target.value) } }))} /><Input label="Insider Discount (%)" name="insider" type="number" value={settings.discounts.insider} onChange={e => setSettings(p => ({ ...p, discounts: { ...p.discounts, insider: Number(e.target.value) } }))} /></CardContent></Card>);
        case 'promotions':
        case 'guidance':
            const isPromo = activeTab === 'promotions';
            const items = isPromo ? settings.promotions : settings.guidanceItems;
            const sectionKey = isPromo ? 'promotions' : 'guidanceItems';
            const conditionFields = isPromo ? PromotionConditionField : GuidanceConditionField;
            return (<div className="space-y-4">{items.map((item: Promotion | GuidanceItem, index: number) => (<Card key={item.id}><CardHeader className="flex justify-between items-center"><CardTitle>{(item as any).name || (item as any).title || 'New Item'}</CardTitle><button onClick={() => handleRemoveItem(sectionKey, index)} className="text-sm font-semibold text-red-500 hover:text-red-700">Remove</button></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Input label={isPromo ? "Promo Name" : "Title"} name={`item-name-${index}`} value={(item as any).name || (item as any).title} onChange={e => handleValueChange(sectionKey, index, isPromo ? 'name' : 'title', e.target.value)} />{isPromo && <Select name="category" label="Category" value={(item as Promotion).category} onChange={(_, v) => handleValueChange(sectionKey, index, 'category', v)} options={Object.values(PromotionCategory).map(c => ({ value: c, label: c }))} />}<Toggle label="Is Active" name={`item-active-${index}`} checked={item.isActive} onChange={e => handleValueChange(sectionKey, index, 'isActive', e.target.checked)} /></div>{isPromo && <Toggle label="Spotlight on Home" name={`item-spotlight-${index}`} checked={(item as Promotion).spotlightOnHome || false} onChange={e => handleValueChange(sectionKey, index, 'spotlightOnHome', e.target.checked)} />}{isPromo ? <Input label="Description" name={`item-desc-${index}`} value={(item as Promotion).description} onChange={e => handleValueChange(sectionKey, index, 'description', e.target.value)} /> : <Input label="Message" name={`item-msg-${index}`} value={(item as GuidanceItem).message} onChange={e => handleValueChange(sectionKey, index, 'message', e.target.value)} />}{!isPromo && <Select name="placement" label="Placement" value={(item as GuidanceItem).placement} onChange={(_, v) => handleValueChange(sectionKey, index, 'placement', v)} options={Object.values(GuidancePlacement).map(p => ({ value: p, label: p }))} />}{!isPromo && <Select name="style" label="Style" value={(item as GuidanceItem).style} onChange={(_, v) => handleValueChange(sectionKey, index, 'style', v)} options={Object.values(GuidanceStyle).map(s => ({ value: s, label: s }))} />}{isPromo && (item as Promotion).category === PromotionCategory.DEVICE && (<div className="pt-4 border-t border-border"><h4 className="font-semibold text-sm mb-2">Device Requirements</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 bg-muted/50 rounded-lg"><Select label="Trade-in Policy" name="tradeIn" value={(item as Promotion).deviceRequirements?.tradeIn || TradeInRequirement.OPTIONAL} onChange={(_, v) => handleNestedValueChange(sectionKey, index, 'deviceRequirements', 'tradeIn', v)} options={Object.values(TradeInRequirement).map(t => ({ value: t, label: t }))} /><Toggle label="Port-in Required" name={`item-portin-${index}`} checked={(item as Promotion).deviceRequirements?.portInRequired || false} onChange={e => handleNestedValueChange(sectionKey, index, 'deviceRequirements', 'portInRequired', e.target.checked)} /><Toggle label="New Line Required" name={`item-newline-${index}`} checked={(item as Promotion).deviceRequirements?.newLineRequired || false} onChange={e => handleNestedValueChange(sectionKey, index, 'deviceRequirements', 'newLineRequired', e.target.checked)} />
            <div className="md:col-span-3 mt-2"><label className="block text-sm font-medium text-muted-foreground mb-2">Eligible Device Tags (comma-separated)</label><Input label="" name={`item-tags-${index}`} value={((item as Promotion).eligibleDeviceTags || []).join(', ')} onChange={e => handleValueChange(sectionKey, index, 'eligibleDeviceTags', e.target.value.split(',').map(s => s.trim()))} placeholder="e.g. flagship, apple, 5g" /></div>
            </div></div>)}
            {isPromo && (
                <>
                <div className="pt-2">
                    <Select label="Stacking Group" name="stackingGroup" value={(item as Promotion).stackingGroup || StackingGroup.OPEN} onChange={(_, v) => handleValueChange(sectionKey, index, 'stackingGroup', v)} options={Object.values(StackingGroup).map(g => ({ value: g, label: g }))} />
                </div>
                <div className="pt-2 border-t border-border">
                    <Toggle label="Is BOGO?" name={`item-bogo-${index}`} checked={!!(item as Promotion).bogoConfig} onChange={e => handleBogoChange(index, 'enabled', e.target.checked)} />
                    {(item as Promotion).bogoConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                            <Input label="Buy Quantity" name={`bogo-buy-${index}`} type="number" value={(item as Promotion).bogoConfig?.buyQuantity || 2} onChange={e => handleBogoChange(index, 'buyQuantity', Number(e.target.value))} />
                            <Select label="Discount Target" name={`bogo-target-${index}`} value={(item as Promotion).bogoConfig?.discountTarget || 'lowest_price'} onChange={(_, v) => handleBogoChange(index, 'discountTarget', v)} options={[{ value: 'lowest_price', label: 'Lowest Price Device' }]} />
                        </div>
                    )}
                </div>
                </>
            )}
            <div className="pt-2"><h4 className="font-semibold text-sm mb-2">Conditions <span className="text-muted-foreground font-normal">(All must be true)</span></h4>{(item.conditions as Array<PromotionCondition | GuidanceCondition>).map((cond, cIndex) => (<div key={cond.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end mb-2 p-2 bg-muted/50 rounded-lg"><Select label="Field" name={`cond-field-${cIndex}`} value={cond.field} onChange={(_, v) => handleNestedChange(sectionKey, index, 'conditions', cIndex, 'field', v)} options={Object.values(conditionFields).map(f => ({ value: f, label: f }))} /><Select label="Operator" name={`cond-op-${cIndex}`} value={cond.operator} onChange={(_, v) => handleNestedChange(sectionKey, index, 'conditions', cIndex, 'operator', v)} options={Object.values(PromotionConditionOperator).map(o => ({ value: o, label: o }))} /><div>{renderConditionValueInput(sectionKey, index, cIndex)}</div><button onClick={() => handleRemoveNestedItem(sectionKey, index, 'conditions', cIndex)} className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 h-10">Remove</button></div>))}<button onClick={() => handleAddNestedItem(sectionKey, index, 'conditions', { id: `c-${Date.now()}`, field: conditionFields.PLAN, operator: PromotionConditionOperator.EQUALS, value: '' })} className="text-sm font-semibold text-primary hover:underline">+ Add Condition</button></div>{isPromo && (<div className="pt-2"><h4 className="font-semibold text-sm mb-2">Effects</h4>{(item as Promotion).effects.map((eff: PromotionEffect, eIndex: number) => (<div key={eff.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end mb-2 p-2 bg-muted/50 rounded-lg"><Select label="Type" name={`eff-type-${eIndex}`} value={eff.type} onChange={(_, v) => handleNestedChange(sectionKey, index, 'effects', eIndex, 'type', v)} options={Object.values(PromotionEffectType).map(t => ({ value: t, label: t }))} /><Input label="Value" name={`eff-val-${eIndex}`} type="number" value={eff.value} onChange={e => handleNestedChange(sectionKey, index, 'effects', eIndex, 'value', Number(e.target.value))} /><button onClick={() => handleRemoveNestedItem(sectionKey, index, 'effects', eIndex)} className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 h-10">Remove</button></div>))}<button onClick={() => handleAddNestedItem(sectionKey, index, 'effects', { id: `e-${Date.now()}`, type: PromotionEffectType.PLAN_DISCOUNT_FIXED, value: 0 })} className="text-sm font-semibold text-primary hover:underline">+ Add Effect</button></div>)}</CardContent></Card>))}<button onClick={() => handleAddItem(sectionKey, isPromo ? { id: `p-${Date.now()}`, name: 'New Promo', description: '', isActive: true, category: PromotionCategory.PLAN, stackingGroup: StackingGroup.OPEN, conditions: [], effects: [], deviceRequirements: { tradeIn: TradeInRequirement.OPTIONAL, portInRequired: false, newLineRequired: false }, cannotBeCombinedWith: {} } : { id: `g-${Date.now()}`, title: 'New Guidance', message: '', placement: GuidancePlacement.HOME_PAGE, style: GuidanceStyle.INFO, isActive: true, conditions: [] })} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">Add {isPromo ? 'Promotion' : 'Guidance'}</button></div>);
        case 'devices': return (<div className="space-y-6"><Card><CardHeader><CardTitle>Manage Devices</CardTitle></CardHeader><CardContent className="space-y-4">{settings.deviceDatabase.devices.map((device: DeviceModel, index: number) => (<Card key={device.id}><CardHeader className="flex justify-between items-center"><CardTitle>{device.name || 'New Device'}</CardTitle><button onClick={() => handleRemoveItem('deviceDatabase.devices', index)} className="text-sm font-semibold text-red-500 hover:text-red-700">Remove</button></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="ID" name={`dev-id-${index}`} value={device.id} onChange={e => handleValueChange('deviceDatabase.devices', index, 'id', e.target.value)} /><Input label="Name" name={`dev-name-${index}`} value={device.name} onChange={e => handleValueChange('deviceDatabase.devices', index, 'name', e.target.value)} /><Input label="Manufacturer" name={`dev-mfg-${index}`} value={device.manufacturer} onChange={e => handleValueChange('deviceDatabase.devices', index, 'manufacturer', e.target.value)} /><Select label="Category" name={`device-category-${index}`} value={device.category} onChange={(_, v) => handleValueChange('deviceDatabase.devices', index, 'category', v)} options={Object.values(DeviceCategory).map(c => ({ value: c, label: c }))} /><Input label="Tags (comma-separated)" name={`dev-tags-${index}`} value={(device.tags || []).join(', ')} onChange={e => handleValueChange('deviceDatabase.devices', index, 'tags', e.target.value.split(',').map(s => s.trim()))} /><Input label="Default Term (Months)" name={`dev-term-${index}`} type="number" value={device.defaultTermMonths} onChange={e => handleValueChange('deviceDatabase.devices', index, 'defaultTermMonths', Number(e.target.value))} /><Input label="What's in the Box (comma-sep)" name={`dev-box-${index}`} value={(device.whatsInTheBox || []).join(', ')} onChange={e => handleValueChange('deviceDatabase.devices', index, 'whatsInTheBox', e.target.value.split(',').map(s => s.trim()))} /></div><div className="pt-4 border-t border-border"><h4 className="font-semibold text-sm mb-2">Variants (SKUs)</h4><div className="space-y-2">{device.variants.map((variant, vIndex) => (<div key={variant.sku} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end p-2 bg-muted/50 rounded-lg"><Input label="SKU" name={`var-sku-${index}-${vIndex}`} value={variant.sku} onChange={e => handleDeviceVariantChange(index, vIndex, 'sku', e.target.value)} /><Input label="Storage (GB)" name={`var-storage-${index}-${vIndex}`} type="number" value={variant.storage} onChange={e => handleDeviceVariantChange(index, vIndex, 'storage', Number(e.target.value))} /><Input label="Color" name={`var-color-${index}-${vIndex}`} value={variant.color} onChange={e => handleDeviceVariantChange(index, vIndex, 'color', e.target.value)} /><Input label="Price" name={`var-price-${index}-${vIndex}`} type="number" value={variant.price} onChange={e => handleDeviceVariantChange(index, vIndex, 'price', Number(e.target.value))} /><button onClick={() => handleRemoveDeviceVariant(index, vIndex)} className="h-10 px-3 text-sm font-semibold rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20">Remove</button></div>))}</div><button onClick={() => handleAddDeviceVariant(index)} className="text-sm font-semibold text-primary hover:underline pt-2">+ Add Variant</button></div></CardContent></Card>))}<button onClick={() => handleAddItem('deviceDatabase.devices', { id: `device-${Date.now()}`, name: 'New Device', manufacturer: '', category: DeviceCategory.PHONE, variants: [], tags: [], defaultTermMonths: 24 })} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">Add Device</button></CardContent></Card></div>);
        case 'users': return (<div className="space-y-4">{settings.users.map((user: UserProfile, index: number) => (<Card key={user.uid}><CardHeader><CardTitle>{user.displayName}</CardTitle><p className="text-sm text-muted-foreground">{user.email}</p></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Input label="Display Name" name={`user-name-${index}`} value={user.displayName} onChange={e => handleValueChange('users', index, 'displayName', e.target.value)} /><Input label="Phone Number" name={`user-phone-${index}`} value={user.phoneNumber} onChange={e => handleValueChange('users', index, 'phoneNumber', e.target.value)} /><Select name="role" label="Role" value={user.role} onChange={(_, v) => handleValueChange('users', index, 'role', v)} options={Object.values(UserRole).map(r => ({ value: r, label: r }))} /><Select name="storeId" label="Store" value={user.storeId || ''} onChange={(_, v) => handleValueChange('users', index, 'storeId', v)} options={[{ value: '', label: 'Unassigned' }, ...settings.stores.map((s: Store) => ({ value: s.id, label: s.name }))]} /></div>{user.role === UserRole.DISTRICT_MANAGER && <button onClick={() => { setEditingUserIndex(index); setIsStoreManagerModalOpen(true); }} className="text-sm font-semibold text-primary hover:underline">Manage Stores ({user.managedStoreIds?.length || 0})</button>}</CardContent><div className="p-4 border-t border-border flex justify-end"><button onClick={() => handleRemoveItem('users', index)} className="text-sm font-semibold text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-md">Remove User</button></div></Card>))}{isStoreManagerModalOpen && editingUserIndex !== null && <ManageStoresModal isOpen={isStoreManagerModalOpen} onClose={() => setIsStoreManagerModalOpen(false)} user={settings.users[editingUserIndex]} allStores={settings.stores} onSave={ids => handleValueChange('users', editingUserIndex, 'managedStoreIds', ids)} />}</div>);
        case 'stores': return (<div className="space-y-4">{settings.stores.map((store: Store, index: number) => (<Card key={store.id}><CardContent className="flex items-center gap-4"><Input label="ID" name={`store-id-${index}`} value={store.id} onChange={e => handleValueChange('stores', index, 'id', e.target.value)} /><Input label="Name" name={`store-name-${index}`} value={store.name} onChange={e => handleValueChange('stores', index, 'name', e.target.value)} /><button onClick={() => handleRemoveItem('stores', index)} className="mt-8 px-3 py-2 text-sm font-semibold rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 h-10">Remove</button></CardContent></Card>))}<button onClick={() => handleAddItem('stores', { id: `store-${Date.now()}`, name: 'New Store' })} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white">Add Store</button></div>);
        case 'upgrade': return (<div className="space-y-4"><Card><CardHeader><CardTitle>Upgrade Programs</CardTitle></CardHeader><CardContent className="space-y-4">{settings.upgradeData.upgradePrograms.map((program: UpgradeProgram, index: number) => (<div key={index} className="p-4 border border-border rounded-lg space-y-3"><div className="flex justify-between items-center"><Input label="Program Name" name={`up-prog-name-${index}`} value={program.name} onChange={e => handleUpgradeDataChange('upgradePrograms', index, 'name', e.target.value)} /><button onClick={() => handleRemoveUpgradeDataItem('upgradePrograms', index)} className="mt-8 ml-4 text-sm font-semibold text-red-500 hover:text-red-700">Remove</button></div><div><label className="block text-sm font-medium text-muted-foreground mb-2">How it Works</label><textarea value={program.howItWorks} onChange={e => handleUpgradeDataChange('upgradePrograms', index, 'howItWorks', e.target.value)} rows={3} className="w-full rounded-md border-input bg-background p-2 text-sm" /></div><div><label className="block text-sm font-medium text-muted-foreground mb-2">Who is Eligible</label><textarea value={program.whoIsEligible} onChange={e => handleUpgradeDataChange('upgradePrograms', index, 'whoIsEligible', e.target.value)} rows={2} className="w-full rounded-md border-input bg-background p-2 text-sm" /></div></div>))}<button onClick={() => handleAddUpgradeDataItem('upgradePrograms')} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary/10 text-primary">Add Program</button></CardContent></Card><Card><CardHeader><CardTitle>Trade-in Requirements</CardTitle></CardHeader><CardContent className="space-y-2">{settings.upgradeData.tradeInRequirements.map((req: string, index: number) => (<div key={index} className="flex items-center gap-2"><Input label="" name={`up-trade-${index}`} value={req} onChange={e => handleUpgradeDataChange('tradeInRequirements', index, null, e.target.value)} className="flex-grow" /><button onClick={() => handleRemoveUpgradeDataItem('tradeInRequirements', index)} className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 h-10">Remove</button></div>))}<button onClick={() => handleAddUpgradeDataItem('tradeInRequirements')} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary/10 text-primary">Add Requirement</button></CardContent></Card><Card><CardHeader><CardTitle>Credit Application Info</CardTitle></CardHeader><CardContent className="space-y-2">{settings.upgradeData.creditApplicationInfo.map((info: string, index: number) => (<div key={index} className="flex items-center gap-2"><Input label="" name={`up-credit-${index}`} value={info} onChange={e => handleUpgradeDataChange('creditApplicationInfo', index, null, e.target.value)} className="flex-grow" /><button onClick={() => handleRemoveUpgradeDataItem('creditApplicationInfo', index)} className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 h-10">Remove</button></div>))}<button onClick={() => handleAddUpgradeDataItem('creditApplicationInfo')} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary/10 text-primary">Add Info</button></CardContent></Card></div>);
        default: return null;
    }
  };


  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-5xl bg-card rounded-3xl border border-border h-[90vh]">
      <div className="p-4 sm:p-5 border-b border-border flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-bold text-foreground">Admin Panel</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="flex-grow flex overflow-hidden">
        <div className="w-56 flex-shrink-0 bg-muted/50 border-r border-border p-3 overflow-y-auto">
           <div className="flex flex-col items-stretch gap-2">
               <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuration</p>
               <TabButton tab="plans" label="Voice Plans" /><TabButton tab="servicePlans" label="Service Plans" /><TabButton tab="insurance" label="Insurance" /><TabButton tab="discounts" label="Discounts" /><TabButton tab="promotions" label="Promotions" /><TabButton tab="guidance" label="Guidance & News" /><TabButton tab="devices" label="Devices" /><TabButton tab="upgrade" label="Upgrade Info" />
               <p className="px-3 pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</p>
               <TabButton tab="users" label="Users & Roles" /><TabButton tab="stores" label="Stores" />
           </div>
        </div>
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-background">{renderContent()}</div>
      </div>
      <div className="p-4 bg-card border-t border-border flex justify-between items-center flex-shrink-0">
          <button onClick={handleAdminReset} className="px-4 py-2 rounded-lg text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20">Reset to Defaults</button>
          <div className="flex items-center gap-3">
               <button onClick={onClose} className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-muted hover:bg-border">Cancel</button>
               <button onClick={handleSave} className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-pink-700">Save Settings</button>
          </div>
      </div>
    </Modal>
  );
};

export default AdminPanel;