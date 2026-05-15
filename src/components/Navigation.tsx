'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, History, BarChart3, PlusCircle, Settings, LayoutDashboard } from 'lucide-react';
import { cn } from '../lib/utils';

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'History', href: '/history' },
    { label: 'Stats', href: '/stats' },
  ];

  return (
    <header className="bg-surface border-b border-outline-variant shadow-md fixed top-0 w-full z-50">
      <div className="flex justify-between items-center px-6 h-20 w-full max-w-7xl mx-auto">
        <Link href="/">
          <div className="text-2xl font-bold text-tertiary tracking-wider uppercase">TICHU</div>
        </Link>
        <nav className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "text-on-surface-variant hover:text-on-surface transition-colors font-bold", 
                  isActive && "text-tertiary border-b-2 border-tertiary pb-1"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all">
            <LayoutDashboard size={24} />
          </button>
          <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all">
            <Settings size={24} />
          </button>
          <Link 
            href="/new-game" 
            className="hidden md:block bg-primary text-on-primary font-bold px-6 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all"
          >
            New Game
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto border-t border-outline-variant mt-12 mb-20 md:mb-0">
      <div className="text-tertiary text-xl font-bold opacity-50 tracking-widest">TICHU</div>
      <div className="text-on-surface-variant text-center opacity-60">
        © 2026 TICHU IMPERIAL TRACKER. v2.0.0
      </div>
      <div className="flex gap-6">
        <Link href="#" className="text-on-surface-variant hover:text-tertiary transition-all font-bold">Rules</Link>
        <Link href="#" className="text-on-surface-variant hover:text-tertiary transition-all font-bold">Support</Link>
        <Link href="#" className="text-on-surface-variant hover:text-tertiary transition-all font-bold">Privacy</Link>
      </div>
    </footer>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center px-4 py-2 bg-surface-container border-t border-outline-variant shadow-lg">
      <Link href="/" className={cn("flex flex-col items-center p-2 text-on-surface-variant", pathname === "/" && "text-tertiary")}>
        <LayoutDashboard size={20} />
        <span className="text-[10px] font-bold mt-1">Home</span>
      </Link>
      <Link href="/history" className={cn("flex flex-col items-center p-2 text-on-surface-variant", pathname === "/history" && "text-tertiary")}>
        <History size={20} />
        <span className="text-[10px] font-bold mt-1">History</span>
      </Link>
      <Link href="/new-game" className={cn("flex flex-col items-center p-4 bg-primary text-on-primary rounded-full relative -top-4 shadow-lg", pathname === "/new-game" && "brightness-110")}>
        <PlusCircle size={24} />
      </Link>
      <Link href="/stats" className={cn("flex flex-col items-center p-2 text-on-surface-variant", pathname === "/stats" && "text-tertiary")}>
        <BarChart3 size={20} />
        <span className="text-[10px] font-bold mt-1">Stats</span>
      </Link>
    </nav>
  );
}
