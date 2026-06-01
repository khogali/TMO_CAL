
import React, { useRef, useState } from 'react';
import { Promotion } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface FlyerModalProps {
    isOpen: boolean;
    onClose: () => void;
    promo: Promotion | null;
}

const FlyerModal: React.FC<FlyerModalProps> = ({ isOpen, onClose, promo }) => {
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLDivElement>(null);

    if (!promo) return null;

    const handleCopy = () => {
        // Simple clipboard copy for text description
        const text = `🔥 ${promo.name}\n\n${promo.description}\n\nVisit us today to claim this offer!`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-md bg-card rounded-2xl overflow-hidden">
            <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-lg">Share Offer</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="p-6 flex flex-col items-center gap-6">
                {/* Visual Flyer Preview */}
                <div 
                    ref={canvasRef}
                    className="w-full aspect-[4/5] bg-gradient-to-br from-primary to-pink-600 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between p-6 text-white text-center select-none"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
                    
                    <div className="relative z-10">
                        <div className="text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-4">Limited Time Offer</div>
                        <h2 className="text-3xl font-black leading-tight mb-2">{promo.name}</h2>
                        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto my-4"></div>
                        <p className="text-sm font-medium leading-relaxed opacity-90">{promo.description}</p>
                    </div>

                    <div className="relative z-10 mt-4">
                        <div className="bg-white text-primary font-bold py-3 px-6 rounded-full shadow-lg inline-block text-sm uppercase tracking-wide">
                            Get This Deal
                        </div>
                    </div>
                </div>

                <div className="w-full flex gap-3">
                    <Button onClick={handleCopy} className="flex-1" variant={copied ? "secondary" : "default"}>
                        {copied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy Script
                            </>
                        )}
                    </Button>
                    <Button variant="secondary" onClick={() => alert('Image generation would download here')} className="flex-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Save Image
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default FlyerModal;
