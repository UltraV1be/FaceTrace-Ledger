import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Copy, Check } from 'lucide-react';
import { PipelineResult } from '../types/pipeline';
import { downloadJsonReport } from '../utils/exportJson';
import { downloadCsvReport } from '../utils/exportCsv';
import { generatePdfReport } from '../utils/exportPdf';

interface ExportCenterProps {
  result: PipelineResult;
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ result }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleExportJson = () => {
    downloadJsonReport(result);
    showSuccess('✓ JSON EVIDENCE ARTIFACT EXPORTED');
  };

  const handleExportCsv = () => {
    downloadCsvReport(result);
    showSuccess('✓ CSV AUDIT SUMMARY EXPORTED');
  };

  const handleExportPdf = () => {
    generatePdfReport(result);
    showSuccess('✓ FORENSIC PDF REPORT GENERATED');
  };

  const handleCopySummary = () => {
    const summaryText = `FACETRACE LEDGER VERIFICATION REPORT
Pipeline ID: ${result.job_id}
Target Image: ${result.image_filename} (SHA-256: ${result.image_sha256})
Face Confidence: ${(result.face_detection?.confidence * 100).toFixed(1)}%
Search Provider: ${result.search?.provider} (${result.search?.results_found} results found)
Best Match URL: ${result.record?.source_url || result.best_match?.url}
Similarity Score: ${((result.record?.similarity_score ?? result.best_match?.similarity_score ?? 0) * 100).toFixed(2)}%
Record Fingerprint (SHA-256): ${result.record_hash}
Blockchain Network: ${result.blockchain?.network}
Contract Address: ${result.blockchain?.contract_address}
Tx Hash: ${result.blockchain?.transaction_hash}
Block Number: #${result.blockchain?.block_number}
Status: VERIFIED ON-CHAIN`;

    navigator.clipboard.writeText(summaryText);
    showSuccess('✓ AUDIT SUMMARY COPIED TO CLIPBOARD');
  };

  return (
    <div className="bg-[#F5F0E3] text-[#141414] border-2 border-[#141414] shadow-brutal p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#141414] pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-[#F50064] uppercase tracking-widest block">
            STAGE 08 // AUDIT ARTIFACTS
          </span>
          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-[#141414] flex items-center gap-2">
            <span>EXPORT EVIDENCE CENTER</span>
          </h3>
        </div>

        {feedback && (
          <div className="mt-2 sm:mt-0 px-3 py-1 bg-[#0A2E23] text-[#00E599] font-mono text-xs font-bold border border-[#141414] shadow-brutal-sm flex items-center space-x-1.5 animate-bounce">
            <Check className="w-3.5 h-3.5 text-[#00E599]" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      <p className="text-xs font-mono text-[#555555] mb-6 max-w-2xl">
        Download complete cryptographic provenance packages, structured audit logs, or forensic reports for external verification and archival compliance.
      </p>

      {/* 4 Action Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PDF Export */}
        <button
          onClick={handleExportPdf}
          className="p-4 bg-[#0A2E23] text-[#FAF7F0] hover:bg-[#144F3F] border-2 border-[#141414] shadow-brutal text-left transition active:translate-x-0.5 active:translate-y-0.5 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <FileText className="w-6 h-6 text-[#F50064] group-hover:scale-110 transition-transform" />
            <Download className="w-4 h-4 text-[#EBE3D0]" />
          </div>
          <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#FAF7F0]">
            PDF REPORT
          </h4>
          <span className="text-[10px] font-mono text-[#DED3BA] block mt-1">
            Forensic audit sheet with visual proof
          </span>
        </button>

        {/* JSON Export */}
        <button
          onClick={handleExportJson}
          className="p-4 bg-white text-[#141414] hover:bg-[#FAF7F0] border-2 border-[#141414] shadow-brutal text-left transition active:translate-x-0.5 active:translate-y-0.5 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <FileJson className="w-6 h-6 text-[#0A2E23] group-hover:scale-110 transition-transform" />
            <Download className="w-4 h-4 text-[#666666]" />
          </div>
          <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#141414]">
            JSON EVIDENCE
          </h4>
          <span className="text-[10px] font-mono text-[#555555] block mt-1">
            Raw canonical payload & receipt
          </span>
        </button>

        {/* CSV Export */}
        <button
          onClick={handleExportCsv}
          className="p-4 bg-white text-[#141414] hover:bg-[#FAF7F0] border-2 border-[#141414] shadow-brutal text-left transition active:translate-x-0.5 active:translate-y-0.5 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <FileSpreadsheet className="w-6 h-6 text-[#0A2E23] group-hover:scale-110 transition-transform" />
            <Download className="w-4 h-4 text-[#666666]" />
          </div>
          <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#141414]">
            CSV SUMMARY
          </h4>
          <span className="text-[10px] font-mono text-[#555555] block mt-1">
            Tabular row for log ingestion
          </span>
        </button>

        {/* Copy Summary */}
        <button
          onClick={handleCopySummary}
          className="p-4 bg-[#F50064] text-white hover:bg-[#FF006E] border-2 border-[#141414] shadow-brutal-pink text-left transition active:translate-x-0.5 active:translate-y-0.5 group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <Copy className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            <Check className="w-4 h-4 text-white" />
          </div>
          <h4 className="font-display font-bold text-sm uppercase tracking-wider text-white">
            COPY SUMMARY
          </h4>
          <span className="text-[10px] font-mono text-white/90 block mt-1">
            Format for terminal & incident logs
          </span>
        </button>

      </div>

    </div>
  );
};
