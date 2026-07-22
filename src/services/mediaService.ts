import { restaurantConfig } from '../config/restaurant';
import type { MediaRecord, MediaUploadInput } from '../types/api';
import { apiRequest } from './apiClient';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 45 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

function validateFile(file: File, type: 'image' | 'video') {
  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  const maxBytes = type === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(type === 'image' ? 'Solo se permiten imagenes JPG, PNG o WEBP.' : 'Solo se permiten videos MP4 o WEBM.');
  }
  if (file.size > maxBytes) {
    throw new Error(
      type === 'image'
        ? 'La imagen supera 10 MB antes de comprimir.'
        : 'El video supera el limite recomendado para Apps Script. Usa un archivo menor a 45 MB.'
    );
  }
}

export async function uploadMediaFile(
  file: File,
  options: Omit<MediaUploadInput, 'base64' | 'fileName' | 'mimeType' | 'restaurantId' | 'type'> & {
    type?: 'image' | 'video';
    restaurantId?: string;
  }
) {
  const type = options.type ?? (file.type.startsWith('video/') ? 'video' : 'image');
  validateFile(file, type);
  const dataUrl = await readAsDataUrl(file);
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

  return apiRequest<MediaRecord, MediaUploadInput>('uploadMedia', {
    base64,
    dishId: options.dishId,
    fileName: file.name,
    isPrimary: options.isPrimary,
    mimeType: file.type,
    postId: options.postId,
    restaurantId: options.restaurantId ?? restaurantConfig.restaurantId,
    sortOrder: options.sortOrder,
    type
  });
}

export async function deleteMedia(mediaId: string, restaurantId = restaurantConfig.restaurantId) {
  return apiRequest<{ deleted: boolean }, { mediaId: string; restaurantId: string }>('deleteMedia', { mediaId, restaurantId });
}

export async function getMediaUrl(fileId: string) {
  return apiRequest<{ fileId: string; url: string }, { fileId: string }>('getMediaUrl', { fileId });
}
