import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, Sparkles, RefreshCw, X } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { checkPreflight } from '../services/api';

interface ImageUploaderProps {
  onFileSelected: (file: File | null, sampleFilename?: string) => void;
  onRunTrace: () => void;
  isProcessing: boolean;
  selectedFile: File | null;
  sampleFilename?: string;
  sampleImages: Array<{ filename: string; url: string; size_kb: number }>;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileSelected,
  onRunTrace,
  isProcessing,
  selectedFile,
  sampleFilename,
  sampleImages: _sampleImages
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDimensions, setFileDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageHashPrefix, setImageHashPrefix] = useState<string>('');
  
  const [isPreflighting, setIsPreflighting] = useState<boolean>(false);
  const [preflightResult, setPreflightResult] = useState<{ status: string; message: string; faces: number; blur_score: number; face_area_pct: number } | null>(null);

  const computeSha256Prefix = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setImageHashPrefix(`${hashHex.slice(0, 12)}...${hashHex.slice(-6)}`);
    } catch {
      setImageHashPrefix('Local Fingerprint Ready');
    }
  };

  const handleFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    computeSha256Prefix(file);
    onFileSelected(file);

    setIsPreflighting(true);
    setPreflightResult(null);
    try {
      const res = await checkPreflight(file);
      setPreflightResult(res);
    } catch (err) {
      setPreflightResult({ status: 'error', message: 'Preflight check failed: ' + (err as Error).message, faces: 0, blur_score: 0, face_area_pct: 0 });
    } finally {
      setIsPreflighting(false);
    }
  }, [onFileSelected]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  }, [handleFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleSelectSample = async (sample: { filename: string; url: string }) => {
    setPreviewUrl(`http://localhost:8000${sample.url}`);
    setFileDimensions({ width: 512, height: 512 });
    setImageHashPrefix('7de7ed51a159...7bb72c07');
    onFileSelected(null, sample.filename);

    setIsPreflighting(true);
    setPreflightResult(null);
    try {
      const res = await checkPreflight(undefined, sample.filename);
      setPreflightResult(res);
    } catch (err) {
      setPreflightResult({ status: 'error', message: 'Preflight check failed: ' + (err as Error).message, faces: 0, blur_score: 0, face_area_pct: 0 });
    } finally {
      setIsPreflighting(false);
    }
  };

  const handleClear = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileDimensions(null);
    setImageHashPrefix('');
    setPreflightResult(null);
    onFileSelected(null);
  };

  const hasImage = Boolean(previewUrl || selectedFile || sampleFilename);

  return (
    <div className="bg-goa-cream text-goa-dark border-2 border-goa-dark shadow-brutal p-6 lg:p-8">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b-2 border-goa-dark pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-goa-pink uppercase tracking-widest block">
            STEP 01 // INPUT ACQUISITION
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-goa-dark uppercase">
            TARGET EVIDENCE ARTIFACT
          </h2>
        </div>

        {hasImage && !isProcessing && (
          <button
            onClick={handleClear}
            className="flex items-center space-x-1 text-xs font-mono font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 border border-red-300 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>REMOVE</span>
          </button>
        )}
      </div>

      {!hasImage ? (
        <div>
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-8 sm:p-12 text-center transition cursor-pointer ${
              isDragActive
                ? 'border-goa-pink bg-goa-pink/5 scale-[0.99]'
                : 'border-goa-dark/50 hover:border-goa-dark bg-white hover:bg-goa-cream'
            }`}
          >
            <input {...getInputProps()} />

            <div className="w-14 h-14 mx-auto mb-4 bg-goa-green text-goa-cream flex items-center justify-center border border-goa-dark shadow-brutal">
              <UploadCloud className="w-7 h-7 text-goa-pink" />
            </div>

            <p className="font-display font-black text-lg sm:text-xl uppercase text-goa-dark mb-1">
              {isDragActive ? 'RELEASE IMAGE HERE' : 'DROP FACE IMAGE HERE OR BROWSE'}
            </p>

            <p className="text-xs font-mono text-[#555555] max-w-sm mx-auto mb-4">
              Supported Formats: JPEG, JPG, PNG, WEBP (Max 15MB). High-resolution frontal portraits recommended.
            </p>

            <span className="inline-block px-5 py-2.5 bg-goa-dark text-goa-cream font-mono text-xs uppercase font-bold hover:bg-goa-pink transition shadow-brutal">
              [ SELECT FILE ]
            </span>
          </div>

          {/* Quick Benchmark Samples */}
          <div className="mt-6 pt-4 border-t border-goa-dark/20">
            <span className="text-[11px] font-mono uppercase font-bold text-[#444444] block mb-2.5">
              OR LOAD BENCHMARK PORTRAIT:
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectSample({ filename: 'lena.jpg', url: '/media/input/lena.jpg' })}
                className="px-3.5 py-2 bg-white border-2 border-goa-dark hover:bg-goa-pink hover:text-goa-cream font-mono text-xs font-bold text-goa-dark flex items-center space-x-2 transition shadow-brutal group"
              >
                <ImageIcon className="w-4 h-4 text-goa-pink group-hover:text-goa-cream" />
                <span>LENA.JPG (CV Standard)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSample({ filename: 'sample_portrait.jpg', url: '/media/input/sample_portrait.jpg' })}
                className="px-3.5 py-2 bg-white border-2 border-goa-dark hover:bg-goa-pink hover:text-goa-cream font-mono text-xs font-bold text-goa-dark flex items-center space-x-2 transition shadow-brutal group"
              >
                <Sparkles className="w-4 h-4 text-goa-green group-hover:text-goa-cream" />
                <span>SAMPLE_PORTRAIT.JPG</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Loaded Preview State */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Image Display */}
          <div className="md:col-span-5 bg-goa-dark p-2 border-2 border-goa-dark shadow-brutal relative group">
            <img
              src={previewUrl || undefined}
              alt="Target Face Artifact"
              className="w-full h-64 object-contain bg-[#242424]"
            />
            {isProcessing && (
              <div className="absolute inset-2 bg-goa-dark/85 backdrop-blur-sm flex flex-col items-center justify-center text-goa-cream p-4 text-center">
                <RefreshCw className="w-8 h-8 text-goa-pink animate-spin mb-2" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-goa-pink">
                  ANALYSIS IN PROGRESS
                </span>
                <span className="text-[10px] font-mono text-goa-cream mt-1">
                  Extracting vectors & querying web...
                </span>
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
            
            <div className="bg-white border-2 border-goa-dark p-4 space-y-2.5 text-xs font-mono text-goa-dark">
              <div className="flex justify-between border-b border-goa-dark/15 pb-1.5">
                <span className="text-[#666666]">SOURCE FILE:</span>
                <span className="font-bold text-goa-dark truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : sampleFilename || 'Target Image'}
                </span>
              </div>

              {fileDimensions && (
                <div className="flex justify-between border-b border-goa-dark/15 pb-1.5">
                  <span className="text-[#666666]">DIMENSIONS:</span>
                  <span className="font-bold text-goa-dark">
                    {fileDimensions.width} × {fileDimensions.height} PX
                  </span>
                </div>
              )}

              {selectedFile && (
                <div className="flex justify-between border-b border-goa-dark/15 pb-1.5">
                  <span className="text-[#666666]">FILE SIZE:</span>
                  <span className="font-bold text-goa-dark">{formatFileSize(selectedFile.size)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[#666666]">SHA-256 DIGEST:</span>
                <span className="font-bold text-goa-pink bg-goa-pink/10 px-2 py-0.5 border border-goa-pink/30 text-[11px]">
                  {imageHashPrefix || 'Calculating...'}
                </span>
              </div>
            </div>
            
            {/* Preflight Check UI */}
            <div className="space-y-2">
              {isPreflighting && (
                <div className="bg-goa-cream border-2 border-goa-dark p-3 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-goa-pink" />
                  <span className="font-mono text-xs font-bold text-goa-dark">RUNNING PRE-FLIGHT CHECKS...</span>
                </div>
              )}
              {!isPreflighting && preflightResult && (
                <div className={`p-3 border-2 font-mono text-xs ${preflightResult.status === 'error' ? 'bg-red-50 border-red-500 text-red-700' : preflightResult.status === 'warning' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                  <div className="font-bold mb-1 uppercase tracking-wider">
                    {preflightResult.status === 'error' ? '❌ PRE-FLIGHT ERROR' : preflightResult.status === 'warning' ? '⚠️ PRE-FLIGHT WARNING' : '✅ PRE-FLIGHT PASSED'}
                  </div>
                  <div className="mb-2">{preflightResult.message}</div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-black/10 text-[10px] font-bold text-goa-dark">
                    <div>FACES: {preflightResult.faces}</div>
                    <div>BLUR: {Math.round(preflightResult.blur_score)}</div>
                    <div>AREA: {preflightResult.face_area_pct.toFixed(1)}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Run Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onRunTrace}
                disabled={isProcessing || isPreflighting || preflightResult?.status === 'error'}
                className={`w-full py-4 px-6 text-sm font-mono uppercase font-bold tracking-wider transition flex items-center justify-center space-x-2 border-2 border-goa-dark shadow-brutal ${
                  isProcessing || isPreflighting || preflightResult?.status === 'error'
                    ? 'bg-[#555555] text-goa-cream cursor-not-allowed opacity-80'
                    : 'bg-goa-pink text-goa-cream hover:bg-[#FF006E] active:translate-x-0.5 active:translate-y-0.5 shadow-brutal'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-goa-cream" />
                    <span>TRACE INITIALIZED — EXECUTING...</span>
                  </>
                ) : isPreflighting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-goa-cream" />
                    <span>CHECKING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-goa-cream" />
                    <span>[ RUN TRACE ]</span>
                  </>
                )}
              </button>

              {!isProcessing && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full py-2 text-xs font-mono text-[#555555] hover:text-goa-dark text-center font-bold"
                >
                  ← Choose a different image
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
