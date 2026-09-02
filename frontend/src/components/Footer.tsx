import React from 'react';
import { Shield, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-white/10 bg-forest-950 py-10 text-cream-200 text-xs font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left */}
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-pink flex items-center justify-center text-white font-mono font-bold text-xs">
            FT
          </div>
          <div>
            <span className="font-display font-bold text-cream-100 tracking-wider">
              FACETRACE LEDGER
            </span>
            <span className="text-cream-300/60 block text-[10px]">
              Forensic AI & Blockchain Integrity Lab • Hacker House Goa 2026
            </span>
          </div>
        </div>

        {/* Center */}
        <div className="text-center md:text-left text-cream-300/70 text-[11px] max-w-md">
          Consent-based research system. Ephemeral biometric vectors are computed in-memory and never stored on-chain or persisted.
        </div>

        {/* Right */}
        <div className="flex items-center space-x-4">
          <button
            onClick={scrollToTop}
            className="flex items-center space-x-1 px-3 py-1.5 bg-forest-900 border border-white/10 hover:border-pink text-cream-200 hover:text-white transition"
          >
            <span>BACK TO TOP</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>

      </div>
    </footer>
  );
};
