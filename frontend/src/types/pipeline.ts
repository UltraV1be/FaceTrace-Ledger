export type PipelineStage = 
  | 'idle'
  | 'image_loading'
  | 'face_detection'
  | 'face_encoding'
  | 'reverse_search'
  | 'candidate_verification'
  | 'canonical_record'
  | 'crypto_hashing'
  | 'blockchain_upload'
  | 'pipeline_complete'
  | 'pipeline_error';

export type StageStatus = 'idle' | 'processing' | 'success' | 'failed' | 'waiting';

export interface StageInfo {
  id: string;
  number: string;
  name: string;
  description: string;
  status: StageStatus;
  message?: string;
  data?: Record<string, any>;
}

export type ResultType = 
  | 'SOCIAL_MEDIA_POST' 
  | 'SOCIAL_MEDIA_PROFILE' 
  | 'SOCIAL_MEDIA_PAGE' 
  | 'GENERAL_WEB_RESULT';

export interface CandidateResult {
  url: string;
  domain: string;
  page_title: string;
  thumbnail_url?: string;
  display_image_url?: string;
  description?: string;
  provider: string;
  is_social_media?: boolean;
  social_platform?: string | null;
  result_type?: ResultType;
  similarity_score: number;
  face_detected: boolean;
  match: boolean;
  candidate_local_image?: string;
}

export interface FaceDetectionData {
  detected: boolean;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface BlockchainData {
  network: string;
  contract_address: string;
  transaction_hash: string;
  block_number: number;
  submitter: string;
  timestamp: number;
}

export interface VerificationRecord {
  record_version: string;
  source_url: string;
  source_domain: string;
  result_type: ResultType | string;
  is_social_media: boolean;
  social_platform?: string | null;
  result_title: string;
  image_sha256: string;
  candidate_image_sha256?: string | null;
  similarity_score: number;
  similarity_threshold: number;
  search_provider: string;
  verified_at: string;
}

export interface PipelineResult {
  status: 'completed' | 'failed' | 'no_match';
  job_id: string;
  image_filename: string;
  image_url: string;
  image_sha256: string;
  face_detection: FaceDetectionData;
  face_encoding: {
    dimension: number;
    ephemeral: boolean;
  };
  search: {
    provider: string;
    results_found: number;
    social_media_count?: number;
  };
  candidates: CandidateResult[];
  best_match: CandidateResult;
  record: VerificationRecord;
  record_hash: string;
  canonical_payload: string;
  blockchain: BlockchainData;
  verification: {
    verified: boolean;
    status: string;
  };
}

export interface SystemStatus {
  status: string;
  components: {
    face_engine: { status: string; model: string };
    search_provider: { status: string; provider: string; has_key: boolean };
    blockchain: { status: string; network: string; contract_deployed: boolean };
  };
}

export interface TraceHistoryItem {
  id: string;
  timestamp: string;
  image_name: string;
  image_sha256_short: string;
  status: 'verified' | 'no_match' | 'failed';
  score?: number;
  domain?: string;
  result_type?: string;
  social_platform?: string | null;
  record_hash_short?: string;
  tx_hash_short?: string;
}
