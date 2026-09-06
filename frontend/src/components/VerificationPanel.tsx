import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { VerificationRecord } from '../types/pipeline';
import { verifyRecord } from '../services/api';
import confetti from 'canvas-confetti';

interface VerificationPanelProps {
  record: VerificationRecord;
  currentRecordHash: string;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  record,
  currentRecordHash
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await verifyRecord(record);
      setVerificationResult(res);
      if (res.verified) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#00E599', '#F50064', '#FAF7F0']
        });
      }
    } catch (err: any) {
      setVerificationResult({
        verified: false,
        reason: err.message || 'Verification call failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-goa-cream text-goa-dark border-2 border-goa-dark shadow-brutal p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-goa-dark pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-goa-pink uppercase tracking-widest block">
            STAGE 07 // INTEGRITY AUDIT
          </span>
          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-goa-dark">
            BLOCKCHAIN RE-VERIFICATION
          </h3>
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="mt-3 sm:mt-0 px-5 py-2.5 bg-goa-green text-goa-cream hover:bg-[#144F3F] font-mono text-xs font-bold uppercase transition flex items-center space-x-2 border-2 border-goa-dark shadow-brutal"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-goa-pink" />
              <span>QUERYING BLOCKCHAIN...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-goa-yellow" />
              <span>[ RUN RE-VERIFICATION ]</span>
            </>
          )}
        </button>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs mb-6 text-goa-dark">
        
        {/* Local Recomputed Hash */}
        <div className="bg-white border-2 border-goa-dark p-4 space-y-2 shadow-brutal">
          <span className="text-[#666666] uppercase block text-[10px] font-bold">
            [1] LOCAL RECOMPUTED SHA-256:
          </span>
          <div className="font-bold text-goa-dark break-all bg-goa-cream p-2.5 border border-goa-dark/20 select-all">
            {currentRecordHash}
          </div>
        </div>

        {/* Blockchain On-Chain Hash */}
        <div className="bg-white border-2 border-goa-dark p-4 space-y-2 shadow-brutal">
          <span className="text-[#666666] uppercase block text-[10px] font-bold">
            [2] SMART CONTRACT ON-CHAIN RECORD:
          </span>
          <div className="font-bold text-goa-green break-all bg-goa-cream p-2.5 border border-goa-dark/20 select-all">
            {verificationResult ? (
              verificationResult.verified ? currentRecordHash : 'NOT FOUND / MISMATCH'
            ) : (
              'Awaiting Query Execution...'
            )}
          </div>
        </div>

      </div>

      {/* Result Status Banner */}
      {verificationResult && (
        <div
          className={`p-5 border-2 text-center transition ${
            verificationResult.verified
              ? 'bg-goa-green text-goa-cream border-goa-dark shadow-brutal'
              : 'bg-red-50 text-red-700 border-red-500 shadow-brutal'
          }`}
        >
          {verificationResult.verified ? (
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-goa-yellow/20 text-goa-yellow border border-goa-yellow font-mono text-xs font-bold uppercase">
                <CheckCircle2 className="w-4 h-4 text-goa-yellow" />
                <span>INTEGRITY VERIFIED ON-CHAIN</span>
              </div>
              <h4 className="font-display font-black text-xl uppercase tracking-wider text-goa-cream">
                DATA MATCHES REGISTERED IMMUTABLE RECORD
              </h4>
              <p className="font-mono text-xs text-goa-cream max-w-xl mx-auto leading-relaxed">
                The current verification record, similarity score, and discovered URLs are cryptographically identical to the on-chain snapshot registered at Block #{verificationResult.timestamp ? 'Confirmed' : '1'}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-600 border border-red-400 font-mono text-xs font-bold uppercase">
                <XCircle className="w-4 h-4 text-red-500" />
                <span>INTEGRITY CHECK FAILED</span>
              </div>
              <h4 className="font-display font-black text-xl uppercase tracking-wider text-red-700">
                HASH MISMATCH OR UNREGISTERED RECORD
              </h4>
              <p className="font-mono text-xs text-red-600 max-w-xl mx-auto">
                {verificationResult.reason || 'The local record does not match any registered hash on the smart contract.'}
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
