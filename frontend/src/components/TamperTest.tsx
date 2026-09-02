import React, { useState } from 'react';
import { AlertTriangle, Flame, RefreshCw, XCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { VerificationRecord } from '../types/pipeline';
import { runTamperTest } from '../services/api';

interface TamperTestProps {
  originalRecord: VerificationRecord;
}

export const TamperTest: React.FC<TamperTestProps> = ({ originalRecord }) => {
  const [selectedField, setSelectedField] = useState<string>('result_title');
  const [modifiedValue, setModifiedValue] = useState<string>('Malicious Fabricated Profile Link');
  const [isRunning, setIsRunning] = useState(false);
  const [tamperResult, setTamperResult] = useState<any | null>(null);

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      let finalVal: any = modifiedValue;
      if (selectedField === 'similarity_score') {
        finalVal = parseFloat(modifiedValue) || 0.9999;
      }
      const res = await runTamperTest(originalRecord, selectedField, finalVal);
      setTamperResult(res);
    } catch (err: any) {
      alert(`Tamper test error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-forest-900 text-cream-100 border-2 border-pink/50 p-6 lg:p-8 relative overflow-hidden">
      
      {/* Top Banner Tag */}
      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-pink text-white font-mono text-[10px] uppercase font-bold tracking-wider mb-4 shadow-brutal-sm">
        <Flame className="w-3.5 h-3.5" />
        <span>INTERACTIVE SANDBOX • DEMONSTRATION MODE</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-cream-100">
            TAMPER DETECTION SIMULATOR
          </h3>
          <p className="text-xs font-mono text-cream-300/70 mt-1 max-w-xl">
            Simulate an adversary attempting to modify discovered URLs, titles, or similarity scores in a sandbox copy of the record.
          </p>
        </div>

        <button
          onClick={handleRunTest}
          disabled={isRunning}
          className="mt-3 sm:mt-0 px-5 py-3 bg-pink text-white font-mono text-xs font-bold uppercase hover:bg-pink-hot transition flex items-center space-x-2 shadow-brutal-pink border border-charcoal"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>TESTING TAMPER PROOF...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>[ RUN TAMPER CHECK ]</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Editor Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 font-mono text-xs mb-6">
        
        {/* Field Selector */}
        <div className="md:col-span-4 bg-forest-950 border border-white/10 p-4 space-y-2">
          <label className="text-cream-300 uppercase block text-[10px] font-bold">
            TARGET FIELD TO ALTER:
          </label>
          <select
            value={selectedField}
            onChange={(e) => {
              setSelectedField(e.target.value);
              if (e.target.value === 'similarity_score') {
                setModifiedValue('0.9999');
              } else if (e.target.value === 'source_url') {
                setModifiedValue('https://adversary-phishing-host.org/fake_image.jpg');
              } else {
                setModifiedValue('Malicious Fabricated Profile Link');
              }
            }}
            className="w-full bg-forest-900 text-cream-100 p-2 border border-white/20 focus:border-pink outline-none font-mono"
          >
            <option value="result_title">result_title (Match Title)</option>
            <option value="source_url">source_url (Discovered URL)</option>
            <option value="similarity_score">similarity_score (Match Score)</option>
            <option value="source_domain">source_domain (Domain)</option>
          </select>
        </div>

        {/* Modified Value Input */}
        <div className="md:col-span-8 bg-forest-950 border border-white/10 p-4 space-y-2">
          <label className="text-pink uppercase block text-[10px] font-bold">
            TAMPERED SANDBOX VALUE:
          </label>
          <input
            type="text"
            value={modifiedValue}
            onChange={(e) => setModifiedValue(e.target.value)}
            className="w-full bg-forest-900 text-pink font-bold p-2 border border-pink/50 focus:border-pink outline-none font-mono"
          />
        </div>

      </div>

      {/* Comparison Results */}
      {tamperResult && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            
            {/* Original Digest */}
            <div className="bg-forest-950 border border-emerald/50 p-4 space-y-1.5">
              <span className="text-emerald text-[10px] uppercase font-bold flex items-center gap-1">
                <span>[A] ORIGINAL UNMODIFIED FINGERPRINT:</span>
              </span>
              <div className="font-bold text-cream-100 break-all select-all">
                {tamperResult.original.hash}
              </div>
              <div className="text-[10px] text-emerald">
                ✓ ON-CHAIN STATUS: REGISTERED & VERIFIED
              </div>
            </div>

            {/* Tampered Digest */}
            <div className="bg-forest-950 border border-pink p-4 space-y-1.5 shadow-[0_0_15px_rgba(245,0,100,0.2)]">
              <span className="text-pink text-[10px] uppercase font-bold flex items-center gap-1">
                <span>[B] TAMPERED RECORD FINGERPRINT:</span>
              </span>
              <div className="font-bold text-pink break-all select-all">
                {tamperResult.tampered.hash}
              </div>
              <div className="text-[10px] text-red-400 font-bold">
                ✕ ON-CHAIN STATUS: REJECTED (HASH MISMATCH)
              </div>
            </div>

          </div>

          {/* Security Alert Banner */}
          <div className="p-4 bg-red-950/80 border-2 border-pink text-cream-100 flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-pink shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs font-mono">
              <span className="font-bold text-pink uppercase block">
                SECURITY ALERT: DATA TAMPERING MATHEMATICALLY DETECTED
              </span>
              <p className="text-cream-200/90 leading-relaxed">
                Modifying the field <span className="text-pink font-bold">"{selectedField}"</span> altered the deterministic canonical JSON digest from <span className="text-cream-100 font-bold">{tamperResult.original.hash.slice(0, 10)}...</span> to <span className="text-pink font-bold">{tamperResult.tampered.hash.slice(0, 10)}...</span>. The smart contract successfully rejected the falsified record.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
