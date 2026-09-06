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
    <div className="bg-goa-cream text-goa-dark border-2 border-goa-dark shadow-brutal p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-goa-dark pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-goa-pink uppercase tracking-widest block">
            STAGE 03-04 // OPEN WEB RECONNAISSANCE
          </span>
          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-goa-dark flex items-center gap-2">
            <span>DISCOVERED CANDIDATES</span>
            <span className="text-xs font-mono bg-goa-pink text-goa-cream px-2.5 py-0.5 font-bold">
              {candidates.length} OF {totalFound} EVALUATED
            </span>
          </h3>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3 text-xs font-mono">
          <div className="bg-white border-2 border-goa-dark px-3 py-1 text-goa-dark font-bold shadow-brutal">
            PROVIDER: <span className="font-bold text-goa-green">{provider.toUpperCase()}</span>
          </div>

          <button
            onClick={() => setShowOnlyMatches(!showOnlyMatches)}
            className={`px-3 py-1.5 border-2 transition font-bold flex items-center space-x-1.5 shadow-brutal ${
              showOnlyMatches
                ? 'bg-goa-pink text-goa-cream border-goa-dark'
                : 'bg-white text-goa-dark border-goa-dark hover:bg-goa-cream'
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
        <div className="bg-white border-2 border-dashed border-goa-dark/40 p-8 text-center">
          <Search className="w-8 h-8 mx-auto text-[#888888] mb-2" />
          <p className="font-display font-bold text-sm uppercase text-goa-dark">
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
