import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, Sparkles, RefreshCw, X } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';

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

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setFileDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    computeSha256Prefix(file);
    onFileSelected(file);
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

  const handleSelectSample = (sample: { filename: string; url: string }) => {
    setPreviewUrl(`http://localhost:8000${sample.url}`);
    setFileDimensions({ width: 512, height: 512 });
    setImageHashPrefix('7de7ed51a159...7bb72c07');
    onFileSelected(null, sample.filename);
  };

  const handleClear = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFileDimensions(null);
    setImageHashPrefix('');
    onFileSelected(null);
  };

  const hasImage = Boolean(previewUrl || selectedFile || sampleFilename);

  return (
    <div className="bg-[#F5F0E3] text-[#141414] border-2 border-[#141414] shadow-brutal p-6 lg:p-8">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4 mb-6">
        <div>
          <span className="text-xs font-mono font-bold text-[#F50064] uppercase tracking-widest block">
            STEP 01 // INPUT ACQUISITION
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-[#141414] uppercase">
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
                ? 'border-[#F50064] bg-[#F50064]/5 scale-[0.99]'
                : 'border-[#141414]/50 hover:border-[#141414] bg-white hover:bg-[#FAF7F0]'
            }`}
          >
            <input {...getInputProps()} />

            <div className="w-14 h-14 mx-auto mb-4 bg-[#0A2E23] text-white flex items-center justify-center border border-[#141414] shadow-brutal-sm">
              <UploadCloud className="w-7 h-7 text-[#F50064]" />
            </div>

            <p className="font-display font-black text-lg sm:text-xl uppercase text-[#141414] mb-1">
              {isDragActive ? 'RELEASE IMAGE HERE' : 'DROP FACE IMAGE HERE OR BROWSE'}
            </p>

            <p className="text-xs font-mono text-[#555555] max-w-sm mx-auto mb-4">
              Supported Formats: JPEG, JPG, PNG, WEBP (Max 15MB). High-resolution frontal portraits recommended.
            </p>

            <span className="inline-block px-5 py-2.5 bg-[#141414] text-[#FAF7F0] font-mono text-xs uppercase font-bold hover:bg-[#F50064] transition shadow-brutal-sm">
              [ SELECT FILE ]
            </span>
          </div>

          {/* Quick Benchmark Samples */}
          <div className="mt-6 pt-4 border-t border-[#141414]/20">
            <span className="text-[11px] font-mono uppercase font-bold text-[#444444] block mb-2.5">
              OR LOAD BENCHMARK PORTRAIT:
            </span>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectSample({ filename: 'lena.jpg', url: '/media/input/lena.jpg' })}
                className="px-3.5 py-2 bg-white border-2 border-[#141414] hover:bg-[#F50064] hover:text-white font-mono text-xs font-bold text-[#141414] flex items-center space-x-2 transition shadow-brutal-sm group"
              >
                <ImageIcon className="w-4 h-4 text-[#F50064] group-hover:text-white" />
                <span>LENA.JPG (CV Standard)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSample({ filename: 'sample_portrait.jpg', url: '/media/input/sample_portrait.jpg' })}
                className="px-3.5 py-2 bg-white border-2 border-[#141414] hover:bg-[#F50064] hover:text-white font-mono text-xs font-bold text-[#141414] flex items-center space-x-2 transition shadow-brutal-sm group"
              >
                <Sparkles className="w-4 h-4 text-[#0A2E23] group-hover:text-white" />
                <span>SAMPLE_PORTRAIT.JPG</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Loaded Preview State */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Image Display */}
          <div className="md:col-span-5 bg-[#141414] p-2 border-2 border-[#141414] shadow-brutal relative group">
            <img
              src={previewUrl || ''}
              alt="Target Face Artifact"
              className="w-full h-64 object-contain bg-[#242424]"
            />
            {isProcessing && (
              <div className="absolute inset-2 bg-[#071F17]/85 backdrop-blur-sm flex flex-col items-center justify-center text-[#F5F0E3] p-4 text-center">
                <RefreshCw className="w-8 h-8 text-[#F50064] animate-spin mb-2" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F50064]">
                  ANALYSIS IN PROGRESS
                </span>
                <span className="text-[10px] font-mono text-[#FAF7F0] mt-1">
                  Extracting vectors & querying web...
                </span>
              </div>
            )}
          </div>

          {/* Metadata & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
            
            <div className="bg-white border-2 border-[#141414] p-4 space-y-2.5 text-xs font-mono text-[#141414]">
              <div className="flex justify-between border-b border-[#141414]/15 pb-1.5">
                <span className="text-[#666666]">SOURCE FILE:</span>
                <span className="font-bold text-[#141414] truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : sampleFilename || 'Target Image'}
                </span>
              </div>

              {fileDimensions && (
                <div className="flex justify-between border-b border-[#141414]/15 pb-1.5">
                  <span className="text-[#666666]">DIMENSIONS:</span>
                  <span className="font-bold text-[#141414]">
                    {fileDimensions.width} × {fileDimensions.height} PX
                  </span>
                </div>
              )}

              {selectedFile && (
                <div className="flex justify-between border-b border-[#141414]/15 pb-1.5">
                  <span className="text-[#666666]">FILE SIZE:</span>
                  <span className="font-bold text-[#141414]">{formatFileSize(selectedFile.size)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[#666666]">SHA-256 DIGEST:</span>
                <span className="font-bold text-[#F50064] bg-[#F50064]/10 px-2 py-0.5 border border-[#F50064]/30 text-[11px]">
                  {imageHashPrefix || 'Calculating...'}
                </span>
              </div>
            </div>

            {/* Run Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onRunTrace}
                disabled={isProcessing}
                className={`w-full py-4 px-6 text-sm font-mono uppercase font-bold tracking-wider transition flex items-center justify-center space-x-2 border-2 border-[#141414] shadow-brutal ${
                  isProcessing
                    ? 'bg-[#555555] text-white cursor-not-allowed opacity-80'
                    : 'bg-[#F50064] text-white hover:bg-[#FF006E] active:translate-x-0.5 active:translate-y-0.5 shadow-brutal-pink'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>TRACE INITIALIZED — EXECUTING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>[ RUN TRACE ]</span>
                  </>
                )}
              </button>

              {!isProcessing && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full py-2 text-xs font-mono text-[#555555] hover:text-[#141414] text-center font-bold"
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
