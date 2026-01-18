
import React from 'react';
import { useHaptics } from '../../hooks/useHaptics';

const variants = {
  default: 'bg-primary text-white hover:bg-primary/90 shadow-glow border border-white/10',
  destructive: 'bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20',
  outline: 'border border-input bg-transparent hover:bg-white/5 hover:text-foreground text-foreground',
  secondary: 'bg-white/10 text-foreground hover:bg-white/20 backdrop-blur-md border border-white/10',
  ghost: 'hover:bg-white/10 hover:text-foreground text-muted-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
};

const sizes = {
  default: 'h-12 px-6 py-2 text-sm',
  sm: 'h-10 rounded-xl px-3 text-xs',
  lg: 'h-14 rounded-2xl px-8 text-base',
  icon: 'h-10 w-10 rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', onClick, ...props }, ref) => {
    const { triggerHaptic } = useHaptics();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHaptic();
      onClick?.(e);
    };

    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-bold ring-offset-background transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export default Button;
