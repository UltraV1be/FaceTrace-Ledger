import React from 'react';
import { Check, X, RefreshCw, Clock, Ban, RotateCcw, PlusCircle, AlertCircle } from 'lucide-react';
import { StageInfo } from '../types/pipeline';

interface PipelineProgressProps {
  stages: StageInfo[];
  currentStageId?: string;
  isProcessing: boolean;
  isCancelling?: boolean;
  isCancelled?: boolean;
  onStop?: () => void;
  onRestart?: () => void;
  onNewInvestigation?: () => void;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  stages,
  currentStageId,
  isProcessing,
  isCancelling = false,
  isCancelled = false,
  onStop,
  onRestart,
  onNewInvestigation
}) => {
  return (
    <div className="bg-[#0A2E23] border-2 border-[#141414] shadow-brutal p-6 lg:p-8 text-[#FAF7F0]">
      
      {/* Header with Control Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/15 pb-5 mb-6 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#F50064] uppercase tracking-widest block">
            LIVE FORENSIC MONITOR
          </span>
          <h3 className="font-display font-black text-2xl tracking-tight text-[#FAF7F0] uppercase">
            PIPELINE EXECUTION STAGES
          </h3>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          
          {/* Running State -> Stop Button */}
          {isProcessing && (
            <button
              onClick={onStop}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase transition flex items-center space-x-1.5 border border-white/20 shadow-brutal-sm cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              {isCancelling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>STOPPING...</span>
                </>
              ) : (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  <span>[ STOP EXECUTION ]</span>
                </>
              )}
            </button>
          )}

          {/* Stopped / Failed / Completed State -> Restart & New Buttons */}
          {!isProcessing && (
            <>
              {onRestart && (
                <button
                  onClick={onRestart}
                  className="px-3.5 py-2 bg-[#F50064] hover:bg-[#FF006E] text-white font-bold uppercase transition flex items-center space-x-1.5 border border-[#141414] shadow-brutal-pink cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>[ RESTART TRACE ]</span>
                </button>
              )}

              {onNewInvestigation && (
                <button
                  onClick={onNewInvestigation}
                  className="px-3.5 py-2 bg-white text-[#141414] hover:bg-[#FAF7F0] font-bold uppercase transition flex items-center space-x-1.5 border border-[#141414] shadow-brutal-sm cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#0A2E23]" />
                  <span>[ NEW IMAGE ]</span>
                </button>
              )}
            </>
          )}

          <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-white/10 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isProcessing ? 'bg-[#F50064] animate-ping' : isCancelled ? 'bg-amber-400' : 'bg-[#00E599]'}`} />
            <span className="text-[#EBE3D0]">
              {isProcessing ? 'ACTIVE EXECUTION' : isCancelled ? 'CANCELLED' : 'STANDBY'}
            </span>
          </div>

        </div>
      </div>

      {/* Grid of stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {stages.map((stage) => {
          const isCurrent = stage.id === currentStageId;
          const isSuccess = stage.status === 'success';
          const isFailed = stage.status === 'failed';
          const isWorking = stage.status === 'processing';
          const isStageCancelled = stage.status === ('cancelled' as any) || (isCancelled && isCurrent);

          return (
            <div
              key={stage.id}
              className={`p-3.5 border-2 transition relative flex flex-col justify-between min-h-[135px] text-[#FAF7F0] ${
                isWorking || isCurrent
                  ? 'border-[#F50064] bg-[#F50064]/15 shadow-brutal-pink'
                  : isSuccess
                  ? 'border-[#00E599]/60 bg-[#00E599]/10'
                  : isFailed
                  ? 'border-red-500 bg-red-950/50'
                  : isStageCancelled
                  ? 'border-amber-400/80 bg-amber-950/40'
                  : 'border-white/10 bg-[#071F17]/80 opacity-70'
              }`}
            >
              {/* Top row: Number & Status Icon */}
              <div className="flex items-center justify-between mb-2">
                <span className={`font-mono text-xs font-black ${isCurrent ? 'text-[#F50064]' : 'text-[#EBE3D0]'}`}>
                  {stage.number}
                </span>

                <div className="w-5 h-5 flex items-center justify-center">
                  {isWorking && <RefreshCw className="w-3.5 h-3.5 text-[#F50064] animate-spin" />}
                  {isSuccess && <Check className="w-4 h-4 text-[#00E599] font-black" />}
                  {isFailed && <X className="w-4 h-4 text-red-400 font-black" />}
                  {isStageCancelled && <Ban className="w-3.5 h-3.5 text-amber-400" />}
                  {stage.status === 'waiting' && <Clock className="w-3.5 h-3.5 text-white/30" />}
                  {stage.status === 'idle' && <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />}
                </div>
              </div>

              {/* Middle: Stage Title */}
              <div>
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#FAF7F0] leading-snug">
                  {stage.name}
                </h4>
                <p className="text-[10px] font-mono text-[#DED3BA] mt-1 line-clamp-2 leading-tight">
                  {stage.message || stage.description}
                </p>
              </div>

              {/* Bottom State Badge */}
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono uppercase font-bold">
                <span className={
                  isWorking ? 'text-[#F50064]' :
                  isSuccess ? 'text-[#00E599]' :
                  isFailed ? 'text-red-400' :
                  isStageCancelled ? 'text-amber-400' : 'text-[#888888]'
                }>
                  {isWorking ? 'PROCESSING' : stage.status}
                </span>
                {isWorking && <span className="w-1.5 h-1.5 bg-[#F50064] rounded-full animate-ping" />}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
