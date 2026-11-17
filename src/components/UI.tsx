import React from 'react';
import { cn } from '../lib/utils';

export function Card({ children, className, gold, hover }: { 
  children: React.ReactNode; 
  className?: string; 
  gold?: boolean;
  hover?: boolean;
}) {
  return (
    <div className={cn(
      "bg-surface-container rounded-xl p-6 border border-outline-variant transition-all overflow-hidden relative",
      gold && "gold-border gold-glow",
      hover && "hover:border-tertiary/50 hover:bg-surface-container-high cursor-pointer",
      className
    )}>
      {children}
    </div>
  );
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  as: Component = 'button',
  fullWidth,
  ...props 
}: any) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-on-primary shadow-lg",
    secondary: "bg-secondary text-on-secondary shadow-lg",
    gold: "gold-border text-tertiary hover:bg-surface-container-high transition-all",
    outline: "border-2 border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-all",
    error: "bg-error-container text-on-error-container",
  };
  
  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-md",
    lg: "px-10 py-4 text-lg",
  };

  return (
    <Component 
      className={cn(
        "rounded-lg font-bold active:scale-95 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function ScoreInput({ value, onChange, label, colorClass }: {
  value: number;
  onChange: (val: number) => void;
  label: string;
  colorClass: string;
}) {
  const borderClass = colorClass.replace('text-', 'border-');
  const stepBtn = cn(
    "shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full border text-xl font-bold flex items-center justify-center hover:bg-surface-container-highest active:scale-95 transition-all",
    borderClass
  );

  return (
    // Mobile: one compact row (label | - input +). Desktop: stacked.
    <div className="flex flex-row md:flex-col items-center md:items-stretch gap-2 md:gap-4">
      <label className={cn("flex-1 min-w-0 truncate text-xs md:text-sm font-bold md:text-center uppercase tracking-widest", colorClass)}>{label}</label>
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <button type="button" aria-label={`${label} -5`} onClick={() => onChange(value - 5)} className={stepBtn}>
          −
        </button>
        <input 
          type="number" 
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="bg-surface-container-highest border-2 border-tertiary text-on-surface text-center w-20 h-10 md:w-24 md:h-16 text-xl md:text-2xl font-bold rounded-lg focus:ring-0 focus:border-tertiary"
        />
        <button type="button" aria-label={`${label} +5`} onClick={() => onChange(value + 5)} className={stepBtn}>
          +
        </button>
      </div>
    </div>
  );
}
