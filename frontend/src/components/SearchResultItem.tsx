import React from 'react';
import { ExternalLink, CheckCircle, XCircle, Globe } from 'lucide-react';
import { CandidateResult } from '../types/pipeline';
import { getFullMediaUrl } from '../services/api';

interface SearchResultItemProps {
  candidate: CandidateResult;
  index: number;
  isBestMatch?: boolean;
}

export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  candidate,
  index,
  isBestMatch = false
}) => {
  const thumbUrl = candidate.display_image_url || candidate.thumbnail_url;
  const fullThumb = getFullMediaUrl(thumbUrl);
  const scorePercent = (candidate.similarity_score * 100).toFixed(1);

  return (
    <div
      className={`p-4 border-2 transition text-[#141414] ${
        isBestMatch
          ? 'bg-[#FAF7F0] border-[#F50064] shadow-brutal-pink'
          : 'bg-white border-[#141414] hover:bg-[#FAF7F0] shadow-brutal-sm'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Index & Info */}
        <div className="flex items-start space-x-3 min-w-0">
          
          {/* Thumbnail */}
          {fullThumb ? (
            <img
              src={fullThumb}
              alt={candidate.page_title}
              className="w-14 h-14 object-cover border-2 border-[#141414] shrink-0 bg-[#242424]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-14 h-14 bg-[#0A2E23] text-[#FAF7F0] flex items-center justify-center shrink-0 border-2 border-[#141414] font-mono text-xs font-bold">
              #{index + 1}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-xs font-bold text-[#F50064]">
                #{String(index + 1).padStart(2, '0')}
              </span>
              <span className="px-2 py-0.5 bg-[#0A2E23] text-[#FAF7F0] text-[10px] font-mono uppercase font-bold flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-[#00E599]" />
                {candidate.domain || 'web'}
              </span>
              {isBestMatch && (
                <span className="px-2 py-0.5 bg-[#F50064] text-white text-[10px] font-mono uppercase font-bold">
                  ★ TOP VERIFIED CANDIDATE
                </span>
              )}
            </div>

            <h4 className="font-display font-bold text-sm text-[#141414] truncate max-w-md">
              {candidate.page_title || 'Untitled Web Match'}
            </h4>

            <a
              href={candidate.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-[#555555] hover:text-[#F50064] truncate block mt-0.5"
            >
              {candidate.url}
            </a>
          </div>

        </div>

        {/* Right: Score & Link Button */}
        <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#141414]/15">
          
          <div className="text-right font-mono">
            <div className="text-[10px] text-[#666666] uppercase font-bold">SIMILARITY</div>
            <div className={`text-base font-bold flex items-center space-x-1 ${
              candidate.match ? 'text-[#0A2E23]' : 'text-[#777777]'
            }`}>
              {candidate.match ? (
                <CheckCircle className="w-4 h-4 text-[#00E599]" />
              ) : (
                <XCircle className="w-4 h-4 text-[#888888]" />
              )}
              <span className="text-[#141414] font-black">{scorePercent}%</span>
            </div>
          </div>

          <a
            href={candidate.url}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-[#141414] text-[#FAF7F0] hover:bg-[#F50064] hover:text-white transition font-mono text-xs font-bold flex items-center space-x-1.5 shadow-brutal-sm"
          >
            <span>VIEW</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

        </div>

      </div>
    </div>
  );
};
