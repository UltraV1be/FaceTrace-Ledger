import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert, 
  HelpCircle, 
  Search, 
  Ban,
  RotateCcw,
  PlusCircle
} from 'lucide-react';
import { StageInfo } from '../types/pipeline';

interface PipelineFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage: string | null;
  errorDetails: any | null;
  stages: StageInfo[];
  currentStageId?: string;
  executionId?: string | null;
  onTerminateProcess: () => void;
  onStartNewProcess: () => void;
  onRestart?: () => void;
  onNewInvestigation?: () => void;
}

export const PipelineFailureModal: React.FC<PipelineFailureModalProps> = ({
  isOpen,
  onClose,
  errorMessage,
  errorDetails,
  stages,
  currentStageId,
  executionId,
  onTerminateProcess,
  onStartNewProcess,
  onRestart,
  onNewInvestigation
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!isOpen) return null;

  // Identify the failing stage
  const failedStageObj = stages.find((s) => s.status === 'failed') || 
                         stages.find((s) => s.id === (errorDetails?.stage || currentStageId)) ||
                         stages.find((s) => s.id === currentStageId);

  const stageNumber = failedStageObj?.number || errorDetails?.stage_name?.slice(0, 2) || errorDetails?.stage_number?.toString().padStart(2, '0') || '05';
  const stageName = failedStageObj?.name || errorDetails?.stage_name?.replace(/^\d+\s*—\s*/, '') || 'COMPARE';

  // Extract human-readable valid reason and details
  const validReason = errorDetails?.valid_reason || 
                      errorDetails?.error_message || 
                      errorMessage || 
                      failedStageObj?.message || 
                      'No candidate passed the configured comparison threshold.';

  const details = errorDetails?.details || 
                  (errorDetails?.candidates_checked !== undefined ? 
                    `${errorDetails.candidates_checked} candidates were returned by SEARCH, but none met the configured comparison threshold (${errorDetails?.threshold ?? 0.60}).` :
                    'Stage execution did not meet required criteria for downstream processing.');

  const errorCode = errorDetails?.error_code || 'PIPELINE_EXECUTION_HALTED';

  // Calculate blocked downstream stages
  const blockedStagesList: string[] = errorDetails?.blocked_stages && errorDetails.blocked_stages.length > 0 
    ? errorDetails.blocked_stages 
    : (() => {
        const failedIndex = stages.findIndex((s) => s.id === failedStageObj?.id || s.status === 'failed');
        if (failedIndex >= 0) {
          return stages.slice(failedIndex + 1).map((s) => `${s.number} — ${s.name}: BLOCKED`);
        }
        return ['06 — FINGERPRINT: BLOCKED', '07 — LEDGER: BLOCKED'];
      })();

  const activeExecId = executionId || errorDetails?.execution_id || errorDetails?.job_id || 'EXEC-' + (failedStageObj?.id ? failedStageObj.id.slice(0, 8).toUpperCase() : '7B8A91F2');

  // Get diagnostic recommendation based on failure stage/code
  const getRecommendation = () => {
    switch (errorCode) {
      case 'NO_FACE_DETECTED':
        return 'Ensure the target image contains a clear, unobstructed human face with sufficient resolution and frontal illumination.';
      case 'ENCODING_FAILED':
        return 'The neural feature extractor could not compute the 512-dimensional vector. Try cropping closer to the subject face.';
      case 'SIMILARITY_THRESHOLD_NOT_MET':
      case 'NO_CANDIDATE_PASSED':
        return `Evaluated web candidate portraits did not reach the minimum cosine similarity threshold (${errorDetails?.threshold ?? 0.60}). Consider testing with a different portrait or verifying whether the person has public open-web indexed images.`;
      case 'NO_SEARCH_RESULTS':
        return 'Google Lens returned 0 visual matches across the public index. The target image may be unique, private, or not yet indexed by search engines.';
      case 'SEARCH_PROVIDER_ERROR':
      case 'SERPAPI_QUOTA_EXCEEDED':
      case 'SERPAPI_AUTH_ERROR':
        return 'Check the SERPAPI_KEY in the backend .env configuration file and verify account request limits.';
      case 'BLOCKCHAIN_REGISTRATION_FAILED':
      case 'BLOCKCHAIN_FAILED':
        return 'Verify the local EVM node or Ganache RPC connection at http://127.0.0.1:8545.';
      default:
        return 'Review system diagnostics below, terminate current trace or begin with a new benchmark portrait.';
    }
  };

  const candidatesList = Array.isArray(errorDetails?.candidates) ? errorDetails.candidates : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-goa-cream text-goa-dark border-4 border-goa-dark shadow-[10px_10px_0px_0px_#ff0080] p-6 sm:p-8 max-h-[92vh] overflow-y-auto space-y-5 font-mono">
        
        {/* Top Notification Bar */}
        <div className="flex items-start justify-between border-b-2 border-goa-dark pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-goa-pink text-goa-cream font-mono text-[11px] font-black uppercase tracking-wider border border-goa-dark shadow-brutal-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-goa-cream" />
              <span>PIPELINE EXECUTION HALTED</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-goa-dark uppercase tracking-tight leading-none mt-1">
              FAILED STAGE: {stageNumber} — {stageName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white hover:bg-goa-pink hover:text-goa-cream border-2 border-goa-dark transition text-goa-dark shadow-brutal-sm shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 font-bold" />
          </button>
        </div>

        {/* Structured Failure Information Card */}
        <div className="p-4 sm:p-5 bg-red-100/95 border-2 border-red-600 shadow-brutal space-y-4">
          
          {/* Status & Error Code */}
          <div className="flex items-center justify-between border-b border-red-300 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-red-900">
                STATUS:
              </span>
              <span className="px-2 py-0.5 bg-red-600 text-white font-black text-xs uppercase border border-red-800">
                FAILED
              </span>
            </div>
            <span className="px-2 py-0.5 bg-goa-dark text-goa-pink text-[10px] font-bold border border-red-500">
              {errorCode}
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-900 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              REASON
            </span>
            <p className="text-xs sm:text-sm text-red-950 font-bold leading-snug">
              {validReason}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-1 border-t border-red-200 pt-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-900">
              DETAILS
            </span>
            <p className="text-xs text-red-900 leading-relaxed font-semibold">
              {details}
            </p>
          </div>

          {/* Downstream Stages Blocked */}
          <div className="space-y-1.5 border-t border-red-200 pt-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-900">
              DOWNSTREAM STAGES
            </span>
            <div className="flex flex-wrap gap-2">
              {blockedStagesList.map((st, i) => (
                <span 
                  key={i} 
                  className="px-2 py-0.5 bg-[#4A0010] text-red-200 text-[11px] font-bold border border-red-700 flex items-center gap-1"
                >
                  <Ban className="w-3 h-3 text-red-400" />
                  {st}
                </span>
              ))}
            </div>
          </div>

          {/* Execution Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 pt-2 border-t border-red-200 text-[11px] text-red-950 font-bold">
            <div>EXECUTION: <span className="text-red-700">HALTED</span></div>
            <div className="truncate">EXECUTION ID: <span className="text-red-700">{activeExecId}</span></div>
          </div>

        </div>

        {/* Execution Stage Status Mini-Trajectory */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#555555] block">
            STAGE EXECUTION TRAJECTORY
          </span>
          <div className="grid grid-cols-7 gap-1.5 font-mono text-[10px] text-center">
            {stages.map((st) => {
              const isFail = st.status === 'failed' || st.id === failedStageObj?.id;
              const isPass = st.status === 'success';
              const isBlocked = st.status === 'blocked';

              return (
                <div
                  key={st.id}
                  className={`p-1.5 border border-goa-dark font-bold flex flex-col items-center justify-center ${
                    isFail
                      ? 'bg-red-600 text-goa-cream shadow-brutal-sm'
                      : isPass
                      ? 'bg-goa-green text-goa-cream'
                      : isBlocked
                      ? 'bg-[#1A1A1A] text-red-400 opacity-80'
                      : 'bg-[#E5E0D0] text-[#777777] opacity-60'
                  }`}
                  title={`${st.number} ${st.name}: ${st.status}`}
                >
                  <span className="text-[9px] block">{st.number}</span>
                  <span className="truncate w-full text-[9px]">{st.name}</span>
                  <span className="text-[8px] uppercase mt-0.5 font-mono">
                    {isFail ? 'FAIL' : isPass ? 'PASS' : isBlocked ? 'BLOCK' : 'IDLE'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evaluated Candidates Sample Preview if Comparison Failed */}
        {candidatesList.length > 0 && (
          <div className="p-3.5 bg-white border-2 border-goa-dark shadow-brutal space-y-2.5 font-mono">
            <div className="flex items-center justify-between text-xs font-bold text-goa-dark">
              <span className="flex items-center gap-1.5 uppercase text-goa-dark">
                <Search className="w-3.5 h-3.5 text-goa-pink" />
                EVALUATED WEB CANDIDATES ({candidatesList.length})
              </span>
              <span className="text-[10px] text-[#666666]">
                Below Required Threshold ({(errorDetails?.threshold ?? 0.60).toFixed(2)})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {candidatesList.slice(0, 4).map((cand: any, idx: number) => (
                <div key={idx} className="p-2 bg-goa-cream border border-goa-dark text-[10px] space-y-1">
                  <div className="flex justify-between items-center text-[#555555]">
                    <span className="truncate max-w-[70px] font-bold">{cand.domain || 'web'}</span>
                    <span className="text-red-600 font-bold">
                      {cand.similarity_score !== undefined ? `${(cand.similarity_score * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  {cand.display_image_url && (
                    <img 
                      src={cand.display_image_url.startsWith('http') ? cand.display_image_url : `http://localhost:8000${cand.display_image_url}`} 
                      alt="Candidate" 
                      className="w-full h-12 object-cover bg-[#222222] border border-black/20"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="text-[9px] text-[#444444] truncate">{cand.page_title || 'Visual match'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actionable Forensic Remedy */}
        <div className="p-3.5 bg-amber-50 border-2 border-amber-600 shadow-brutal flex items-start space-x-3 font-mono">
          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 uppercase block mb-0.5">
              RECOMMENDED FORENSIC ACTION:
            </span>
            <p className="text-amber-950 leading-relaxed">
              {getRecommendation()}
            </p>
          </div>
        </div>

        {/* Technical Diagnostics Accordion */}
        {errorDetails && (
          <div className="border-2 border-goa-dark bg-white font-mono shadow-brutal">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-3 text-xs text-goa-dark hover:bg-goa-cream flex items-center justify-between font-bold cursor-pointer transition"
            >
              <span className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-goa-pink" />
                <span>TECHNICAL DIAGNOSTIC LOGS & PAYLOAD</span>
              </span>
              {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTechnicalDetails && (
              <div className="p-3.5 border-t-2 border-goa-dark bg-goa-dark text-goa-cream text-[11px] space-y-2">
                <div><span className="text-[#888888]">ERROR CODE:</span> <strong className="text-goa-pink">{errorCode}</strong></div>
                {errorDetails.provider && <div><span className="text-[#888888]">PROVIDER:</span> {errorDetails.provider}</div>}
                {errorDetails.engine && <div><span className="text-[#888888]">ENGINE:</span> {errorDetails.engine}</div>}
                {errorDetails.http_status && <div><span className="text-[#888888]">HTTP STATUS:</span> <strong className="text-goa-yellow">{errorDetails.http_status}</strong></div>}
                {errorDetails.technical_details && (
                  <div>
                    <span className="text-[#888888] block">DIAGNOSTIC PAYLOAD:</span>
                    <pre className="mt-1 p-2 bg-black text-goa-yellow text-[10px] overflow-x-auto border border-goa-dark">
                      {JSON.stringify(errorDetails.technical_details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Action Buttons matching exact user requirements */}
        <div className="pt-2 border-t-2 border-goa-dark flex flex-wrap items-center justify-between gap-3 font-mono text-xs font-bold uppercase">
          <button
            onClick={onClose}
            className="px-3.5 py-3 bg-white text-goa-dark hover:bg-goa-cream border-2 border-goa-dark shadow-brutal transition cursor-pointer"
          >
            [ ✕ DISMISS ]
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onTerminateProcess();
              }}
              className="px-4 py-3 bg-red-700 text-goa-cream hover:bg-red-800 border-2 border-goa-dark shadow-brutal flex items-center space-x-1.5 transition cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <Ban className="w-4 h-4" />
              <span>[ TERMINATE PROCESS ]</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onStartNewProcess();
              }}
              className="px-4 py-3 bg-goa-green text-goa-cream hover:bg-[#144F3F] border-2 border-goa-dark shadow-brutal flex items-center space-x-1.5 transition cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4 text-goa-cream" />
              <span>[ START NEW PROCESS ]</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
