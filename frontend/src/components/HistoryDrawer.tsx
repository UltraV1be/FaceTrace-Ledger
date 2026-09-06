import React from 'react';
import { X, History, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { TraceHistoryItem } from '../types/pipeline';
import { formatTimestamp } from '../utils/formatters';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: TraceHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-goa-cream text-goa-dark h-full border-l-2 border-goa-dark shadow-brutal flex flex-col justify-between p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-goa-dark pb-4">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-goa-green" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-goa-dark">
              TRACE HISTORY
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

        {/* History Item List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border-2 border-goa-dark text-xs font-mono space-y-2 shadow-brutal text-goa-dark"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-goa-green truncate max-w-[180px]">
                    {item.image_name}
                  </span>
                  <span className={`px-2 py-0.5 font-bold uppercase text-[10px] flex items-center gap-1 ${
                    item.status === 'verified'
                      ? 'bg-goa-yellow/20 text-goa-green border border-goa-yellow/80'
                      : 'bg-black/10 text-[#666666]'
                  }`}>
                    {item.status === 'verified' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-goa-yellow" />
                        <span>VERIFIED</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{item.status.toUpperCase()}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-[#555555] text-[11px]">
                  <span>Score: <strong className="text-goa-dark">{item.score ? `${(item.score * 100).toFixed(1)}%` : '—'}</strong></span>
                  <span>Domain: <strong className="text-goa-dark">{item.domain || '—'}</strong></span>
                </div>

                <div className="text-[10px] text-[#666666] border-t border-goa-dark/15 pt-1.5 flex justify-between">
                  <span>{formatTimestamp(item.timestamp)}</span>
                  <span className="text-goa-pink font-bold">{item.image_sha256_short}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-[#666666] text-xs font-mono">
              No recent trace records stored locally.
            </div>
          )}
        </div>

        {/* Footer actions */}
        {history.length > 0 && (
          <div className="border-t-2 border-goa-dark pt-4">
            <button
              onClick={onClearHistory}
              className="w-full py-2.5 px-4 bg-red-50 text-red-700 hover:bg-red-100 border border-red-400 font-mono text-xs font-bold uppercase transition flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR LOCAL HISTORY</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
