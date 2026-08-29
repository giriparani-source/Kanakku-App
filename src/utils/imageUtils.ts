import { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MIN_IMAGE_DIMENSION = 256; // 256px minimum width & height

/**
 * Validates file type (JPEG/PNG only) and file size (<= 5MB).
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (!file) {
    return { isValid: false, error: 'No file was selected.' };
  }

  const fileType = file.type?.toLowerCase() || '';
  const fileName = file.name?.toLowerCase() || '';

  const isMimeValid = ALLOWED_IMAGE_TYPES.includes(fileType);
  const isExtensionValid = /\.(jpe?g|png)$/i.test(fileName);

  if (!isMimeValid && !isExtensionValid) {
    return {
      isValid: false,
      error: 'Invalid file format. Only JPEG and PNG images are supported.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size exceeds 5MB limit (${sizeInMB} MB). Please choose a smaller image.`,
    };
  }

  return { isValid: true };
};

/**
 * Checks if the image dimensions meet the minimum resolution (default: 256x256 px).
 */
export const checkImageResolution = (
  width: number,
  height: number,
  minDim: number = MIN_IMAGE_DIMENSION
): ImageValidationResult => {
  if (!width || !height || width < minDim || height < minDim) {
    return {
      isValid: false,
      error: `Image resolution is too low (${width || 0}x${height || 0}px). Minimum required resolution is ${minDim}x${minDim} pixels.`,
    };
  }
  return { isValid: true };
};

/**
 * Asynchronously validates format, file size, and image resolution (>= 256x256 px).
 */
export const validateImageFileAndDimensions = (
  file: File,
  minDim: number = MIN_IMAGE_DIMENSION
): Promise<ImageValidationResult> => {
  return new Promise((resolve) => {
    const baseValidation = validateImageFile(file);
    if (!baseValidation.isValid) {
      resolve(baseValidation);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const resCheck = checkImageResolution(img.naturalWidth, img.naturalHeight, minDim);
      resolve(resCheck);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        isValid: false,
        error: 'Unable to process the image file. Please check if the file is corrupted.',
      });
    };

    img.src = objectUrl;
  });
};

/**
 * Helper to calculate a centered 1:1 aspect crop on image load.
 */
export function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number = 1
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Utility to read and compress user uploaded images into compact Base64 strings.
 */
export const fileToBase64 = (
  file: File,
  maxDim: number = 320,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Extract 1:1 cropped square/circle image dataURL from HTMLImageElement and PixelCrop,
 * factoring in zoom scale and rotation, and compressing output Base64 JPEG.
 */
export const getCroppedCanvasImage = (
  image: HTMLImageElement,
  crop: PixelCrop,
  targetSize: number = 300,
  scale: number = 1,
  rotate: number = 0,
  quality: number = 0.88
): string => {
  if (!image || !crop || crop.width === 0 || crop.height === 0) {
    return '';
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  canvas.width = targetSize;
  canvas.height = targetSize;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;
  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;

  if (scale === 1 && rotate === 0) {
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetSize,
      targetSize
    );
  } else {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';

      tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
      if (rotate) tempCtx.rotate((rotate * Math.PI) / 180);
      if (scale !== 1) tempCtx.scale(scale, scale);
      tempCtx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);

      tempCtx.drawImage(image, 0, 0);

      ctx.drawImage(
        tempCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetSize,
        targetSize
      );
    } else {
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetSize,
        targetSize
      );
    }
  }

  return canvas.toDataURL('image/jpeg', quality);
};
