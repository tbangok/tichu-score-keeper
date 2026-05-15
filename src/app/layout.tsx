import React from 'react';
import type { Metadata } from 'next';
import { Header, Footer, MobileNav } from '@/components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tichu Imperial Tracker',
  description: 'The definitive high-stakes scorekeeping companion for competitive Tichu play.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-montserrat">
        <div className="min-h-screen flex flex-col bg-surface overflow-x-hidden">
          <Header />
          <main className="flex-grow pt-24 pb-32 max-w-7xl mx-auto px-4 w-full">
            {children}
          </main>
          <Footer />
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
