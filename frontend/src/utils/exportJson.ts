import { PipelineResult } from '../types/pipeline';

export function downloadJsonReport(result: PipelineResult): void {
  const exportPayload = {
    pipeline_id: result.job_id,
    generated_at: new Date().toISOString(),
    system: "FaceTrace Ledger Forensic Lab v1.1",
    input: {
      filename: result.image_filename,
      sha256: result.image_sha256,
      face_detection: result.face_detection,
      face_encoding_dimension: result.face_encoding.dimension,
    },
    search: {
      provider: result.search.provider,
      total_results_found: result.search.results_found,
      social_media_count: result.search.social_media_count,
    },
    verified_candidate: {
      result_type: result.record?.result_type || result.best_match?.result_type || "GENERAL_WEB_RESULT",
      is_social_media: result.record?.is_social_media ?? result.best_match?.is_social_media ?? false,
      social_platform: result.record?.social_platform || result.best_match?.social_platform || null,
      source_url: result.record?.source_url || result.best_match?.url,
      source_domain: result.record?.source_domain || result.best_match?.domain,
      result_title: result.record?.result_title || result.best_match?.page_title,
      similarity_score: result.record?.similarity_score ?? result.best_match?.similarity_score,
      similarity_threshold: result.record?.similarity_threshold ?? 0.65,
    },
    cryptography: {
      algorithm: "SHA-256",
      record_hash: result.record_hash,
      canonical_record: result.record,
    },
    blockchain: {
      network: result.blockchain.network,
      contract_address: result.blockchain.contract_address,
      transaction_hash: result.blockchain.transaction_hash,
      block_number: result.blockchain.block_number,
      submitter: result.blockchain.submitter,
      block_timestamp: result.blockchain.timestamp,
    },
    integrity_verification: {
      verified: result.verification.verified,
      status: result.verification.status,
    }
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `facetrace-ledger-evidence-${result.job_id.slice(0, 8)}-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
