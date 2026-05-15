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
  return (
    <div className="flex flex-col gap-4">
      <label className={cn("text-sm font-bold text-center uppercase tracking-widest", colorClass)}>{label}</label>
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={() => onChange(value - 5)}
          className={cn("w-12 h-12 rounded-full border flex items-center justify-center hover:bg-surface-container-highest transition-colors", colorClass.replace('text-', 'border-'))}
        >
          <span className="material-symbols-outlined">-</span>
        </button>
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="bg-surface-container-highest border-2 border-tertiary text-on-surface text-center w-24 h-16 text-2xl font-bold rounded-lg focus:ring-0 focus:border-tertiary"
        />
        <button 
          onClick={() => onChange(value + 5)}
          className={cn("w-12 h-12 rounded-full border flex items-center justify-center hover:bg-surface-container-highest transition-colors", colorClass.replace('text-', 'border-'))}
        >
          <span className="material-symbols-outlined">+</span>
        </button>
      </div>
    </div>
  );
}
