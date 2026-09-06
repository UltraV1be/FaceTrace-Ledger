import React, { useState } from 'react';
import { Copy, Check, Database, ShieldCheck, ExternalLink, Blocks, Lock } from 'lucide-react';
import { BlockchainData, VerificationRecord } from '../types/pipeline';
import { formatTimestamp, truncateHash } from '../utils/formatters';

interface BlockchainRecordProps {
  blockchain: BlockchainData;
  recordHash: string;
  canonicalPayload: string;
  record: VerificationRecord;
}

export const BlockchainRecord: React.FC<BlockchainRecordProps> = ({
  blockchain,
  recordHash,
  canonicalPayload,
  record
}) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const copyToClipboard = (text: string, type: 'hash' | 'payload') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  return (
    <div className="bg-goa-dark text-goa-cream border border-goa-dark p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-goa-dark pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-goa-pink uppercase tracking-widest block">
            STAGE 05-06 // CRYPTOGRAPHIC ANCHOR
          </span>
          <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-goa-cream flex items-center gap-2">
            <span>IMMUTABLE ON-CHAIN LEDGER</span>
          </h3>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center space-x-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-goa-green animate-pulse" />
          <span className="text-goa-green font-bold">STATE REGISTERED • BLOCK #{blockchain.block_number}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: SHA-256 Fingerprint Card */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-goa-dark border border-goa-dark p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-goa-pink font-bold uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                SHA-256 RECORD FINGERPRINT
              </span>
              <button
                onClick={() => copyToClipboard(recordHash, 'hash')}
                className="flex items-center space-x-1 text-xs font-mono text-goa-cream hover:text-goa-cream bg-goa-dark px-2 py-1 border border-goa-dark transition"
              >
                {copiedHash ? <Check className="w-3 h-3 text-goa-green" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'COPIED' : 'COPY HASH'}</span>
              </button>
            </div>

            <div className="p-3 bg-goa-dark font-mono text-xs text-goa-cream break-all border border-goa-dark-light select-all leading-relaxed">
              {recordHash}
            </div>

            <div className="text-[11px] font-mono text-goa-dark/50/70">
              * NIST FIPS 180-4 standard cryptographic hash calculated deterministically from sorted canonical JSON.
            </div>
          </div>

          {/* Canonical Payload Viewer */}
          <div className="bg-goa-dark border border-goa-dark p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-goa-dark/50 uppercase">
                CANONICAL JSON PAYLOAD (RFC-8785)
              </span>
              <button
                onClick={() => copyToClipboard(canonicalPayload, 'payload')}
                className="text-[10px] font-mono text-goa-pink hover:underline flex items-center gap-1"
              >
                {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'COPIED' : 'COPY RAW JSON'}</span>
              </button>
            </div>

            <pre className="text-[11px] font-mono bg-goa-dark text-goa-green/90 p-3 overflow-x-auto border border-goa-dark-light">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>

        </div>

        {/* Right Column: Blockchain Proof & Receipt */}
        <div className="lg:col-span-6 space-y-3.5 text-xs font-mono">
          
          <div className="bg-goa-cream text-goa-dark border-2 border-goa-dark p-5 space-y-3.5 shadow-brutal">
            <div className="flex items-center justify-between border-b border-goa-dark/20 pb-2">
              <span className="font-bold text-goa-dark flex items-center gap-1.5">
                <Blocks className="w-4 h-4 text-goa-pink" />
                ETHEREUM SMART CONTRACT PROOF
              </span>
              <span className="text-[10px] bg-goa-green/20 text-goa-dark font-bold px-1.5 py-0.5 border border-goa-green/50">
                RECEIPT CONFIRMED
              </span>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div>
                <span className="text-goa-dark-muted block">BLOCKCHAIN NETWORK:</span>
                <span className="font-bold text-goa-dark">{blockchain.network}</span>
              </div>

              <div>
                <span className="text-goa-dark-muted block">TRANSACTION HASH:</span>
                <span className="font-bold text-goa-dark break-all bg-white p-1.5 border border-goa-dark/20 block">
                  {blockchain.transaction_hash}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-goa-dark-muted block">BLOCK NUMBER:</span>
                  <span className="font-bold text-goa-dark text-sm">#{blockchain.block_number}</span>
                </div>
                <div>
                  <span className="text-goa-dark-muted block">TIMESTAMP:</span>
                  <span className="font-bold text-goa-dark">{formatTimestamp(blockchain.timestamp)}</span>
                </div>
              </div>

              <div>
                <span className="text-goa-dark-muted block">SUBMITTER ADDRESS:</span>
                <span className="font-bold text-goa-dark break-all">{blockchain.submitter}</span>
              </div>

              <div>
                <span className="text-goa-dark-muted block">CONTRACT ADDRESS:</span>
                <span className="font-bold text-goa-pink break-all">{blockchain.contract_address}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-goa-dark border border-goa-dark text-[11px] text-goa-dark/50/80 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-goa-green shrink-0 mt-0.5" />
            <span>
              On-chain immutability guarantees that neither the source metadata, match score, nor timestamp can be retroactively manipulated without invalidating the smart contract state.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
