import type { PixelCrop } from 'react-image-crop';

/**
 * Utility to read and compress user uploaded images into compact Base64 strings.
 */
export const fileToBase64 = (file: File, maxDim: number = 320, quality: number = 0.85): Promise<string> => {
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
        // Fallback to raw data url if canvas drawing fails
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Extract 1:1 cropped square/circle image dataURL from HTMLImageElement and PixelCrop
 */
export const getCroppedCanvasImage = (
  image: HTMLImageElement,
  crop: PixelCrop,
  targetSize: number = 256
): string => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  ctx.imageSmoothingQuality = 'high';

  const sourceX = crop.x * scaleX;
  const sourceY = crop.y * scaleY;
  const sourceWidth = crop.width * scaleX;
  const sourceHeight = crop.height * scaleY;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    targetSize,
    targetSize
  );

  return canvas.toDataURL('image/jpeg', 0.9);
};

