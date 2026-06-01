
import React, { useMemo } from 'react';
import { QuoteConfig, Device } from '../../types';
import { useData } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Section from '../ui/Section';
import { InsuranceEngine, InsuranceOption } from '../../utils/insuranceEngine';

interface InsuranceSectionProps {
  config: QuoteConfig;
  setConfig: React.Dispatch<React.SetStateAction<QuoteConfig>>;
}

const DeviceInsuranceRow: React.FC<{
    device: Device;
    index: number;
    onChange: (id: string) => void;
    deviceName: string;
}> = ({ device, index, onChange, deviceName }) => {
    const options = useMemo(() => InsuranceEngine.getOptionsForDevice(device), [device]);
    const selectedId = device.insuranceId || '';

    // If it's a phone, calculate the tier for display
    const tier = device.category === 'Phone' && !device.isByod ? InsuranceEngine.getTier(device.price) : null;

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border border-border rounded-xl shadow-sm gap-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${device.category === 'Phone' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'}`}>
                    {device.category === 'Phone' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{deviceName}</span>
                        {tier && <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">Tier {tier}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">Line {index + 1}</span>
                </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
                <button
                    onClick={() => onChange('')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap
                        ${!selectedId 
                            ? 'bg-muted text-foreground border-transparent shadow-inner' 
                            : 'bg-transparent text-muted-foreground border-border hover:border-gray-400'
                        }`}
                >
                    No Coverage
                </button>
                {options.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center justify-center min-w-[100px]
                            ${selectedId === opt.id
                                ? (opt.type === 'p360' 
                                    ? 'bg-primary text-white border-primary shadow-md ring-2 ring-primary/20' 
                                    : 'bg-foreground text-background border-foreground shadow-md')
                                : 'bg-transparent text-foreground border-border hover:border-primary/50'
                            }
                        `}
                    >
                        <span>{opt.type === 'p360' ? 'P360' : 'Basic'}</span>
                        <span className={`text-[10px] ${selectedId === opt.id ? 'opacity-90' : 'text-muted-foreground'}`}>
                            ${opt.price}/mo
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const InsuranceSection: React.FC<InsuranceSectionProps> = ({ config, setConfig }) => {
  const { deviceDatabase } = useData();

  const getDeviceName = (device: Device) => {
      if (device.isByod) return `BYOD ${device.category}`;
      const model = deviceDatabase.devices.find(d => d.id === device.modelId);
      return model ? model.name : 'Unknown Device';
  }

  // Calculate protection stats
  const totalDevices = config.devices.length;
  const protectedCount = config.devices.filter(d => !!d.insuranceId).length;
  const p360Count = config.devices.filter(d => d.insuranceId === 'p360').length;
  
  const handleDeviceChange = (index: number, insuranceId: string) => {
      setConfig(prev => {
          const newDevices = [...prev.devices];
          newDevices[index] = { ...newDevices[index], insuranceId };
          return { ...prev, devices: newDevices };
      });
  };

  const toggleProtectAll = () => {
      const allProtected = protectedCount === totalDevices;
      setConfig(prev => {
          const newDevices = prev.devices.map(d => ({
              ...d,
              insuranceId: allProtected ? undefined : 'p360' // Default to P360 when applying all
          }));
          return { ...prev, devices: newDevices };
      });
  };

  return (
    <Section 
        title="Protection & Support" 
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>}
    >
      <div className="space-y-6">
        {totalDevices === 0 ? (
            <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">Add devices to configure protection plans.</p>
            </div>
        ) : (
            <>
                {/* Header Summary & Action */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-muted/30 p-4 rounded-xl border border-border/50 gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <svg className="w-full h-full text-muted-foreground/20" viewBox="0 0 36 36">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={protectedCount === totalDevices ? '#10b981' : '#e20074'} strokeWidth="4" strokeDasharray={`${(protectedCount / totalDevices) * 100}, 100`} />
                            </svg>
                            <span className="absolute text-xs font-bold">{Math.round((protectedCount / totalDevices) * 100)}%</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">
                                {protectedCount}/{totalDevices} Devices Protected
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {p360Count} on Protection &lt;360&gt;
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={toggleProtectAll}
                        className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm
                            ${protectedCount === totalDevices 
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80' 
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                    >
                        {protectedCount === totalDevices ? 'Remove All' : 'Protect All'}
                    </button>
                </div>

                {/* Device List */}
                <div className="space-y-3">
                    {config.devices.map((device, index) => (
                        <DeviceInsuranceRow
                            key={device.id}
                            device={device}
                            index={index}
                            deviceName={getDeviceName(device)}
                            onChange={(id) => handleDeviceChange(index, id)}
                        />
                    ))}
                </div>

                {/* Info Footer */}
                <div className="flex gap-4 text-[10px] text-muted-foreground bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-2">
                        <span className="font-bold text-primary shrink-0">P360</span>
                        <span>Includes AppleCare+, JUMP! Upgrades, Unlimited Screen Repairs, Loss & Theft.</span>
                    </div>
                    <div className="w-px bg-blue-200 dark:bg-blue-800 mx-2"></div>
                    <div className="flex items-start gap-2">
                        <span className="font-bold text-foreground shrink-0">Basic</span>
                        <span>Covers mechanical breakdown and accidental damage only. No Loss/Theft.</span>
                    </div>
                </div>
            </>
        )}
      </div>
    </Section>
  );
};

export default InsuranceSection;
