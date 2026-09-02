import React, { useRef, useState } from 'react';
import { Scan, ShieldAlert, Cpu } from 'lucide-react';
import { FaceDetectionData } from '../types/pipeline';

interface FaceDetectionResultProps {
  imageUrl: string;
  faceData: FaceDetectionData;
  embeddingDimension?: number;
}

export const FaceDetectionResult: React.FC<FaceDetectionResultProps> = ({
  imageUrl,
  faceData,
  embeddingDimension = 512
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({
      width: e.currentTarget.naturalWidth || 1,
      height: e.currentTarget.naturalHeight || 1
    });
  };

  const [x1, y1, x2, y2] = faceData.bbox;
  const leftPercent = (x1 / naturalSize.width) * 100;
  const topPercent = (y1 / naturalSize.height) * 100;
  const widthPercent = ((x2 - x1) / naturalSize.width) * 100;
  const heightPercent = ((y2 - y1) / naturalSize.height) * 100;

  return (
    <div className="bg-[#F5F0E3] text-[#141414] border-2 border-[#141414] shadow-brutal p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3 mb-5">
        <div>
          <span className="text-xs font-mono font-bold text-[#F50064] uppercase tracking-widest block">
            STAGE 01-02 // NEURAL VISION
          </span>
          <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#141414]">
            FACE DETECTION & EMBEDDING
          </h3>
        </div>

        <span className="px-3 py-1 bg-[#0A2E23] text-[#FAF7F0] font-mono text-xs font-bold border border-[#141414] shadow-brutal-sm">
          CONFIDENCE: {(faceData.confidence * 100).toFixed(1)}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Image with Bounding Box Overlay */}
        <div className="md:col-span-6 bg-[#141414] p-2 border-2 border-[#141414] relative overflow-hidden group">
          <div className="relative inline-block w-full">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Detected Face"
              onLoad={handleImageLoad}
              className="w-full max-h-72 object-contain bg-[#242424] block"
            />

            {naturalSize.width > 1 && (
              <div
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                }}
                className="absolute border-2 border-[#F50064] bg-[#F50064]/20 shadow-[0_0_15px_rgba(245,0,100,0.6)] transition-all pointer-events-none"
              >
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

                <span className="absolute -top-5 left-0 bg-[#F50064] text-white font-mono text-[9px] px-1 font-bold uppercase">
                  PRIMARY FACE BBOX [{(faceData.confidence * 100).toFixed(0)}%]
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Vector Disclosures */}
        <div className="md:col-span-6 space-y-4 text-xs font-mono">
          
          <div className="bg-white border-2 border-[#141414] p-4 space-y-2 text-[#141414]">
            <div className="flex items-center space-x-2 text-[#0A2E23] font-bold border-b border-[#141414]/15 pb-1.5">
              <Scan className="w-4 h-4 text-[#F50064]" />
              <span>SPATIAL BOUNDING COORDINATES</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#141414]">
              <div><span className="text-[#666666]">X-MIN:</span> <strong className="text-[#141414]">{x1}px</strong></div>
              <div><span className="text-[#666666]">Y-MIN:</span> <strong className="text-[#141414]">{y1}px</strong></div>
              <div><span className="text-[#666666]">X-MAX:</span> <strong className="text-[#141414]">{x2}px</strong></div>
              <div><span className="text-[#666666]">Y-MAX:</span> <strong className="text-[#141414]">{y2}px</strong></div>
            </div>
          </div>

          <div className="bg-[#0A2E23] text-[#F5F0E3] p-4 space-y-2 border-2 border-[#141414]">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center space-x-2 font-bold text-[#00E599]">
                <Cpu className="w-4 h-4 text-[#F50064]" />
                <span>EPHEMERAL EMBEDDING</span>
              </div>
              <span className="bg-[#F50064] text-white px-2 py-0.5 text-[10px] font-bold">
                {embeddingDimension}-DIMENSIONAL
              </span>
            </div>
            <p className="text-[11px] text-[#EBE3D0] leading-relaxed font-sans">
              Normalized unit-norm embedding vector computed in-memory via InsightFace. Discarded immediately after cosine similarity scoring.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#444444] font-bold pt-1">
            <ShieldAlert className="w-4 h-4 text-[#0A2E23] shrink-0" />
            <span>Privacy guarantee: Zero biometric vectors are uploaded on-chain.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
