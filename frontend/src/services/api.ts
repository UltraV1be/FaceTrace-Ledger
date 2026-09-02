import { PipelineResult, SystemStatus, VerificationRecord } from '../types/pipeline';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function uploadAndRunPipeline(file?: File, sampleFilename?: string): Promise<{ job_id: string; status: string; image_path: string }> {
  const formData = new FormData();
  if (file) {
    formData.append('image', file);
  } else if (sampleFilename) {
    formData.append('sample_filename', sampleFilename);
  }

  const res = await fetch(`${API_BASE}/api/pipeline/run`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to start pipeline analysis');
  }

  return res.json();
}

export function subscribeToPipelineEvents(
  jobId: string,
  onEvent: (data: any) => void,
  onComplete: () => void,
  onError: (err: any) => void
): () => void {
  const eventSource = new EventSource(`${API_BASE}/api/pipeline/events/${jobId}`);

  eventSource.addEventListener('stage_update', (e: MessageEvent) => {
    try {
      const parsed = JSON.parse(e.data);
      onEvent(parsed);
      if (parsed.stage === 'pipeline_complete' || parsed.stage === 'pipeline_error') {
        eventSource.close();
        onComplete();
      }
    } catch (err) {
      console.error('Failed to parse SSE payload', err);
    }
  });

  eventSource.onerror = (err) => {
    console.warn('SSE connection closed or error:', err);
    eventSource.close();
    onError(err);
  };

  return () => {
    eventSource.close();
  };
}

export async function getPipelineResult(jobId: string): Promise<PipelineResult> {
  const res = await fetch(`${API_BASE}/api/pipeline/result/${jobId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job result: ${res.statusText}`);
  }
  const data = await res.json();
  return data.result;
}

export async function verifyRecord(record: VerificationRecord): Promise<{
  local_hash: string;
  blockchain_exists: boolean;
  verified: boolean;
  timestamp: number;
  submitter: string;
  status: string;
  reason?: string;
}> {
  const res = await fetch(`${API_BASE}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Verification request failed');
  }

  return res.json();
}

export async function runTamperTest(
  record: VerificationRecord,
  modifiedField: string,
  modifiedValue: any
): Promise<{
  original: { hash: string; verified: boolean; blockchain_exists: boolean };
  tampered: { hash: string; modified_field: string; modified_value: any; verified: boolean; blockchain_exists: boolean; reason: string };
  tamper_detected: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/tamper-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      record,
      modified_field: modifiedField,
      modified_value: modifiedValue,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Tamper test request failed');
  }

  return res.json();
}

export async function getHealthStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) {
    throw new Error('Health check failed');
  }
  return res.json();
}

export async function getSampleImages(): Promise<{ samples: Array<{ filename: string; url: string; size_kb: number }> }> {
  const res = await fetch(`${API_BASE}/api/sample-images`);
  if (!res.ok) {
    return { samples: [] };
  }
  return res.json();
}

export function getFullMediaUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  return `${API_BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
