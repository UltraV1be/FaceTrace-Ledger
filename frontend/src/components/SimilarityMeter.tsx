import React from 'react';
import { Check, ShieldAlert } from 'lucide-react';

interface SimilarityMeterProps {
  similarityScore: number;
  threshold?: number;
}

export const SimilarityMeter: React.FC<SimilarityMeterProps> = ({
  similarityScore,
  threshold = 0.65
}) => {
  const scorePercent = Math.min(100, Math.max(0, similarityScore * 100));
  const thresholdPercent = threshold * 100;
  const isPassed = similarityScore >= threshold;

  return (
    <div className="bg-white border-2 border-goa-dark p-5 space-y-4 text-goa-dark shadow-brutal">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-[#555555] uppercase tracking-wider block font-bold">
            FACIAL COSINE SIMILARITY METRIC
          </span>
          <span className="font-display font-black text-3xl text-goa-dark">
            {scorePercent.toFixed(2)}%
          </span>
        </div>

        <div className={`px-3.5 py-1.5 font-mono text-xs font-bold uppercase flex items-center space-x-1.5 border-2 ${
          isPassed
            ? 'bg-goa-yellow/20 text-goa-green border-goa-yellow/80'
            : 'bg-red-50 text-red-600 border-red-300'
        }`}>
          {isPassed ? <Check className="w-4 h-4 text-goa-green" /> : <ShieldAlert className="w-4 h-4 text-red-500" />}
          <span>{isPassed ? 'PASSED CONFIGURED THRESHOLD' : 'BELOW THRESHOLD'}</span>
        </div>
      </div>

      {/* Horizontal Calibrated Slider Bar */}
      <div className="space-y-1.5 font-mono">
        <div className="relative h-7 bg-[#EBE3D0] border-2 border-goa-dark overflow-hidden">
          
          {/* Threshold Zone */}
          <div
            style={{ left: `${thresholdPercent}%` }}
            className="absolute top-0 bottom-0 right-0 bg-goa-yellow/15 border-l-2 border-dashed border-[#0A2E23] z-0"
          />

          {/* Active Score Bar */}
          <div
            style={{ width: `${scorePercent}%` }}
            className={`h-full transition-all duration-700 relative z-10 ${
              isPassed ? 'bg-goa-green' : 'bg-[#555555]'
            }`}
          />

          {/* Marker Dot */}
          <div
            style={{ left: `calc(${scorePercent}% - 6px)` }}
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-goa-pink border-2 border-white shadow-md z-20"
          />
        </div>

        {/* Labels & Scale */}
        <div className="flex justify-between text-[11px] text-[#444444] font-bold pt-1">
          <span>0.00 (NO MATCH)</span>
          <span className="font-bold text-goa-green">
            ▲ THRESHOLD: {threshold.toFixed(2)} (65.0%)
          </span>
          <span>1.00 (IDENTICAL)</span>
        </div>
      </div>

      <p className="text-[11px] font-mono text-[#555555] border-t border-goa-dark/15 pt-3">
        * Evaluation language: Candidate similarity passed the configured biometric threshold of {threshold * 100}%. Probabilistic forensic comparison.
      </p>

    </div>
  );
};
