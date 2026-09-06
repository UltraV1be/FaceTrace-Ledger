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
    <header className="border-b-4 border-goa-yellow/20 bg-goa-green/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logotype */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-goa-yellow flex items-center justify-center text-goa-dark font-mono font-bold shadow-[2px_2px_0px_0px_#ff0080] text-sm">
            FT
          </div>
          <div>
            <span className="font-display font-black text-2xl text-goa-yellow flex items-center gap-2">
              FACETRACE <span className="text-goa-pink">LEDGER</span>
            </span>
          </div>
        </div>

        {/* Center: System Architecture (Removed SaaS Dots) */}
        <div className="hidden md:flex items-center space-x-2 bg-[#084d29] border-2 border-goa-yellow px-3 py-1 text-xs font-mono font-bold text-goa-yellow shadow-[2px_2px_0px_0px_#ff0080]">
          <span>ENGINE: INSIGHTFACE</span>
          <span className="text-goa-pink px-1">/</span>
          <span>SEARCH: GOOGLE LENS</span>
          <span className="text-goa-pink px-1">/</span>
          <span>LEDGER: LOCAL EVM</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold text-goa-yellow hover:bg-goa-pink hover:text-white border-2 border-goa-yellow transition shadow-[2px_2px_0px_0px_#ff0080]"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HOW IT WORKS</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold text-goa-yellow hover:bg-goa-yellow hover:text-goa-dark border-2 border-goa-yellow transition shadow-[2px_2px_0px_0px_#ff0080]"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HISTORY</span>
          </button>

          <a
            href="https://github.com/UltraV1be/FaceTrace-Ledger"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center space-x-1 px-3 py-1.5 text-xs font-mono bg-goa-pink text-white font-bold hover:bg-goa-yellow hover:text-goa-dark transition shadow-[2px_2px_0px_0px_#fee101] border-2 border-goa-pink"
          >
            <span>GITHUB</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
};
