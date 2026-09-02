import React, { useRef, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ImageUploader } from './components/ImageUploader';
import { PipelineProgress } from './components/PipelineProgress';
import { FaceDetectionResult } from './components/FaceDetectionResult';
import { SearchResults } from './components/SearchResults';
import { CandidateComparison } from './components/CandidateComparison';
import { BlockchainRecord } from './components/BlockchainRecord';
import { VerificationPanel } from './components/VerificationPanel';
import { TamperTest } from './components/TamperTest';
import { ExportCenter } from './components/ExportCenter';
import { HistoryDrawer } from './components/HistoryDrawer';
import { HowItWorksModal } from './components/HowItWorksModal';
import { Footer } from './components/Footer';
import { usePipeline } from './hooks/usePipeline';
import { getFullMediaUrl } from './services/api';
import { AlertTriangle, RotateCcw, PlusCircle, ChevronDown, ChevronUp, Terminal, ShieldAlert, Ban } from 'lucide-react';

export const App: React.FC = () => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const {
    selectedFile,
    sampleFilename,
    isProcessing,
    isCancelling,
    isCancelled,
    stages,
    currentStageId,
    pipelineResult,
    errorMessage,
    errorDetails,
    systemStatus,
    sampleImages,
    history,
    handleFileSelected,
    startPipeline,
    cancelExecution,
    restartExecution,
    resetToNewInvestigation,
    clearHistory,
  } = usePipeline();

  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const inputImageUrl = pipelineResult?.image_url
    ? getFullMediaUrl(pipelineResult.image_url)
    : selectedFile
    ? URL.createObjectURL(selectedFile)
    : sampleFilename
    ? `http://localhost:8000/media/input/${sampleFilename}`
    : '';

  return (
    <div className="min-h-screen bg-[#071F17] text-[#FAF7F0] flex flex-col justify-between selection:bg-[#F50064] selection:text-white">
      
      {/* Top Header */}
      <Header
        systemStatus={systemStatus}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* Hero Section */}
      <Hero onScrollToWorkspace={scrollToWorkspace} />

      {/* Main Interactive Forensic Workspace */}
      <main ref={workspaceRef} className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
        
        {/* Step 1: Input Evidence Acquisition */}
        <section id="upload-section">
          <ImageUploader
            selectedFile={selectedFile}
            sampleFilename={sampleFilename}
            isProcessing={isProcessing}
            onFileSelected={handleFileSelected}
            onRunTrace={startPipeline}
            sampleImages={sampleImages}
          />
        </section>

        {/* Live Execution Monitor with Stop & Restart Controls */}
        {(isProcessing || pipelineResult || errorMessage || isCancelled) && (
          <section id="pipeline-progress-section" className="scroll-mt-20">
            <PipelineProgress
              stages={stages}
              currentStageId={currentStageId}
              isProcessing={isProcessing}
              isCancelling={isCancelling}
              isCancelled={isCancelled}
              onStop={cancelExecution}
              onRestart={restartExecution}
              onNewInvestigation={resetToNewInvestigation}
            />
          </section>
        )}

        {/* Error / Diagnostics Banner */}
        {errorMessage && (
          <div className="p-6 bg-red-950/90 border-2 border-red-500 text-[#FAF7F0] font-mono shadow-brutal space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                {isCancelled ? (
                  <Ban className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-[#F50064] shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-[#F50064] uppercase text-sm flex items-center gap-2">
                    <span>{isCancelled ? 'EXECUTION CANCELLED' : 'EXECUTION ANOMALY DETECTED'}</span>
                    {errorDetails?.error_code && (
                      <span className="px-2 py-0.5 bg-[#141414] text-[#FAF7F0] text-[10px] border border-red-400/40">
                        {errorDetails.error_code}
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-[#EBE3D0] mt-1 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={restartExecution}
                  className="px-3 py-1.5 bg-[#F50064] text-white text-xs font-bold uppercase hover:bg-[#FF006E] transition flex items-center space-x-1 shadow-brutal-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RETRY</span>
                </button>
                <button
                  onClick={resetToNewInvestigation}
                  className="px-3 py-1.5 bg-white text-[#141414] text-xs font-bold uppercase hover:bg-[#FAF7F0] transition flex items-center space-x-1 shadow-brutal-sm"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>NEW IMAGE</span>
                </button>
              </div>
            </div>

            {/* Expandable Technical Details */}
            {errorDetails && (
              <div className="border-t border-red-800/60 pt-3">
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="text-xs text-[#EBE3D0] hover:text-white flex items-center space-x-1.5 font-bold cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#F50064]" />
                  <span>VIEW TECHNICAL DETAILS</span>
                  {showTechnicalDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showTechnicalDetails && (
                  <div className="mt-2.5 p-3.5 bg-[#141414] border border-red-500/40 text-[11px] space-y-1.5 text-[#EBE3D0]">
                    <div><span className="text-[#888888]">PROVIDER:</span> {errorDetails.provider || 'SerpApi'}</div>
                    <div><span className="text-[#888888]">ENGINE:</span> {errorDetails.engine || 'Google Lens'}</div>
                    {errorDetails.http_status && (
                      <div><span className="text-[#888888]">HTTP STATUS:</span> <strong className="text-[#F50064]">{errorDetails.http_status}</strong></div>
                    )}
                    {errorDetails.technical_details && (
                      <div>
                        <span className="text-[#888888] block">DIAGNOSTIC PAYLOAD:</span>
                        <pre className="mt-1 p-2 bg-[#071F17] text-[#00E599] text-[10px] overflow-x-auto border border-white/10">
                          {JSON.stringify(errorDetails.technical_details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Completed Pipeline Results Feed */}
        {pipelineResult && (
          <div className="space-y-10">
            
            {/* 1. Face Detection & 512-D Ephemeral Embedding */}
            {pipelineResult.face_detection && (
              <section id="face-detection-section">
                <FaceDetectionResult
                  imageUrl={inputImageUrl}
                  faceData={pipelineResult.face_detection}
                  embeddingDimension={pipelineResult.face_encoding?.dimension || 512}
                />
              </section>
            )}

            {/* 2. Side-by-Side Face Comparison & Similarity Meter */}
            {pipelineResult.best_match && (
              <section id="comparison-section">
                <CandidateComparison
                  inputImageUrl={inputImageUrl}
                  bestMatch={pipelineResult.best_match}
                  inputSha256={pipelineResult.image_sha256}
                />
              </section>
            )}

            {/* 3. Discovered Candidates List with Social Badges */}
            {pipelineResult.candidates && pipelineResult.candidates.length > 0 && (
              <section id="search-results-section">
                <SearchResults
                  candidates={pipelineResult.candidates}
                  provider={pipelineResult.search?.provider || 'Google Lens API'}
                  totalFound={pipelineResult.search?.results_found || pipelineResult.candidates.length}
                />
              </section>
            )}

            {/* 4. Immutable Blockchain Ledger Registration */}
            {pipelineResult.blockchain && (
              <section id="blockchain-record-section">
                <BlockchainRecord
                  blockchain={pipelineResult.blockchain}
                  recordHash={pipelineResult.record_hash}
                  canonicalPayload={pipelineResult.canonical_payload}
                  record={pipelineResult.record}
                />
              </section>
            )}

            {/* 5. On-Chain Re-Verification */}
            {pipelineResult.record && (
              <section id="verification-panel-section">
                <VerificationPanel
                  record={pipelineResult.record}
                  currentRecordHash={pipelineResult.record_hash}
                />
              </section>
            )}

            {/* 6. Tamper Detection Simulator Sandbox */}
            {pipelineResult.record && (
              <section id="tamper-test-section">
                <TamperTest originalRecord={pipelineResult.record} />
              </section>
            )}

            {/* 7. Export Center */}
            <section id="export-center-section">
              <ExportCenter result={pipelineResult} />
            </section>

          </div>
        )}

      </main>

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={clearHistory}
      />

      {/* How It Works Protocol Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default App;
