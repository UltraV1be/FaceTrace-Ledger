import React from 'react';
import { Globe, ShieldCheck, Share2, UserCheck, Layers } from 'lucide-react';
import { CandidateResult } from '../types/pipeline';
import { SimilarityMeter } from './SimilarityMeter';
import { getFullMediaUrl } from '../services/api';

interface CandidateComparisonProps {
  inputImageUrl: string;
  bestMatch: CandidateResult;
  inputSha256: string;
}

export const CandidateComparison: React.FC<CandidateComparisonProps> = ({
  inputImageUrl,
  bestMatch,
  inputSha256
}) => {
  const candidateThumb = getFullMediaUrl(bestMatch.display_image_url || bestMatch.thumbnail_url);
  const rtype = bestMatch.result_type || 'GENERAL_WEB_RESULT';
  const platform = bestMatch.social_platform;

  return (
    <div className="bg-[#F5F0E3] text-[#141414] border-2 border-[#141414] shadow-brutal p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#141414] pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-[#F50064] uppercase tracking-widest block">
            STAGE 04 // BIOMETRIC COMPARISON & PROVENANCE
          </span>
          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-[#141414] flex items-center gap-2">
            <span>SIDE-BY-SIDE FORENSIC INSPECTION</span>
          </h3>
        </div>

        <div className="mt-2 sm:mt-0 flex flex-wrap items-center gap-2">
          {/* Result Type Badge */}
          {rtype === 'SOCIAL_MEDIA_POST' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#F50064] text-white font-mono text-xs font-bold border border-[#141414]">
              <Share2 className="w-3.5 h-3.5" />
              <span>VERIFIED SOCIAL MEDIA POST</span>
            </div>
          )}
          {rtype === 'SOCIAL_MEDIA_PROFILE' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#1D6B56] text-white font-mono text-xs font-bold border border-[#141414]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>SOCIAL MEDIA PROFILE</span>
            </div>
          )}
          {rtype === 'GENERAL_WEB_RESULT' && (
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#00E599]/20 border border-[#00E599]/60 text-[#0A2E23] font-mono text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-[#0A2E23]" />
              <span>VERIFIED GENERAL WEB MATCH</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Dual Image Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-6">
        
        {/* Left: Input Face */}
        <div className="bg-white border-2 border-[#141414] p-4 flex flex-col justify-between shadow-brutal-sm text-[#141414]">
          <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2 mb-3">
            <span className="text-xs font-mono font-bold text-[#0A2E23] uppercase">
              [A] INPUT SUBJECT ARTIFACT
            </span>
            <span className="text-[10px] font-mono text-[#666666] font-bold">LOCAL FILE</span>
          </div>

          <div className="bg-[#141414] p-2 border border-[#141414] mb-3 flex items-center justify-center min-h-[220px]">
            <img
              src={inputImageUrl}
              alt="Input Subject"
              className="max-h-56 object-contain"
            />
          </div>

          <div className="text-[11px] font-mono text-[#555555] truncate">
            SHA-256: <strong className="text-[#141414] font-bold">{inputSha256.slice(0, 16)}...</strong>
          </div>
        </div>

        {/* Right: Discovered Match */}
        <div className="bg-white border-2 border-[#141414] p-4 flex flex-col justify-between shadow-brutal-sm text-[#141414]">
          <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2 mb-3">
            <span className="text-xs font-mono font-bold text-[#F50064] uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              [B] DISCOVERED {platform ? platform.toUpperCase() : 'WEB'} MATCH
            </span>
            <span className="text-[10px] font-mono bg-[#F50064] text-white px-2 py-0.5 font-bold uppercase">
              {rtype.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-[#141414] p-2 border border-[#141414] mb-3 flex items-center justify-center min-h-[220px]">
            {candidateThumb ? (
              <img
                src={candidateThumb}
                alt={bestMatch.page_title}
                className="max-h-56 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-[#FAF7F0] font-mono text-xs">Thumbnail Rendered</div>
            )}
          </div>

          <div className="text-[11px] font-mono flex items-center justify-between">
            <span className="text-[#444444] font-semibold truncate max-w-[200px]">{bestMatch.page_title}</span>
            <a
              href={bestMatch.url}
              target="_blank"
              rel="noreferrer"
              className="text-[#F50064] font-bold hover:underline flex items-center gap-1"
            >
              <span>SOURCE ↗</span>
            </a>
          </div>
        </div>

      </div>

      {/* Similarity Horizontal Gauge Meter */}
      <SimilarityMeter similarityScore={bestMatch.similarity_score} threshold={0.65} />

    </div>
  );
};
