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
    <div className="bg-goa-cream text-goa-dark border-2 border-goa-dark shadow-brutal p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-goa-dark pb-3 mb-5">
        <div>
          <span className="text-xs font-mono font-bold text-goa-pink uppercase tracking-widest block">
            STAGE 01-02 // NEURAL VISION
          </span>
          <h3 className="font-display font-black text-xl uppercase tracking-tight text-goa-dark">
            FACE DETECTION & EMBEDDING
          </h3>
        </div>

        <span className="px-3 py-1 bg-goa-green text-goa-cream font-mono text-xs font-bold border border-goa-dark shadow-brutal">
          CONFIDENCE: {(faceData.confidence * 100).toFixed(1)}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Image with Bounding Box Overlay */}
        <div className="md:col-span-6 bg-goa-dark p-2 border-2 border-goa-dark relative overflow-hidden group">
          <div className="relative inline-block w-full">
            <img
              ref={imageRef}
              src={imageUrl || undefined}
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
                className="absolute border-2 border-goa-pink bg-goa-pink/20 shadow-[0_0_15px_rgba(245,0,100,0.6)] transition-all pointer-events-none"
              >
                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white" />
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white" />

                <span className="absolute -top-5 left-0 bg-goa-pink text-goa-cream font-mono text-[9px] px-1 font-bold uppercase">
                  PRIMARY FACE BBOX [{(faceData.confidence * 100).toFixed(0)}%]
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Technical Vector Disclosures */}
        <div className="md:col-span-6 space-y-4 text-xs font-mono">
          
          <div className="bg-white border-2 border-goa-dark p-4 space-y-2 text-goa-dark">
            <div className="flex items-center space-x-2 text-goa-green font-bold border-b border-goa-dark/15 pb-1.5">
              <Scan className="w-4 h-4 text-goa-pink" />
              <span>SPATIAL BOUNDING COORDINATES</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-goa-dark">
              <div><span className="text-[#666666]">X-MIN:</span> <strong className="text-goa-dark">{x1}px</strong></div>
              <div><span className="text-[#666666]">Y-MIN:</span> <strong className="text-goa-dark">{y1}px</strong></div>
              <div><span className="text-[#666666]">X-MAX:</span> <strong className="text-goa-dark">{x2}px</strong></div>
              <div><span className="text-[#666666]">Y-MAX:</span> <strong className="text-goa-dark">{y2}px</strong></div>
            </div>
          </div>

          <div className="bg-goa-green text-goa-cream p-4 space-y-2 border-2 border-goa-dark">
            <div className="flex items-center justify-between border-b border-goa-dark pb-1.5">
              <div className="flex items-center space-x-2 font-bold text-goa-yellow">
                <Cpu className="w-4 h-4 text-goa-pink" />
                <span>EPHEMERAL EMBEDDING</span>
              </div>
              <span className="bg-goa-pink text-goa-cream px-2 py-0.5 text-[10px] font-bold">
                {embeddingDimension}-DIMENSIONAL
              </span>
            </div>
            <p className="text-[11px] text-goa-cream leading-relaxed font-sans">
              Normalized unit-norm embedding vector computed in-memory via InsightFace. Discarded immediately after cosine similarity scoring.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#444444] font-bold pt-1">
            <ShieldAlert className="w-4 h-4 text-goa-green shrink-0" />
            <span>Privacy guarantee: Zero biometric vectors are uploaded on-chain.</span>
          </div>

        </div>

      </div>

    </div>
  );
};
