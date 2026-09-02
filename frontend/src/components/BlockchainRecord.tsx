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
    <div className="bg-forest-900 text-cream-100 border border-white/10 p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-pink uppercase tracking-widest block">
            STAGE 05-06 // CRYPTOGRAPHIC ANCHOR
          </span>
          <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-cream-100 flex items-center gap-2">
            <span>IMMUTABLE ON-CHAIN LEDGER</span>
          </h3>
        </div>

        <div className="mt-2 sm:mt-0 flex items-center space-x-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-emerald font-bold">STATE REGISTERED • BLOCK #{blockchain.block_number}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: SHA-256 Fingerprint Card */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="bg-forest-950 border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-pink font-bold uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                SHA-256 RECORD FINGERPRINT
              </span>
              <button
                onClick={() => copyToClipboard(recordHash, 'hash')}
                className="flex items-center space-x-1 text-xs font-mono text-cream-200 hover:text-white bg-forest-800 px-2 py-1 border border-white/10 transition"
              >
                {copiedHash ? <Check className="w-3 h-3 text-emerald" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHash ? 'COPIED' : 'COPY HASH'}</span>
              </button>
            </div>

            <div className="p-3 bg-charcoal font-mono text-xs text-cream-100 break-all border border-charcoal-light select-all leading-relaxed">
              {recordHash}
            </div>

            <div className="text-[11px] font-mono text-cream-300/70">
              * NIST FIPS 180-4 standard cryptographic hash calculated deterministically from sorted canonical JSON.
            </div>
          </div>

          {/* Canonical Payload Viewer */}
          <div className="bg-forest-950 border border-white/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cream-300 uppercase">
                CANONICAL JSON PAYLOAD (RFC-8785)
              </span>
              <button
                onClick={() => copyToClipboard(canonicalPayload, 'payload')}
                className="text-[10px] font-mono text-pink hover:underline flex items-center gap-1"
              >
                {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'COPIED' : 'COPY RAW JSON'}</span>
              </button>
            </div>

            <pre className="text-[11px] font-mono bg-charcoal text-emerald/90 p-3 overflow-x-auto border border-charcoal-light">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>

        </div>

        {/* Right Column: Blockchain Proof & Receipt */}
        <div className="lg:col-span-6 space-y-3.5 text-xs font-mono">
          
          <div className="bg-cream-100 text-charcoal border-2 border-charcoal p-5 space-y-3.5 shadow-brutal">
            <div className="flex items-center justify-between border-b border-charcoal/20 pb-2">
              <span className="font-bold text-forest-900 flex items-center gap-1.5">
                <Blocks className="w-4 h-4 text-pink" />
                ETHEREUM SMART CONTRACT PROOF
              </span>
              <span className="text-[10px] bg-emerald/20 text-forest-900 font-bold px-1.5 py-0.5 border border-emerald/50">
                RECEIPT CONFIRMED
              </span>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div>
                <span className="text-charcoal-muted block">BLOCKCHAIN NETWORK:</span>
                <span className="font-bold text-charcoal">{blockchain.network}</span>
              </div>

              <div>
                <span className="text-charcoal-muted block">TRANSACTION HASH:</span>
                <span className="font-bold text-charcoal break-all bg-white p-1.5 border border-charcoal/20 block">
                  {blockchain.transaction_hash}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-charcoal-muted block">BLOCK NUMBER:</span>
                  <span className="font-bold text-forest-900 text-sm">#{blockchain.block_number}</span>
                </div>
                <div>
                  <span className="text-charcoal-muted block">TIMESTAMP:</span>
                  <span className="font-bold text-charcoal">{formatTimestamp(blockchain.timestamp)}</span>
                </div>
              </div>

              <div>
                <span className="text-charcoal-muted block">SUBMITTER ADDRESS:</span>
                <span className="font-bold text-charcoal break-all">{blockchain.submitter}</span>
              </div>

              <div>
                <span className="text-charcoal-muted block">CONTRACT ADDRESS:</span>
                <span className="font-bold text-pink break-all">{blockchain.contract_address}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-forest-950 border border-white/10 text-[11px] text-cream-300/80 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
            <span>
              On-chain immutability guarantees that neither the source metadata, match score, nor timestamp can be retroactively manipulated without invalidating the smart contract state.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
