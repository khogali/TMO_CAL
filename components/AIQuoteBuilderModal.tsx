import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/AppContext';
import { QuoteConfig, DeviceCategory, AccessoryPaymentType, Device, Accessory } from '../types';
import { streamQuoteChatResponse } from '../services/geminiApi';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { createInitialConfig } from '../constants';

interface AIQuoteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConfig: (config: QuoteConfig) => void;
  currentConfig: QuoteConfig;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIQuoteBuilderModal: React.FC<AIQuoteBuilderModalProps> = ({ isOpen, onClose, onApplyConfig, currentConfig }) => {
  const { planPricing, servicePlans, promotions } = useData();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I can help you build a quote. Tell me what the customer is looking for (e.g., 'Family of 4 on Go5G Plus with 2 iPhone 15s')." }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [detectedConfig, setDetectedConfig] = useState<Partial<QuoteConfig> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Extract JSON from the AI response
  const parseConfigFromText = (text: string): Partial<QuoteConfig> | null => {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsed = JSON.parse(jsonMatch[1]);
        return parsed;
      }
    } catch (e) {
      // JSON incomplete or invalid
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    setDetectedConfig(null); // Reset detection for new turn

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Create a placeholder for the model's response
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      const stream = streamQuoteChatResponse(
        history, 
        userMessage.text, 
        planPricing, 
        servicePlans, 
        promotions, 
        true // Enable thinking mode for better reasoning
      );

      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: fullResponse };
          return newMessages;
        });
        
        // Try to parse config in real-time
        const config = parseConfigFromText(fullResponse);
        if (config) {
            setDetectedConfig(config);
        }
      }

    } catch (error) {
      console.error("Error generating AI response:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleApply = () => {
    if (!detectedConfig) return;

    // Sanitize and merge the detected config
    const baseConfig = createInitialConfig(planPricing);
    
    // Ensure devices have IDs
    const devices = (detectedConfig.devices || []).map((d: any) => ({
      ...d,
      id: crypto.randomUUID(),
      category: d.servicePlanId ? (servicePlans.find(sp => sp.id === d.servicePlanId)?.deviceCategory || DeviceCategory.WATCH) : DeviceCategory.PHONE,
      tradeInType: 'manual', // Default to manual unless explicitly logic'd otherwise
      appliedPromoId: null,
      tradeIn: d.tradeIn || 0,
      term: d.term || 24, // Default term if not specified
      downPayment: d.downPayment || 0
    })) as Device[];

    // Ensure accessories have IDs
    const accessories = (detectedConfig.accessories || []).map((a: any) => ({
      ...a,
      id: crypto.randomUUID(),
      paymentType: a.paymentType || AccessoryPaymentType.FULL,
      term: a.term || 12,
      downPayment: a.downPayment || 0
    })) as Accessory[];

    const finalConfig: QuoteConfig = {
      ...baseConfig,
      ...detectedConfig,
      // Preserve existing customer info if not overwritten by AI, or overwrite if AI provided it
      customerName: detectedConfig.customerName || currentConfig.customerName || '',
      customerPhone: detectedConfig.customerPhone || currentConfig.customerPhone || '',
      devices,
      accessories,
      // Merge discounts carefully
      discounts: { 
          ...baseConfig.discounts, 
          ...(detectedConfig.discounts || {}) 
      }
    };

    onApplyConfig(finalConfig);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl h-[80vh] flex flex-col bg-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <span className="text-xl">✨</span>
            </div>
            <div>
                <h2 className="text-lg font-bold text-foreground">AI Quote Assistant</h2>
                <p className="text-xs text-muted-foreground">Describe the quote you need.</p>
            </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-card border border-border text-foreground rounded-bl-none'
              }`}
            >
              {/* Hide the JSON block from the visual chat bubble to keep it clean */}
              {msg.text.replace(/```json[\s\S]*?```/g, '✅ Quote generated below.')}
            </div>
          </div>
        ))}
        {isStreaming && (
            <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-none p-4 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Preview */}
      {detectedConfig && (
          <div className="px-4 py-3 bg-green-500/10 border-t border-b border-green-500/20 flex justify-between items-center animate-fade-in-down">
              <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">Quote Ready!</p>
                  <p className="text-xs text-green-600/80 dark:text-green-500/80">
                      {detectedConfig.lines} Line{detectedConfig.lines !== 1 ? 's' : ''} • {planPricing.find(p => p.id === detectedConfig.plan)?.name || detectedConfig.plan} • {(detectedConfig.devices || []).length} Devices
                  </p>
              </div>
              <Button size="sm" onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white border-none shadow-none">
                  Apply Quote
              </Button>
          </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
        >
            <input
                autoFocus
                className="flex-1 bg-muted/50 border-0 rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
                placeholder="Type your request (e.g. '3 lines on Essentials with 3 iPhone 15s')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
            />
            <Button type="submit" disabled={!input.trim() || isStreaming} size="icon" className="w-12 h-12 rounded-xl shrink-0">
                {isStreaming ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5 translate-y-0.5">
                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                )}
            </Button>
        </form>
      </div>
    </Modal>
  );
};

export default AIQuoteBuilderModal;
