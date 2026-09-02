import { PipelineResult } from '../types/pipeline';

export function downloadCsvReport(result: PipelineResult): void {
  const headers = [
    "pipeline_id",
    "timestamp",
    "image_filename",
    "image_sha256",
    "face_confidence",
    "search_provider",
    "source_url",
    "source_domain",
    "similarity_score",
    "record_hash",
    "blockchain_network",
    "transaction_hash",
    "block_number",
    "submitter_address",
    "verification_status"
  ];

  const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const row = [
    escapeCsv(result.job_id),
    escapeCsv(result.record?.verified_at || new Date().toISOString()),
    escapeCsv(result.image_filename),
    escapeCsv(result.image_sha256),
    escapeCsv(result.face_detection?.confidence),
    escapeCsv(result.search?.provider),
    escapeCsv(result.record?.source_url || result.best_match?.url),
    escapeCsv(result.record?.source_domain || result.best_match?.domain),
    escapeCsv(result.record?.similarity_score ?? result.best_match?.similarity_score),
    escapeCsv(result.record_hash),
    escapeCsv(result.blockchain?.network),
    escapeCsv(result.blockchain?.transaction_hash),
    escapeCsv(result.blockchain?.block_number),
    escapeCsv(result.blockchain?.submitter),
    escapeCsv(result.verification?.verified ? "VERIFIED" : "FAILED")
  ];

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row.join(',')].join('\n');
  const encodedUri = encodeURI(csvContent);
  const dateStr = new Date().toISOString().slice(0, 10);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", encodedUri);
  downloadAnchor.setAttribute("download", `facetrace-ledger-summary-${dateStr}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
