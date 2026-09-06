import React from 'react';
import { ShieldCheck, Cpu, Database, Eye } from 'lucide-react';

interface HeroProps {
  onScrollToWorkspace: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToWorkspace }) => {
  return (
    <section className="relative pt-10 pb-12 border-b-4 border-goa-yellow/20 overflow-hidden bg-goa-dark/20 backdrop-blur-[1px]">
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-forensic-grid opacity-10 pointer-events-none mix-blend-overlay" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          
          {/* Left: Dramatic Editorial Typography */}
          <div className="lg:col-span-8">
            <h1 className="font-display font-black text-6xl sm:text-7xl lg:text-[10rem] tracking-tight uppercase leading-[0.8] text-goa-yellow">
              FACE<br />
              TRACE<br />
              <span className="text-goa-pink inline-block -mt-4 transform rotate-[-2deg]">LEDGER</span>
            </h1>

            <p className="mt-8 text-base sm:text-lg text-goa-cream/90 font-sans max-w-2xl leading-relaxed">
              Accepts portrait photographs, generates 512-d normalized facial embeddings, performs live reverse-image search on the open web, evaluates cosine similarity, and immutably anchors cryptographic audit records on an Ethereum smart contract.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onScrollToWorkspace}
                className="px-8 py-4 bg-goa-yellow text-goa-dark font-display text-2xl uppercase tracking-wider font-black hover:bg-goa-pink hover:text-white transition shadow-brutal flex items-center space-x-2 border-4 border-goa-red"
              >
                <span>START VERIFICATION</span>
              </button>
            </div>
          </div>

          {/* Right: Technical Spec Column */}
          <div className="lg:col-span-4 bg-[#084d29] text-goa-cream p-6 border-4 border-goa-yellow shadow-[4px_4px_0px_0px_#ff0080]">
            <div className="text-xs font-mono font-bold text-goa-yellow mb-3 flex items-center justify-between border-b-2 border-goa-yellow/30 pb-2">
              <span>SYSTEM ARCHITECTURE</span>
              <span className="text-goa-cream/50">v1.0.0</span>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex items-start space-x-2.5">
                <Cpu className="w-4 h-4 text-goa-yellow shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-goa-yellow block">Ephemeral Biometrics (INSIGHTFACE)</span>
                  <span className="text-goa-cream/80">Face embeddings are evaluated in-memory and never stored on-chain.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Eye className="w-4 h-4 text-goa-pink shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-goa-pink block">Live Dynamic Search</span>
                  <span className="text-goa-cream/80">Binary image upload to Google Lens for genuine web queries.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-goa-yellow shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-goa-yellow block">Tamper-Evident Ledger (SHA-256)</span>
                  <span className="text-goa-cream/80">Canonical JSON serialized fingerprints registered to Solidity 0.8.20.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-goa-yellow/30 flex items-center justify-between text-[11px] font-mono">
              <span className="text-goa-cream font-bold">STATUS:</span>
              <span className="text-goa-dark font-bold bg-goa-yellow px-2 py-0.5 border-2 border-goa-red uppercase">
                [ Active Pipeline ]
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
