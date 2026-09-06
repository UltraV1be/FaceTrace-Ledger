import { useState, useCallback, useEffect } from 'react';
import { PipelineResult, StageInfo, SystemStatus, TraceHistoryItem } from '../types/pipeline';
import {
  uploadAndRunPipeline,
  subscribeToPipelineEvents,
  getPipelineResult,
  getHealthStatus,
  getSampleImages,
  cancelPipeline,
  restartPipeline,
  getSearchDiagnostics
} from '../services/api';

const INITIAL_STAGES: StageInfo[] = [
  { id: 'image_loading', number: '01', name: 'ACQUIRE', description: 'Load image binary & calculate SHA-256', status: 'idle' },
  { id: 'face_detection', number: '02', name: 'DETECT', description: 'Isolate primary facial bounding box', status: 'idle' },
  { id: 'face_encoding', number: '03', name: 'ENCODE', description: 'Compute 512-d normalized vector', status: 'idle' },
  { id: 'reverse_search', number: '04', name: 'SEARCH', description: 'Optimize & execute live Google Lens query', status: 'idle' },
  { id: 'candidate_verification', number: '05', name: 'COMPARE', description: 'Prioritize social media & check threshold', status: 'idle' },
  { id: 'canonical_record', number: '06', name: 'FINGERPRINT', description: 'Canonical JSON & SHA-256 digest', status: 'idle' },
  { id: 'blockchain_upload', number: '07', name: 'LEDGER', description: 'Register & verify on Ethereum contract', status: 'idle' },
];

