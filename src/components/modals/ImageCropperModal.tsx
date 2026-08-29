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
  const [step, setStep] = useState<'crop' | 'preview'>('crop');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState<number>(1);
  const [previewBase64, setPreviewBase64] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Zoom bounds: 1x to 3x
  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 3.0;
  const ZOOM_STEP = 0.1;

  // Reset modal state whenever a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setStep('crop');
      setScale(1);
      setPreviewBase64('');
      setResolutionError(null);
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

  // Called when image is loaded in the DOM
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;

    // Strict 256x256 resolution verification
    const resCheck = checkImageResolution(naturalWidth, naturalHeight, MIN_IMAGE_DIMENSION);
    if (!resCheck.isValid) {
      setResolutionError(
        resCheck.error || `Image resolution is below the ${MIN_IMAGE_DIMENSION}x${MIN_IMAGE_DIMENSION}px minimum requirement.`
      );
    } else {
      setResolutionError(null);
    }

    // Set initial 1:1 circular crop box
    const initialCrop = centerAspectCrop(width, height, 1);
    setCrop(initialCrop);
  }, []);

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

  // Generate cropped image and advance to 'Confirm Preview' step
  const handleProceedToPreview = () => {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      return;
    }

    try {
      const cropped = getCroppedCanvasImage(
        imgRef.current,
        completedCrop,
        300,
        scale,
        0,
        0.88
      );

      if (cropped) {
        setPreviewBase64(cropped);
        setStep('preview');
      }
    } catch (err) {
      console.error('Error generating preview crop:', err);
    }
  };

  // Final confirmation to save the cropped avatar
  const handleConfirmSave = async () => {
    if (!previewBase64 || isProcessing) return;

    try {
      setIsProcessing(true);
      await onApplyCrop(previewBase64);
      onClose();
    } catch (err) {
      console.error('Error applying avatar:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#141B2A] border border-neutral-200 dark:border-[#243048] rounded-[2rem] p-5 sm:p-6 shadow-2xl space-y-4 animate-scaleUp overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-[#2E3C56] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black shadow-sm">
              <span className="material-symbols-outlined text-lg">
                {step === 'crop' ? 'crop' : 'check_circle'}
              </span>
            </div>
            <div>
              <h3 id="crop-modal-title" className="text-base sm:text-lg font-black text-black dark:text-white leading-tight">
                {step === 'crop' ? title : 'Confirm Avatar Preview'}
              </h3>
              <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                {step === 'crop'
                  ? 'Frame & Zoom (1:1 Circular Aspect Ratio)'
                  : 'Review your final profile picture before saving'}
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

        {/* Resolution Error Banner */}
        {resolutionError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 shrink-0 animate-fadeIn">
            <span className="material-symbols-outlined text-lg shrink-0">error</span>
            <span>{resolutionError}</span>
          </div>
        )}

        {/* STEP 1: CROP & ZOOM FRAMING */}
        {step === 'crop' && (
          <>
            {/* Cropping Area */}
            <div className="w-full flex items-center justify-center min-h-[260px] max-h-[46vh] overflow-hidden bg-neutral-950 rounded-2xl p-2 relative shadow-inner border border-neutral-800 shrink-0">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                keepSelection
                className="max-h-[44vh] max-w-full"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop Source"
                  onLoad={onImageLoad}
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.08s ease-out',
                  }}
                  className="max-h-[44vh] max-w-full object-contain select-none"
                />
              </ReactCrop>
            </div>

            {/* Zoom Slider Controls */}
            <div className="space-y-2 p-3 bg-neutral-50 dark:bg-[#161F2E] border border-neutral-200/80 dark:border-[#243048] rounded-2xl shrink-0">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-neutral-500">zoom_in</span>
                  <span>Zoom Level (1.0x - 3.0x)</span>
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

            {/* Step 1 Actions */}
            <div className="flex items-center gap-3 pt-1 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-neutral-100 dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToPreview}
                disabled={!completedCrop || completedCrop.width === 0 || !!resolutionError}
                className="flex-2 py-3 px-4 rounded-xl font-black text-xs bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Confirm Preview</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: CONFIRM PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Preview Card */}
            <div className="p-6 bg-neutral-50 dark:bg-[#161F2E] border border-neutral-200/80 dark:border-[#243048] rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
              
              <div className="relative">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-black dark:border-white shadow-2xl bg-neutral-200 dark:bg-neutral-800 mx-auto transition-transform hover:scale-105">
                  <img
                    src={previewBase64}
                    alt="Cropped Profile Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-white shadow-md border-2 border-white dark:border-[#141B2A] flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm font-black">check</span>
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-black text-black dark:text-white">
                  Looking sharp!
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs font-medium">
                  This 1:1 circular photo will be applied to your profile and synced to your cloud account.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  1:1 Circular
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  Optimized JPEG
                </span>
              </div>
            </div>

            {/* Step 2 Actions */}
            <div className="flex items-center gap-3 pt-1 shrink-0">
              <button
                type="button"
                onClick={() => setStep('crop')}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-neutral-100 dark:bg-[#1C263A] text-black dark:text-white border border-neutral-200 dark:border-[#2E3C56] hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Adjust Crop</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isProcessing}
                className="flex-2 py-3 px-4 rounded-xl font-black text-xs bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving Avatar...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    <span>Save Profile Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
