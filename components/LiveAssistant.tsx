
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Tool } from "@google/genai";
import { useData, useAuth } from '../context/AppContext';
import { QuoteConfig, DeviceCategory, CustomerType } from '../types';
import { createInitialConfig } from '../constants';
import { useScrollLock } from '../hooks/useScrollLock';

interface LiveAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth();
  const { planPricing, promotions, discountSettings, applyWizardConfig, servicePlans } = useData();
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'processing' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [volume, setVolume] = useState(0); 
  
  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useScrollLock(isOpen);

  // --- 1. Tools Definition ---
  const tools: Tool[] = useMemo(() => [{
    functionDeclarations: [
      {
        name: "generate_quote",
        description: "Generates a T-Mobile price quote and takes the user to the calculator screen. Use this when the user specifies a plan and number of lines.",
        parameters: {
          type: "OBJECT",
          properties: {
            planId: { 
                type: "STRING", 
                description: `The Plan ID to select. Valid IDs: ${planPricing.map(p => p.id).join(', ')}` 
            },
            lines: { 
                type: "NUMBER", 
                description: "Number of voice lines (1-12)." 
            },
            customerType: {
                type: "STRING",
                description: "Type of customer account.",
                enum: Object.values(CustomerType)
            },
            deviceCount: {
                type: "NUMBER",
                description: "Number of new phones to add."
            }
          },
          required: ["planId", "lines"]
        }
      }
    ]
  }], [planPricing]);

  // --- 2. System Instruction ---
  const systemInstruction = useMemo(() => {
    const userName = userProfile?.displayName || 'Sales Rep';

    // Build Knowledge Base
    const plansDetailed = planPricing.map(p => {
        let pricingSchema = "";
        if (p.pricingModel === 'Tiered' && p.tieredPrices) {
            const tiers = p.tieredPrices.slice(0, 5).map((price, i) => 
                `Total for ${i + 1} Line${i > 0 ? 's' : ''}: $${price}`
            ).join(' | ');
            pricingSchema = `${tiers} | Line 6+: +$${p.additionalLinePrice || 35}`;
        } else {
            pricingSchema = `Single Line: $${p.firstLinePrice}, Each Additional: +$${p.additionalLinePrice}`;
        }
        
        return `
        PLAN: "${p.name}" (ID: ${p.id})
        - Max Lines: ${p.maxLines}
        - Taxes: ${p.taxesIncluded ? 'Included' : 'Extra'}
        - Pricing: ${pricingSchema}
        `.trim();
    }).join('\n');

    return `
    You are T-Quote AI. You are speaking with ${userName}.

    **CRITICAL RULES (MUST FOLLOW):**
    1. **LINE LIMITS:** You MUST enforce the "Max Lines" for every plan. 
       - IF user asks for 10 lines on a 55+ plan (Max 2), you MUST say: "I can't do that. The 55+ plan is strictly limited to 2 lines."
       - DO NOT generate a quote if limits are exceeded.
    2. **AUTOPAY MATH:** The prices listed below are BEFORE AutoPay. 
       - Always subtract $${discountSettings.autopay} per line (up to 8 lines) when speaking the final price.
    3. **ACTIONS:** If the user request is valid, call the 'generate_quote' tool to build it for them.

    **KNOWLEDGE BASE:**
    ${plansDetailed}

    **SALES BATTLE CARDS:**
    - "Too Expensive" -> Pivot to value (Netflix/Apple TV included).
    - "Verizon/AT&T" -> Mention Carrier Freedom (we pay off phones).
    `;
  }, [planPricing, promotions, userProfile, discountSettings]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const startSession = async () => {
      try {
        setStatus('connecting');
        setErrorMsg(null);
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = ctx;
        nextStartTimeRef.current = ctx.currentTime;

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: systemInstruction,
            tools: tools, // Inject tools
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
          },
          callbacks: {
            onopen: async () => {
              if (!isMounted) return;
              console.log("Gemini Live Connected");
              setStatus('listening');
              
              // Start Mic
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true
                }});
                mediaStreamRef.current = stream;
                
                const inputCtx = new AudioContextClass({ sampleRate: 16000 });
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                scriptProcessorRef.current = processor;
                sourceNodeRef.current = source;

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Volume meter
                    let sum = 0;
                    for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                    if(status === 'listening') setVolume(Math.sqrt(sum / inputData.length) * 10);

                    const base64Data = btoa(String.fromCharCode(...new Uint8Array(float32ToInt16(inputData).buffer)));
                    
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'audio/pcm;rate=16000',
                                data: base64Data
                            }
                        });
                    });
                };

                source.connect(processor);
                processor.connect(inputCtx.destination);

              } catch (err: any) {
                console.error("Mic Error:", err);
                setStatus('error');
                setErrorMsg("Microphone access denied.");
              }
            },
            onmessage: async (msg: LiveServerMessage) => {
               if (!isMounted) return;
               
               // 1. Handle Tool Calls
               if (msg.toolCall) {
                   setStatus('processing');
                   const functionResponses = [];
                   
                   for (const call of msg.toolCall.functionCalls) {
                       if (call.name === 'generate_quote') {
                           const args = call.args as any;
                           console.log("Executing Tool:", args);
                           
                           // Execute Logic
                           const baseConfig = createInitialConfig(planPricing);
                           const newDevices = Array.from({ length: args.deviceCount || 0 }).map(() => ({
                               id: crypto.randomUUID(),
                               category: DeviceCategory.PHONE,
                               price: 830, // Default to generic flagship price
                               tradeIn: 0,
                               tradeInType: 'manual' as const,
                               appliedPromoId: null,
                               term: 24,
                               downPayment: 0,
                               isByod: false
                           }));

                           const newConfig: QuoteConfig = {
                               ...baseConfig,
                               plan: args.planId,
                               lines: args.lines,
                               customerType: args.customerType || CustomerType.STANDARD,
                               devices: newDevices
                           };

                           // Apply to App Context
                           applyWizardConfig(newConfig);
                           onClose(); // Close modal to show the calculator

                           functionResponses.push({
                               id: call.id,
                               name: call.name,
                               response: { result: "Quote generated and displayed to user." }
                           });
                       }
                   }

                   // Send response back to model
                   if (functionResponses.length > 0) {
                       sessionPromise.then(session => {
                           session.sendToolResponse({ functionResponses });
                       });
                   }
               }

               // 2. Handle Audio Output
               const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
               if (audioData) {
                   setStatus('speaking');
                   const audioBuffer = await decodeAudioData(audioData, audioContextRef.current!);
                   playAudio(audioBuffer);
               }

               // 3. Handle Turn Complete
               if (msg.serverContent?.turnComplete) {
                   setTimeout(() => {
                       if(isMounted && activeSourcesRef.current.size === 0) setStatus('listening');
                   }, 500);
               }
            },
            onclose: () => console.log("Gemini Live Closed"),
            onerror: (e) => {
                console.error("Gemini Live Error", e);
                setStatus('error');
            }
          }
        });
        
        sessionRef.current = sessionPromise;

      } catch (e) {
        console.error("Setup Error", e);
        setStatus('error');
        setErrorMsg("Failed to initialize AI session.");
      }
    };

    startSession();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [isOpen, systemInstruction, tools, applyWizardConfig]);

  const cleanup = () => {
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    activeSourcesRef.current.clear();
  };

  // --- Audio Helpers ---
  function float32ToInt16(float32: Float32Array) {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  async function decodeAudioData(base64: string, ctx: AudioContext) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    return buffer;
  }

  function playAudio(buffer: AudioBuffer) {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const currentTime = ctx.currentTime;
      if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
      activeSourcesRef.current.add(source);
      source.onended = () => {
          activeSourcesRef.current.delete(source);
          if (activeSourcesRef.current.size === 0) {
              setStatus('listening');
              setVolume(0);
          }
      };
      setVolume(0.8); 
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in-down">
        <div className="flex flex-col items-center justify-center w-full h-full max-w-lg p-8 relative">
            <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-12 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {status === 'connecting' && 'Connecting...'}
                    {status === 'listening' && 'Listening...'}
                    {status === 'speaking' && 'T-Quote AI'}
                    {status === 'processing' && 'Generating Quote...'}
                    {status === 'error' && 'Connection Error'}
                </h2>
                <p className="text-white/60">
                    {status === 'error' && errorMsg ? errorMsg : 
                     status === 'listening' ? 'Go ahead, I\'m listening.' : 
                     status === 'speaking' ? 'Speaking...' : 
                     status === 'processing' ? 'Building your quote...' : ''}
                </p>
            </div>

            <div className="relative flex items-center justify-center">
                <div 
                    className={`absolute rounded-full blur-3xl transition-all duration-200 ${status === 'error' ? 'bg-red-500/40' : 'bg-primary/40'}`}
                    style={{ width: `${200 + (volume * 100)}px`, height: `${200 + (volume * 100)}px` }}
                />
                <div 
                    className={`relative w-32 h-32 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
                    ${status === 'listening' ? 'bg-white scale-100' : 
                      status === 'speaking' ? 'bg-gradient-to-tr from-primary to-purple-500 scale-110' : 
                      status === 'processing' ? 'bg-blue-500 scale-90 animate-pulse' :
                      'bg-gray-500 scale-90'}
                    `}
                >
                    {status === 'listening' && (
                        <div 
                            className="absolute rounded-full bg-white/30"
                            style={{ width: `${100 + (volume * 200)}%`, height: `${100 + (volume * 200)}%`, transition: 'all 0.1s ease-out' }} 
                        />
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${status === 'speaking' || status === 'processing' ? 'text-white' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
            </div>

            <p className="mt-16 text-white/40 text-sm max-w-xs text-center">
                Try asking: "Create a quote for 4 lines on Go5G Plus."
            </p>

            {status === 'error' && (
                <button onClick={onClose} className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold">
                    Close & Retry
                </button>
            )}
        </div>
    </div>
  );
};

export default LiveAssistant;