export function usePipeline() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sampleFilename, setSampleFilename] = useState<string | undefined>(undefined);
  const [requireSocialMedia, setRequireSocialMedia] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [stages, setStages] = useState<StageInfo[]>(INITIAL_STAGES);
  const [currentStageId, setCurrentStageId] = useState<string | undefined>();
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [searchDiagnostics, setSearchDiagnostics] = useState<any | null>(null);
  const [sampleImages, setSampleImages] = useState<Array<{ filename: string; url: string; size_kb: number }>>([]);
  const [history, setHistory] = useState<TraceHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('facetrace_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch health and sample images on mount
  useEffect(() => {
    getHealthStatus()
      .then(setSystemStatus)
      .catch((err) => console.warn('Health check warning:', err));

    getSearchDiagnostics()
      .then(setSearchDiagnostics)
      .catch((err) => console.warn('Search diagnostics warning:', err));

    getSampleImages()
      .then((res) => setSampleImages(res.samples))
      .catch((err) => console.warn('Sample images warning:', err));
  }, []);

  const saveToHistory = useCallback((res: PipelineResult) => {
    const newItem: TraceHistoryItem = {
      id: res.job_id,
      timestamp: res.record?.verified_at || new Date().toISOString(),
      image_name: res.image_filename,
      image_sha256_short: `${res.image_sha256.slice(0, 8)}...`,
      status: res.verification?.verified ? 'verified' : res.status === 'no_match' ? 'no_match' : 'failed',
      score: res.record?.similarity_score ?? res.best_match?.similarity_score,
      domain: res.record?.source_domain || res.best_match?.domain,
      result_type: res.record?.result_type,
      social_platform: res.record?.social_platform,
      record_hash_short: res.record_hash ? `${res.record_hash.slice(0, 8)}...` : undefined,
      tx_hash_short: res.blockchain?.transaction_hash ? `${res.blockchain.transaction_hash.slice(0, 8)}...` : undefined,
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev.filter((i) => i.id !== newItem.id)].slice(0, 20);
      try {
        localStorage.setItem('facetrace_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('facetrace_history');
    } catch {}
  };

  const handleFileSelected = useCallback((file: File | null, sampleName?: string) => {
    setSelectedFile(file);
    setSampleFilename(sampleName);
    setPipelineResult(null);
    setErrorMessage(null);
    setErrorDetails(null);
    setIsCancelled(false);
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'idle', message: undefined })));
  }, []);

  const resetToNewInvestigation = useCallback(() => {
    setSelectedFile(null);
    setSampleFilename(undefined);
    setPipelineResult(null);
    setErrorMessage(null);
    setErrorDetails(null);
    setIsProcessing(false);
    setIsCancelling(false);
    setIsCancelled(false);
    setCurrentJobId(null);
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'idle', message: undefined })));
  }, []);

  const attachEventStream = (jobId: string) => {
    return subscribeToPipelineEvents(
      jobId,
      (eventData) => {
        const { stage, status, message, data } = eventData;
        setCurrentStageId(stage);

        setStages((prev) => {
          let stageFound = false;
          return prev.map((s) => {
            if (s.id === stage) {
              stageFound = true;
              return { ...s, status: status as any, message, data };
            }
            if (status === 'failed' && !stageFound && s.status === 'waiting') {
              return { ...s, status: 'idle' as any, message: 'Not executed' };
            }
            return s;
          });
        });

        if (stage === 'pipeline_complete' && data) {
          setPipelineResult(data);
          saveToHistory(data);
          setIsProcessing(false);
        } else if (stage === 'pipeline_error') {
          setErrorMessage(message || 'Pipeline failed');
          setErrorDetails(data);
          setIsProcessing(false);
        } else if (stage === 'pipeline_cancelled') {
          setIsCancelled(true);
          setIsProcessing(false);
          setIsCancelling(false);
          setErrorMessage('Pipeline execution was stopped by user.');
        }
      },
      async () => {
        try {
          const finalRes = await getPipelineResult(jobId);
          if (finalRes) {
            setPipelineResult(finalRes);
            saveToHistory(finalRes);
          }
        } catch {}
        setIsProcessing(false);
      },
      (err) => {
        console.warn('SSE stream update:', err);
        getPipelineResult(jobId)
          .then((finalRes) => {
            if (finalRes) {
              setPipelineResult(finalRes);
              saveToHistory(finalRes);
            }
          })
          .catch(() => {})
          .finally(() => setIsProcessing(false));
      }
    );
  };

  const startPipeline = async () => {
    setIsProcessing(true);
    setIsCancelling(false);
    setIsCancelled(false);
    setErrorMessage(null);
    setErrorDetails(null);
    setPipelineResult(null);

    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'waiting', message: undefined })));

    try {
      const initRes = await uploadAndRunPipeline(
        selectedFile || undefined,
        sampleFilename,
        requireSocialMedia
      );
      const jobId = initRes.job_id;
      setCurrentJobId(jobId);
      attachEventStream(jobId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start trace');
      setIsProcessing(false);
    }
  };

  const cancelExecution = async () => {
    if (!currentJobId || !isProcessing) return;
    setIsCancelling(true);
    try {
      await cancelPipeline(currentJobId);
      setIsCancelled(true);
    } catch (err: any) {
      console.warn('Cancel request error:', err);
    } finally {
      setIsCancelling(false);
      setIsProcessing(false);
    }
  };

  const restartExecution = async () => {
    if (!currentJobId) {
      return startPipeline();
    }
    setIsProcessing(true);
    setIsCancelling(false);
    setIsCancelled(false);
    setErrorMessage(null);
    setErrorDetails(null);
    setPipelineResult(null);
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'waiting', message: undefined })));

    try {
      const restartRes = await restartPipeline(currentJobId);
      const newJobId = restartRes.job_id;
      setCurrentJobId(newJobId);
      attachEventStream(newJobId);
    } catch (err: any) {
      // Fallback to startPipeline
      startPipeline();
    }
  };

  return {
    selectedFile,
    sampleFilename,
    requireSocialMedia,
    setRequireSocialMedia,
    isProcessing,
    isCancelling,
    isCancelled,
    currentJobId,
    stages,
    currentStageId,
    pipelineResult,
    errorMessage,
    errorDetails,
    systemStatus,
    searchDiagnostics,
    sampleImages,
    history,
    handleFileSelected,
    startPipeline,
    cancelExecution,
    restartExecution,
    resetToNewInvestigation,
    clearHistory
  };
}
