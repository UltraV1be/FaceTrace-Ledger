import React from 'react';
import { X, Scan, Globe, ShieldCheck, Cpu, Lock, Blocks, CheckCircle2 } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '01',
      title: 'FACE DETECTION',
      desc: 'InsightFace buffalo_sc deep neural model detects facial landmarks and isolates the primary face bounding box.',
      icon: Scan
    },
    {
      num: '02',
      title: '512-D EMBEDDING',
      desc: 'Extracts a normalized 512-dimensional vector in memory. Strictly ephemeral — never uploaded or stored.',
      icon: Cpu
    },
    {
      num: '03',
      title: 'LIVE REVERSE SEARCH',
      desc: 'Uploads raw image binary directly to Google Lens / SerpApi engine for genuine real-time open web results.',
      icon: Globe
    },
    {
      num: '04',
      title: 'CANDIDATE COMPARISON',
      desc: 'Downloads discovered candidate thumbnails and measures cosine similarity against input face embedding.',
      icon: CheckCircle2
    },
    {
      num: '05',
      title: 'CANONICAL SERIALIZATION',
      desc: 'Constructs deterministic JSON metadata sorted alphabetically with compact separators (RFC-8785).',
      icon: Lock
    },
    {
      num: '06',
      title: 'BLOCKCHAIN ANCHOR',
      desc: 'SHA-256 cryptographic digest uploaded as bytes32 on Ethereum Solidity smart contract.',
      icon: Blocks
    },
    {
      num: '07',
      title: 'TAMPER RE-VERIFICATION',
      desc: 'Recomputes digest and queries on-chain contract. Any altered byte results in instant audit failure.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-goa-cream text-goa-dark border-2 border-goa-dark shadow-brutal p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-goa-dark pb-4 mb-6">
          <div>
            <span className="text-xs font-mono font-bold text-goa-pink uppercase tracking-widest block">
              SYSTEM PROTOCOL
            </span>
            <h3 className="font-display font-black text-2xl uppercase tracking-tight text-goa-dark">
              HOW FACETRACE LEDGER WORKS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#EBE3D0] border border-goa-dark transition text-goa-dark"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-goa-dark" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3.5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-4 bg-white border-2 border-goa-dark flex items-start space-x-4 shadow-brutal"
              >
                <div className="w-9 h-9 bg-goa-green text-goa-cream flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-goa-dark">
                  {step.num}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-sm uppercase tracking-wider text-goa-green flex items-center gap-2">
                    <Icon className="w-4 h-4 text-goa-pink" />
                    <span className="text-goa-green font-bold">{step.title}</span>
                  </h4>
                  <p className="text-xs font-mono text-[#333333] mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t-2 border-goa-dark flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-goa-green text-goa-cream font-mono text-xs font-bold uppercase hover:bg-[#144F3F] transition shadow-brutal border border-goa-dark"
          >
            [ CLOSE PROTOCOL ]
          </button>
        </div>

      </div>
    </div>
  );
};
