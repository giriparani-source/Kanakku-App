import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  centerAspectCrop,
  checkImageResolution,
  getCroppedCanvasImage,
  MIN_IMAGE_DIMENSION,
} from '../../utils/imageUtils';

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApplyCrop: (croppedBase64: string) => void | Promise<void>;
  title?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
  title = 'Crop Profile Photo',
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState<number>(1);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resolutionWarning, setResolutionWarning] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Zoom bounds
  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 3.0;
  const ZOOM_STEP = 0.1;

  // Reset state when opening a new image
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPreviewUrl('');
      setResolutionWarning(null);
      setIsProcessing(false);
    }
  }, [isOpen, imageSrc]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  // Called when the image loads into the DOM
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;

    // Check resolution
    const resCheck = checkImageResolution(naturalWidth, naturalHeight, MIN_IMAGE_DIMENSION);
    if (!resCheck.isValid) {
      setResolutionWarning(resCheck.error || 'Image resolution is low and may appear blurry.');
    } else {
      setResolutionWarning(null);
    }

    // Set initial centered 1:1 crop
    const initialCrop = centerAspectCrop(width, height, 1);
    setCrop(initialCrop);
  }, []);

  // Update live preview whenever crop or scale changes
  useEffect(() => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      return;
    }

    try {
      const liveDataUrl = getCroppedCanvasImage(
        imgRef.current,
        completedCrop,
        180, // Lightweight preview resolution
        scale,
        0,
        0.8
      );
      setPreviewUrl(liveDataUrl);
    } catch (err) {
      console.warn('Live crop preview calculation error:', err);
    }
  }, [completedCrop, scale]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(MAX_ZOOM, parseFloat((prev + ZOOM_STEP).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(MIN_ZOOM, parseFloat((prev - ZOOM_STEP).toFixed(2))));
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  };

  const handleResetZoom = () => {
    setScale(1);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, 1));
    }
  };

  const handleApply = async () => {
    if (!imgRef.current || !completedCrop || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      // Generate final high quality compressed 300x300 JPEG (~30KB)
      const croppedBase64 = getCroppedCanvasImage(
        imgRef.current,
        completedCrop,
        300,
        scale,
        0,
        0.88
      );

      if (croppedBase64) {
        await onApplyCrop(croppedBase64);
      }
    } catch (err) {
      console.error('Error applying cropped avatar:', err);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2rem] p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleUp overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-[#2E3C56] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-sm">
              <span className="material-symbols-outlined text-lg">crop</span>
            </div>
            <div>
              <h3 id="crop-modal-title" className="text-base sm:text-lg font-black text-black dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                1:1 Aspect Ratio • High Quality Compression
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close Crop Modal"
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Resolution Warning Banner */}
        {resolutionWarning && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2 shrink-0 animate-fadeIn">
            <span className="material-symbols-outlined text-base shrink-0">warning</span>
            <span>{resolutionWarning}</span>
          </div>
        )}

        {/* Crop Area & Live Preview Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 overflow-y-auto py-1">
          {/* Main Cropper Box */}
          <div className="flex-1 w-full flex items-center justify-center min-h-[240px] max-h-[42vh] overflow-hidden bg-neutral-950 rounded-2xl p-2 relative shadow-inner border border-neutral-800">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              keepSelection
              className="max-h-[40vh] max-w-full"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Upload to Crop"
                onLoad={onImageLoad}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.1s ease-out',
                }}
                className="max-h-[40vh] max-w-full object-contain select-none"
              />
            </ReactCrop>
          </div>

          {/* Live Preview Column */}
          <div className="sm:w-36 flex sm:flex-col items-center justify-center gap-3 p-3 bg-neutral-50 dark:bg-[#1A2333] border border-neutral-200 dark:border-[#2A374F] rounded-2xl shrink-0">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1">
                Final Preview
              </span>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 border-black dark:border-white shadow-md bg-neutral-200 dark:bg-neutral-800 relative mx-auto">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Live Crop Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 text-center leading-tight">
              Circular Avatar
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="space-y-2 p-3 bg-neutral-50 dark:bg-[#161F2E] border border-neutral-200/80 dark:border-[#243048] rounded-2xl shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-neutral-500">zoom_in</span>
              <span>Zoom & Framing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-[11px] font-black text-black dark:text-white">
                {Math.round(scale * 100)}%
              </span>
              {scale !== 1 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="text-[10px] text-neutral-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= MIN_ZOOM}
              aria-label="Zoom Out"
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#202B3E] border border-neutral-200 dark:border-[#2F3E58] flex items-center justify-center text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">remove</span>
            </button>

            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              value={scale}
              onChange={handleZoomChange}
              aria-label="Zoom scale slider"
              className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
            />

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= MAX_ZOOM}
              aria-label="Zoom In"
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#202B3E] border border-neutral-200 dark:border-[#2F3E58] flex items-center justify-center text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              <span className="material-symbols-outlined text-base">add</span>
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center gap-3 pt-1 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-neutral-100 dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing || !completedCrop || completedCrop.width === 0}
            className="flex-2 py-3 px-4 rounded-xl font-black text-xs bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Compressing & Saving...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                <span>Save Profile Photo</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
