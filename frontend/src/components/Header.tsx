import React from 'react';
import { Shield, Activity, History, HelpCircle, ArrowUpRight } from 'lucide-react';
import { SystemStatus } from '../types/pipeline';

interface HeaderProps {
  systemStatus: SystemStatus | null;
  onOpenHistory: () => void;
  onOpenHowItWorks: () => void;
}

export const Header: React.FC<HeaderProps> = ({ systemStatus, onOpenHistory, onOpenHowItWorks }) => {
  const isOnline = systemStatus?.status === 'online';
  const hasKey = systemStatus?.components?.search_provider?.has_key;

  return (
    <header className="border-b border-white/10 bg-forest-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand / Editorial Logotype */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-pink flex items-center justify-center text-white font-mono font-bold shadow-brutal-sm text-sm">
            FT
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-wider text-cream-100 flex items-center gap-2">
              FACETRACE <span className="text-pink">LEDGER</span>
            </span>
            <span className="text-[10px] font-mono text-cream-300/60 block -mt-1 tracking-widest">
              FORENSIC BIOMETRIC LAB • TASK 03
            </span>
          </div>
        </div>

        {/* Center: System Status Pill */}
        <div className="hidden md:flex items-center space-x-4 bg-forest-900 border border-white/10 px-3 py-1.5 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald animate-pulse' : 'bg-red-500'}`} />
            <span className="text-cream-200">ENGINE:</span>
            <span className="text-emerald font-semibold">INSIGHTFACE</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald' : 'bg-amber-400'}`} />
            <span className="text-cream-200">SEARCH:</span>
            <span className="text-pink font-semibold">GOOGLE LENS</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald" />
            <span className="text-cream-200">LEDGER:</span>
            <span className="text-emerald font-semibold">LOCAL EVM</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono text-cream-200 hover:text-white hover:bg-forest-800 border border-white/10 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-pink" />
            <span className="hidden sm:inline">HOW IT WORKS</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono text-cream-200 hover:text-white hover:bg-forest-800 border border-white/10 transition"
          >
            <History className="w-3.5 h-3.5 text-emerald" />
            <span className="hidden sm:inline">HISTORY</span>
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center space-x-1 px-3 py-1.5 text-xs font-mono bg-cream-100 text-charcoal font-bold hover:bg-pink hover:text-white transition shadow-brutal-sm"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
};
