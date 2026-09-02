import { PipelineResult } from '../types/pipeline';

export function downloadJsonReport(result: PipelineResult): void {
  const exportPayload = {
    pipeline_id: result.job_id,
    generated_at: new Date().toISOString(),
    system: "FaceTrace Ledger Forensic Lab v1.0",
    input: {
      filename: result.image_filename,
      sha256: result.image_sha256,
      face_detection: result.face_detection,
      face_encoding_dimension: result.face_encoding.dimension,
    },
    search: {
      provider: result.search.provider,
      total_results_found: result.search.results_found,
    },
    verified_candidate: {
      source_url: result.record?.source_url || result.best_match?.url,
      source_domain: result.record?.source_domain || result.best_match?.domain,
      result_title: result.record?.result_title || result.best_match?.page_title,
      similarity_score: result.record?.similarity_score ?? result.best_match?.similarity_score,
      match_threshold: 0.65,
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
