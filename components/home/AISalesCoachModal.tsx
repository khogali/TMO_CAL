
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData, useAuth } from '../../context/AppContext';
import { streamCoachingResponse } from '../../services/geminiApi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { LeadStatus } from '../../types';

interface AISalesCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AISalesCoachModal: React.FC<AISalesCoachModalProps> = ({ isOpen, onClose }) => {
  const { visibleLeads, promotions, planPricing } = useData();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRoleplayMode, setIsRoleplayMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // New State for Features
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedPersona, setSelectedPersona] = useState<string>('Skeptical Customer');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Speech Recognition Setup
  useEffect(() => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event: any) => {
              const transcript = event.results[0][0].transcript;
              setInput(prev => prev ? `${prev} ${transcript}` : transcript);
              setIsListening(false);
          };

          recognitionRef.current.onerror = (event: any) => {
              console.error("Speech recognition error", event.error);
              setIsListening(false);
          };

          recognitionRef.current.onend = () => {
              setIsListening(false);
          };
      }
  }, []);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          try {
              recognitionRef.current?.start();
              setIsListening(true);
          } catch (e) {
              console.error("Mic start error", e);
          }
      }
  };

  // Calculate Metrics & Context Data
  const contextData = useMemo(() => {
      const myLeads = visibleLeads.filter(l => l.assignedToUid === user?.uid);
      const won = myLeads.filter(l => l.status === LeadStatus.CLOSED_WON).length;
      const closed = myLeads.filter(l => l.status === LeadStatus.CLOSED_WON || l.status === LeadStatus.CLOSED_LOST).length;
      const winRate = closed > 0 ? Math.round((won / closed) * 100) + '%' : 'N/A';
      const openLeads = myLeads.filter(l => l.status !== LeadStatus.CLOSED_WON && l.status !== LeadStatus.CLOSED_LOST).length;
      
      const now = Date.now();
      const staleLeads = myLeads
        .filter(l => l.status !== LeadStatus.CLOSED_WON && l.status !== LeadStatus.CLOSED_LOST)
        .map(l => ({
            name: l.customerName || 'Unnamed',
            status: l.status,
            daysInactive: Math.floor((now - l.updatedAt) / (1000 * 60 * 60 * 24))
        }))
        .filter(l => l.daysInactive >= 3)
        .sort((a, b) => b.daysInactive - a.daysInactive)
        .slice(0, 5);

      const focusLead = selectedLeadId ? myLeads.find(l => l.id === selectedLeadId) : undefined;

      return {
          metrics: { winRate, totalLeads: myLeads.length, openLeads, recentActivity: '' },
          staleLeads,
          isRoleplayMode,
          roleplayPersona: selectedPersona,
          focusLead,
          promotions, 
          plans: planPricing 
      };
  }, [visibleLeads, user, isRoleplayMode, selectedLeadId, selectedPersona, promotions, planPricing]);

  // Initial Analysis
  useEffect(() => {
    if (isOpen && !hasInitialized.current && visibleLeads.length > 0) {
        hasInitialized.current = true;
        generateResponse("Analyze my current performance metrics and give me a Daily Briefing. Focus on any leads that are stuck.");
    }
  }, [isOpen, visibleLeads]);

  // Handle Mode Switching / Context Updates
  useEffect(() => {
      if (!isOpen) return;
      
      if (isRoleplayMode) {
          setMessages(prev => [...prev, { role: 'model', text: `🎭 **Roleplay Started: ${selectedPersona}**\n\nI'm looking at options... convince me.` }]);
      } 
  }, [isRoleplayMode, selectedPersona, isOpen]);

  const generateResponse = async (promptText: string) => {
      setIsStreaming(true);
      
      if (messages.length === 0) {
         setMessages([{ role: 'model', text: 'Thinking...' }]);
      } else {
         setMessages(prev => [...prev, { role: 'model', text: '' }]);
      }

      try {
          const history = messages.filter(m => m.text !== 'Thinking...').map(m => ({
              role: m.role,
              parts: [{ text: m.text }]
          }));

          const stream = streamCoachingResponse(history, promptText, contextData);
          let fullResponse = '';
          
          for await (const chunk of stream) {
              fullResponse += chunk;
              setMessages(prev => {
                  const newMessages = [...prev];
                  const targetIndex = newMessages.length - 1;
                  newMessages[targetIndex] = { role: 'model', text: fullResponse };
                  return newMessages;
              });
          }
      } catch (e) {
          console.error(e);
          setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the coaching server right now. Try again later." }]);
      } finally {
          setIsStreaming(false);
      }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    generateResponse(userText);
  };

  const handleLeadAnalyze = () => {
      if (!selectedLeadId) return;
      const leadName = contextData.focusLead?.customerName || 'Selected Lead';
      const prompt = `I've selected ${leadName}. Run a "Deal Doctor" analysis on their quote configuration. Tell me what's missing and how to close them using active promotions.`;
      setMessages(prev => [...prev, { role: 'user', text: `Analyze lead: ${leadName}` }]);
      generateResponse(prompt);
  };

  const handleBattleCard = (type: string) => {
      let prompt = "";
      switch(type) {
          case 'Price': prompt = "The customer says 'It's too expensive'. Give me 3 bullet points to handle this objection immediately."; break;
          case 'Think': prompt = "The customer says 'I need to think about it'. Give me a script to keep the conversation going."; break;
          case 'Competitor': prompt = "The customer says 'Verizon/AT&T has better coverage'. How do I respond with T-Mobile facts?"; break;
      }
      setMessages(prev => [...prev, { role: 'user', text: `Quick Assist: ${type}` }]);
      generateResponse(prompt);
  };

  const handleGradeRoleplay = () => {
      setMessages(prev => [...prev, { role: 'user', text: "Grade my performance in this roleplay." }]);
      generateResponse("Grade my performance. Give me a score out of 100 and 3 specific tips.");
  };

  const activeLeadsOptions = visibleLeads
    .filter(l => l.status !== LeadStatus.CLOSED_WON && l.status !== LeadStatus.CLOSED_LOST && l.assignedToUid === user?.uid)
    .map(l => ({ value: l.id, label: l.customerName || 'Unnamed' }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl h-[90vh] flex flex-col bg-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b border-border transition-colors duration-500 flex flex-col gap-3 ${isRoleplayMode ? 'bg-indigo-600 text-white' : 'bg-gradient-to-r from-pink-500/10 to-purple-500/10'}`}>
        <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-500 ${isRoleplayMode ? 'bg-white/20' : 'bg-gradient-to-br from-pink-500 to-purple-600'}`}>
                    <span className="text-xl">{isRoleplayMode ? '🥋' : '🩺'}</span>
                </div>
                <div>
                    <h2 className={`text-lg font-bold ${isRoleplayMode ? 'text-white' : 'text-foreground'}`}>
                        {isRoleplayMode ? 'Scenario Dojo' : 'Sales Coach'}
                    </h2>
                    <p className={`text-xs ${isRoleplayMode ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                        {isRoleplayMode ? 'Practice difficult conversations' : 'Deep Reasoning Enabled'}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isRoleplayMode ? 'hover:bg-white/20 text-white' : 'hover:bg-muted text-muted-foreground'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Context Bar */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
            {isRoleplayMode ? (
                <div className="flex-1 flex gap-2">
                    <Select 
                        name="persona" 
                        value={selectedPersona} 
                        onChange={(_, val) => setSelectedPersona(val)} 
                        options={[
                            {value: 'Skeptical Customer', label: 'Skeptical Customer'},
                            {value: 'Verizon Loyalist', label: 'Verizon Loyalist'},
                            {value: "The 'Bill Shock' Customer", label: 'Price Shock Customer'},
                            {value: "The 'Just Looking' Upgrader", label: 'Stubborn Upgrader'}
                        ]}
                        className="flex-1"
                    />
                    <Button size="sm" onClick={handleGradeRoleplay} className="bg-white/20 hover:bg-white/30 text-white border-0 whitespace-nowrap">Grade Me</Button>
                    <Button size="sm" onClick={() => setIsRoleplayMode(false)} className="bg-white/10 hover:bg-white/20 text-white border-0">Exit</Button>
                </div>
            ) : (
                <div className="flex-1 flex gap-2">
                    <div className="flex-1 flex gap-2">
                        <Select 
                            name="lead" 
                            value={selectedLeadId} 
                            onChange={(_, val) => setSelectedLeadId(val)} 
                            options={[{value: '', label: 'Select Lead to Analyze...'}, ...activeLeadsOptions]} 
                            className="w-full"
                        />
                        {selectedLeadId && (
                            <Button size="sm" onClick={handleLeadAnalyze} className="whitespace-nowrap bg-primary text-white">
                                Analyze
                            </Button>
                        )}
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => setIsRoleplayMode(true)} className="whitespace-nowrap">
                        Enter Dojo
                    </Button>
                </div>
            )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-down`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : isRoleplayMode 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 text-foreground rounded-bl-none'
                    : 'bg-card border border-border text-foreground rounded-bl-none'
              }`}
            >
              {msg.text}
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

      {/* Objection Battle Cards (Quick Assist) */}
      {!isStreaming && !isRoleplayMode && (
          <div className="px-4 py-2 border-t border-border bg-muted/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Objection Battle Cards</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <button onClick={() => handleBattleCard('Price')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-card border border-border hover:border-red-400 hover:text-red-500 text-xs font-medium transition-colors flex items-center gap-1 shadow-sm">
                      💰 Too Expensive
                  </button>
                  <button onClick={() => handleBattleCard('Think')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-card border border-border hover:border-amber-400 hover:text-amber-500 text-xs font-medium transition-colors flex items-center gap-1 shadow-sm">
                      🤔 "Need to think"
                  </button>
                  <button onClick={() => handleBattleCard('Competitor')} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-card border border-border hover:border-blue-400 hover:text-blue-500 text-xs font-medium transition-colors flex items-center gap-1 shadow-sm">
                      📡 Verizon/AT&T
                  </button>
              </div>
          </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
        >
            <div className="relative flex-1">
                <input
                    autoFocus
                    className="w-full bg-muted/50 border-0 rounded-xl px-4 py-3 pr-10 text-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none placeholder:text-muted-foreground/70"
                    placeholder={isRoleplayMode ? "Reply to the customer..." : "Ask your coach..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isStreaming}
                />
                <button 
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-muted-foreground hover:bg-muted'}`}
                    title="Voice Input"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            
            <Button type="submit" disabled={!input.trim() || isStreaming} size="icon" className={`w-12 h-12 rounded-xl shrink-0 ${isRoleplayMode ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}>
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

export default AISalesCoachModal;
