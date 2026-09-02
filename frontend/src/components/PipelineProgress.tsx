import React from 'react';
import { Check, X, RefreshCw, Clock, ArrowRight } from 'lucide-react';
import { StageInfo } from '../types/pipeline';

interface PipelineProgressProps {
  stages: StageInfo[];
  currentStageId?: string;
  isProcessing: boolean;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  stages,
  currentStageId,
  isProcessing
}) => {
  return (
    <div className="bg-forest-900 border border-white/10 p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-pink uppercase tracking-widest block">
            LIVE FORENSIC MONITOR
          </span>
          <h3 className="font-display font-bold text-2xl tracking-tight text-cream-100 uppercase">
            PIPELINE EXECUTION STAGES
          </h3>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center space-x-2 text-xs font-mono">
          <span className={`w-2.5 h-2.5 rounded-full ${isProcessing ? 'bg-pink animate-ping' : 'bg-emerald'}`} />
          <span className="text-cream-200">
            {isProcessing ? 'ACTIVE EXECUTION IN PROGRESS' : 'PIPELINE STANDBY'}
          </span>
        </div>
      </div>

      {/* Grid of stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {stages.map((stage) => {
          const isCurrent = stage.id === currentStageId;
          const isSuccess = stage.status === 'success';
          const isFailed = stage.status === 'failed';
          const isWorking = stage.status === 'processing';

          return (
            <div
              key={stage.id}
              className={`p-3.5 border transition relative flex flex-col justify-between min-h-[130px] ${
                isCurrent
                  ? 'border-pink bg-pink/10 shadow-brutal-sm'
                  : isSuccess
                  ? 'border-emerald/40 bg-emerald/5'
                  : isFailed
                  ? 'border-red-500/50 bg-red-500/10'
                  : 'border-white/10 bg-forest-950/60 opacity-60'
              }`}
            >
              {/* Top row: Number & Status Icon */}
              <div className="flex items-center justify-between mb-2">
                <span className={`font-mono text-xs font-bold ${isCurrent ? 'text-pink' : 'text-cream-300/80'}`}>
                  {stage.number}
                </span>

                <div className="w-5 h-5 flex items-center justify-center">
                  {isWorking && <RefreshCw className="w-3.5 h-3.5 text-pink animate-spin" />}
                  {isSuccess && <Check className="w-4 h-4 text-emerald font-bold" />}
                  {isFailed && <X className="w-4 h-4 text-red-500 font-bold" />}
                  {stage.status === 'waiting' && <Clock className="w-3.5 h-3.5 text-white/30" />}
                  {stage.status === 'idle' && <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />}
                </div>
              </div>

              {/* Middle: Stage Title */}
              <div>
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-cream-100 leading-snug">
                  {stage.name}
                </h4>
                <p className="text-[10px] font-mono text-cream-300/70 mt-1 line-clamp-2 leading-tight">
                  {stage.message || stage.description}
                </p>
              </div>

              {/* Bottom State Badge */}
              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono uppercase">
                <span className={isCurrent ? 'text-pink font-bold' : isSuccess ? 'text-emerald' : isFailed ? 'text-red-400' : 'text-cream-300/40'}>
                  {stage.status}
                </span>
                {isWorking && <span className="w-1.5 h-1.5 bg-pink rounded-full animate-ping" />}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
