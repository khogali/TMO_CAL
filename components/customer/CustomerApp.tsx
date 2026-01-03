
import React, { useState, useEffect } from 'react';
import { QuoteConfig } from '../../types';
import QuoteFlow from './QuoteFlow';
import QuoteSummary from './QuoteSummary';
import SavedQuotes from './SavedQuotes';
import { parseShareLink } from '../../utils/customerUtils';

const CustomerApp: React.FC = () => {
    const [view, setView] = useState<'landing' | 'flow' | 'summary' | 'saved'>('landing');
    const [quoteConfig, setQuoteConfig] = useState<QuoteConfig | undefined>(undefined);

    // Hash Router Listener
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#customer/saved')) {
                setView('saved');
            } else if (hash.startsWith('#customer/shared/')) {
                const encoded = hash.replace('#customer/shared/', '');
                const loadedConfig = parseShareLink(encoded);
                if (loadedConfig) {
                    setQuoteConfig(loadedConfig);
                    setView('summary');
                }
            } else if (hash === '#customer/new') {
                setView('landing'); 
            } else if (hash === '#customer') {
                setView('landing');
            }
        };

        handleHashChange(); // Initial check
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigate = (path: string) => {
        window.location.hash = path;
    };

    const handleFlowComplete = (config: QuoteConfig) => {
        setQuoteConfig(config);
        setView('summary');
    };

    return (
        <div className="min-h-screen bg-background font-sans text-foreground flex flex-col transition-colors duration-300">
            {/* Standard Header */}
            <nav className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div 
                        className="flex items-center gap-2 cursor-pointer" 
                        onClick={() => navigate('#customer')}
                    >
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">T</div>
                        <span className="font-bold text-xl tracking-tight text-foreground">Quote<span className="text-primary">Compare</span></span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('#customer/saved')} className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground hover:bg-muted px-3 py-2 rounded-lg">
                            Saved Quotes
                        </button>
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex flex-col">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    
                    {(view === 'landing' || view === 'flow') ? (
                        <>
                            <header className="mb-8 text-center sm:text-left">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2">Find Your Perfect Plan</h1>
                                <p className="text-lg text-muted-foreground max-w-2xl">Compare unbiased deals on phones and plans instantly. No hidden fees.</p>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Main Quote Flow Area */}
                                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                                    <QuoteFlow 
                                        onComplete={handleFlowComplete} 
                                        onCancel={() => {}}
                                        initialConfig={undefined}
                                    />
                                </div>

                                {/* Sidebar / Benefits Area */}
                                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                                    <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                                        <h3 className="font-bold text-lg mb-4 text-foreground">Why use QuoteCompare?</h3>
                                        <ul className="space-y-4">
                                            <li className="flex gap-4 items-start">
                                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">Instant Pricing</p>
                                                    <p className="text-sm text-muted-foreground mt-0.5">Get real-time quotes without the sales calls. See exactly what you'll pay.</p>
                                                </div>
                                            </li>
                                            <li className="flex gap-4 items-start">
                                                <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">Best Deals Automatically</p>
                                                    <p className="text-sm text-muted-foreground mt-0.5">We scan for valid promotions and apply them to your quote automatically.</p>
                                                </div>
                                            </li>
                                            <li className="flex gap-4 items-start">
                                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">Unbiased Comparison</p>
                                                    <p className="text-sm text-muted-foreground mt-0.5">Compare value vs. premium plans side-by-side to make the right choice.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}

                    {view === 'summary' && quoteConfig && (
                        <QuoteSummary 
                            config={quoteConfig} 
                            onEdit={() => navigate('#customer/new')}
                            onStartNew={() => navigate('#customer/new')}
                        />
                    )}

                    {view === 'saved' && (
                        <SavedQuotes 
                            onLoad={(config) => { setQuoteConfig(config); setView('summary'); }}
                            onBack={() => navigate('#customer')}
                        />
                    )}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-card border-t border-border py-8 px-6 mt-auto">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} T-Quote Compare. Unofficial tool.</p>
                    <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default CustomerApp;
