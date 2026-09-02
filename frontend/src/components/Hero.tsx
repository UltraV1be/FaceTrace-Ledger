import React from 'react';
import { ShieldCheck, Cpu, Database, Eye } from 'lucide-react';

interface HeroProps {
  onScrollToWorkspace: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onScrollToWorkspace }) => {
  return (
    <section className="relative pt-10 pb-12 border-b border-white/10 overflow-hidden bg-[#071F17]">
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-forensic-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          
          {/* Left: Dramatic Editorial Typography */}
          <div className="lg:col-span-8">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-[#F50064]/10 border border-[#F50064]/30 text-[#F50064] text-xs font-mono mb-4 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-[#F50064] rounded-full animate-ping" />
              <span>Consent-Based Forensic Verification</span>
            </div>

            <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tight uppercase leading-[0.88] text-[#F5F0E3]">
              FACE<br />
              <span className="text-[#F50064]">TRACE</span><br />
              LEDGER
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#EBE3D0]/90 font-sans max-w-2xl leading-relaxed">
              Accepts portrait photographs, generates 512-d normalized facial embeddings, performs live reverse-image search on the open web, evaluates cosine similarity, and immutably anchors cryptographic audit records on an Ethereum smart contract.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={onScrollToWorkspace}
                className="px-6 py-3 bg-[#F50064] text-white font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#FF006E] transition shadow-brutal-pink flex items-center space-x-2"
              >
                <span>[ START VERIFICATION ]</span>
              </button>

              <div className="flex items-center space-x-4 px-4 py-3 bg-[#0A2E23] border border-white/10 text-xs font-mono text-[#F5F0E3]">
                <span className="text-[#00E599] font-bold">SHA-256</span>
                <span className="text-white/20">•</span>
                <span className="text-[#FAF7F0]">INSIGHTFACE BUFFALO_SC</span>
                <span className="text-white/20">•</span>
                <span className="text-[#F50064] font-bold">SOLIDITY 0.8.20</span>
              </div>
            </div>
          </div>

          {/* Right: Technical Spec Column */}
          <div className="lg:col-span-4 bg-[#F5F0E3] text-[#141414] p-6 border-2 border-[#141414] shadow-brutal">
            <div className="text-xs font-mono font-bold text-[#F50064] mb-3 flex items-center justify-between border-b border-[#141414]/20 pb-2">
              <span className="text-[#F50064]">SYSTEM ARCHITECTURE</span>
              <span className="text-[#141414]">v1.0.0</span>
            </div>

            <div className="space-y-3.5 text-xs text-[#141414]">
              <div className="flex items-start space-x-2.5">
                <Cpu className="w-4 h-4 text-[#0D3B2E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#141414] block">Ephemeral Biometrics</span>
                  <span className="text-[#444444]">Face embeddings are evaluated in-memory and never stored on-chain.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <Eye className="w-4 h-4 text-[#F50064] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#141414] block">Live Dynamic Search</span>
                  <span className="text-[#444444]">Binary image upload to Google Lens / SerpApi for genuine web queries.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0D3B2E] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#141414] block">Tamper-Evident Ledger</span>
                  <span className="text-[#444444]">Canonical JSON serialized fingerprints registered to Solidity smart contract.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#141414]/20 flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#555555]">STATUS:</span>
              <span className="text-[#0A2E23] font-bold bg-[#00E599]/20 px-2 py-0.5 border border-[#00E599]/50">
                ACTIVE PIPELINE READY
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
