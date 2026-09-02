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
import { AlertTriangle, Sparkles, Database, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const {
    selectedFile,
    sampleFilename,
    isProcessing,
    stages,
    currentStageId,
    pipelineResult,
    errorMessage,
    systemStatus,
    sampleImages,
    history,
    handleFileSelected,
    startPipeline,
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
    <div className="min-h-screen bg-forest-950 text-cream-100 flex flex-col justify-between selection:bg-pink selection:text-white">
      
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

        {/* Live Execution Monitor */}
        {(isProcessing || pipelineResult || errorMessage) && (
          <section id="pipeline-progress-section" className="scroll-mt-20">
            <PipelineProgress
              stages={stages}
              currentStageId={currentStageId}
              isProcessing={isProcessing}
            />
          </section>
        )}

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="p-6 bg-red-950 border-2 border-red-500 text-cream-100 font-mono shadow-brutal flex items-start space-x-4">
            <AlertTriangle className="w-6 h-6 text-pink shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-pink uppercase text-sm">
                EXECUTION ANOMALY DETECTED
              </h4>
              <p className="text-xs text-cream-200 mt-1 leading-relaxed">
                {errorMessage}
              </p>
              <div className="mt-3 text-[11px] text-cream-300/70 border-t border-red-800/50 pt-2">
                Tip: Verify that SEARCH_API_KEY is configured in your .env file or choose another image containing a clearly visible face.
              </div>
            </div>
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

            {/* 3. Discovered Web Candidates List */}
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
