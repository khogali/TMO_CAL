
import React from 'react';

interface MobileAppShellProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

/**
 * A responsive wrapper that enforces the "Mobile App" look.
 * On Mobile: Occupies full width/height.
 * On Desktop: Constrained to a phone-sized container (max-w-md) centered on screen.
 */
const MobileAppShell: React.FC<MobileAppShellProps> = ({ children, className = '', noPadding = false }) => {
    return (
        <div className="bg-muted/10 h-full w-full flex justify-center overflow-hidden">
            <div className={`
                w-full max-w-md bg-background h-full shadow-2xl border-x border-border/50 relative flex flex-col
                ${className}
            `}>
                {children}
            </div>
        </div>
    );
};

export default MobileAppShell;
