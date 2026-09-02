import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { CandidateResult } from '../types/pipeline';
import { SearchResultItem } from './SearchResultItem';

interface SearchResultsProps {
  candidates: CandidateResult[];
  provider: string;
  totalFound: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  candidates,
  provider,
  totalFound
}) => {
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);

  const filtered = showOnlyMatches
    ? candidates.filter((c) => c.match)
    : candidates;

  return (
    <div className="bg-[#F5F0E3] text-[#141414] border-2 border-[#141414] shadow-brutal p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#141414] pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-[#F50064] uppercase tracking-widest block">
            STAGE 03-04 // OPEN WEB RECONNAISSANCE
          </span>
          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-[#141414] flex items-center gap-2">
            <span>DISCOVERED CANDIDATES</span>
            <span className="text-xs font-mono bg-[#F50064] text-white px-2.5 py-0.5 font-bold">
              {candidates.length} OF {totalFound} EVALUATED
            </span>
          </h3>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3 text-xs font-mono">
          <div className="bg-white border-2 border-[#141414] px-3 py-1 text-[#141414] font-bold shadow-brutal-sm">
            PROVIDER: <span className="font-bold text-[#0A2E23]">{provider.toUpperCase()}</span>
          </div>

          <button
            onClick={() => setShowOnlyMatches(!showOnlyMatches)}
            className={`px-3 py-1.5 border-2 transition font-bold flex items-center space-x-1.5 shadow-brutal-sm ${
              showOnlyMatches
                ? 'bg-[#F50064] text-white border-[#141414]'
                : 'bg-white text-[#141414] border-[#141414] hover:bg-[#FAF7F0]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>THRESHOLD PASSED ONLY</span>
          </button>
        </div>
      </div>

      {/* Candidate List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((candidate, idx) => (
            <SearchResultItem
              key={`${candidate.url}-${idx}`}
              candidate={candidate}
              index={idx}
              isBestMatch={idx === 0 && candidate.match}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-[#141414]/40 p-8 text-center">
          <Search className="w-8 h-8 mx-auto text-[#888888] mb-2" />
          <p className="font-display font-bold text-sm uppercase text-[#141414]">
            NO CANDIDATES MATCHING FILTER
          </p>
          <p className="text-xs font-mono text-[#555555] mt-1">
            Toggle filter to view all evaluated candidates.
          </p>
        </div>
      )}

    </div>
  );
};
