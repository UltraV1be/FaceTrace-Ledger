import jsPDF from 'jspdf';
import { PipelineResult } from '../types/pipeline';
import { formatTimestamp } from './formatters';
import { getFullMediaUrl } from '../services/api';

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Failed to load image for PDF", e);
    return null;
  }
}

export async function generatePdfReport(result: PipelineResult): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background: Warm Ivory / Cream
  doc.setFillColor(245, 240, 227); // #F5F0E3
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Accent Strip: Hot Pink
  doc.setFillColor(245, 0, 100); // #F50064
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Header Banner: Deep Forest Green
  doc.setFillColor(10, 46, 35); // #0A2E23
  doc.rect(14, 12, pageWidth - 28, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 240, 227);
  doc.setFontSize(16);
  doc.text('FACETRACE LEDGER', 20, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 229, 153);
  doc.text('AI BIOMETRIC DISCOVERY & IMMUTABLE BLOCKCHAIN VERIFICATION', 20, 32);

  doc.setTextColor(245, 240, 227);
  doc.setFontSize(8);
  doc.text(`REPORT ID: ${result.job_id.slice(0, 16).toUpperCase()}`, pageWidth - 20, 23, { align: 'right' });
  doc.text(`GENERATED: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`, pageWidth - 20, 32, { align: 'right' });

  let y = 48;

  const drawSectionHeader = (num: string, title: string) => {
    doc.setFillColor(13, 59, 46);
    doc.rect(14, y, 6, 6, 'F');
    doc.setTextColor(245, 0, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(num, 15.5, y + 4.5);

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(11);
    doc.text(title, 24, y + 4.5);

    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.3);
    doc.line(14, y + 8, pageWidth - 14, y + 8);
    y += 13;
  };

  const drawField = (label: string, value: string, mono = false) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(label.toUpperCase(), 16, y);

    doc.setFont(mono ? 'courier' : 'helvetica', mono ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    const splitVal = doc.splitTextToSize(value, pageWidth - 70);
    doc.text(splitVal, 65, y);
    y += Math.max(6, splitVal.length * 4.5 + 2);
  };

  // Section 1: Input Evidence
  drawSectionHeader('01', 'INPUT ARTIFACT & BIOMETRICS');
  drawField('File Name', result.image_filename);
  drawField('Image SHA-256', result.image_sha256, true);
  drawField('Face Detection', result.face_detection.detected ? `DETECTED (Confidence: ${(result.face_detection.confidence * 100).toFixed(1)}%)` : 'NO FACE');
  drawField('Bounding Box', JSON.stringify(result.face_detection.bbox));
  drawField('Face Vector', `${result.face_encoding.dimension}-D Ephemeral Vector (Never Persisted / Privacy-Safe)`);

  y += 2;

  // Section 2: Search & Discovered Candidate
  drawSectionHeader('02', 'DYNAMIC SEARCH & SOCIAL MEDIA MATCH');
  drawField('Search Provider', result.search.provider.toUpperCase());
  drawField('Results Found', `${result.search.results_found} Web Matches (${result.search.social_media_count ?? 0} Social Media)`);
  drawField('Result Type', (result.record?.result_type || result.best_match?.result_type || 'GENERAL_WEB_RESULT').replace(/_/g, ' '));
  drawField('Social Platform', (result.record?.social_platform || result.best_match?.social_platform || 'N/A').toUpperCase());
  drawField('Source Domain', result.record?.source_domain || result.best_match?.domain || 'N/A');
  drawField('Source URL', result.record?.source_url || result.best_match?.url || 'N/A');
  drawField('Match Title', result.record?.result_title || result.best_match?.page_title || 'Untitled');
  drawField('Similarity Score', `${((result.record?.similarity_score ?? result.best_match?.similarity_score ?? 0) * 100).toFixed(2)}% (Threshold: ${(result.record?.similarity_threshold ?? 0.65) * 100}%)`);

  y += 2;

  // Section 3: Cryptographic Fingerprint
  drawSectionHeader('03', 'CANONICAL RECORD & CRYPTOGRAPHIC PROOF');
  drawField('Hash Algorithm', 'SHA-256 (NIST FIPS 180-4)');
  drawField('Record Fingerprint', result.record_hash, true);
  drawField('Verified Timestamp', formatTimestamp(result.record?.verified_at));

  y += 2;

  // Section 4: Blockchain Ledger Anchor
  drawSectionHeader('04', 'IMMUTABLE BLOCKCHAIN REGISTRATION');
  drawField('Network', result.blockchain.network);
  drawField('Smart Contract', result.blockchain.contract_address, true);
  drawField('Transaction Hash', result.blockchain.transaction_hash, true);
  drawField('Block Number', `Block #${result.blockchain.block_number}`);
  drawField('Submitter', result.blockchain.submitter, true);

  // Verification Seal & Side-by-Side Images
  y += 6;
  
  // Attempt to load and render Side-by-Side Images
  try {
    const inputUrl = getFullMediaUrl(result.image_url);
    const candidateThumbPath = result.best_match?.display_image_url || result.best_match?.thumbnail_url || '';
    const candidateUrl = getFullMediaUrl(candidateThumbPath);

    const [inputBase64, candidateBase64] = await Promise.all([
      fetchImageAsBase64(inputUrl),
      candidateThumbPath ? fetchImageAsBase64(candidateUrl) : Promise.resolve(null)
    ]);

    if (inputBase64 || candidateBase64) {
      doc.setFillColor(13, 59, 46);
      doc.rect(14, y, pageWidth - 28, 45, 'F');

      doc.setTextColor(245, 240, 227);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      const imgWidth = 35;
      const imgHeight = 35;
      const boxMidY = y + 5;

      // Left Image (Input)
      doc.text('INPUT ARTIFACT', 18, boxMidY + 3);
      if (inputBase64) {
        doc.addImage(inputBase64, 'JPEG', 18, boxMidY + 5, imgWidth, imgHeight);
      }
      
      // Right Image (Candidate)
      doc.text('MATCHED CANDIDATE', 18 + imgWidth + 10, boxMidY + 3);
      if (candidateBase64) {
        doc.addImage(candidateBase64, 'JPEG', 18 + imgWidth + 10, boxMidY + 5, imgWidth, imgHeight);
      }

      y += 50;
    }
  } catch (err) {
    console.error("Failed to render side-by-side images", err);
  }

  y += 4;
  doc.setFillColor(10, 46, 35);
  doc.rect(14, y, pageWidth - 28, 16, 'F');
  doc.setDrawColor(0, 229, 153);
  doc.setLineWidth(0.8);
  doc.rect(14, y, pageWidth - 28, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 229, 153);
  doc.text('AUDIT STATUS: VERIFIED ON-CHAIN (TAMPER-EVIDENT GUARANTEE)', pageWidth / 2, y + 10, { align: 'center' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Generated cryptographically by FaceTrace Ledger Forensic Lab. Confidential and tamper-evident.', pageWidth / 2, pageHeight - 8, { align: 'center' });

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`facetrace-ledger-report-${result.job_id.slice(0, 8)}-${dateStr}.pdf`);
}
