import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { CameraCapture } from './CameraCapture';
import type { ExperienceMediaDraft } from './experienceTypes';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function ExperienceMediaPicker({
  error,
  media,
  onChange,
  onError
}: {
  error?: string;
  media: ExperienceMediaDraft | null;
  onChange: (media: ExperienceMediaDraft | null) => void;
  onError: (message: string) => void;
}) {
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const applyFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Solo puedes usar imagenes JPG, JPEG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      onError('La imagen no puede superar 10 MB antes de comprimir.');
      return;
    }
    if (media) {
      URL.revokeObjectURL(media.previewUrl);
    }
    onError('');
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  };

  const removePhoto = () => {
    if (media) {
      URL.revokeObjectURL(media.previewUrl);
    }
    onChange(null);
  };

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-sm font-black leading-5 text-white">Foto de tu experiencia</h2>
        <p className="text-[11px] leading-4 text-muted">Toma una foto o elige una de tu galeria.</p>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-base">
        {media ? (
          <img alt="Vista previa de la experiencia" className="aspect-[16/7] w-full object-cover" src={media.previewUrl} />
        ) : (
          <div className="grid aspect-[16/7] place-items-center p-4 text-center">
            <div>
              <div className="mx-auto grid size-10 place-items-center rounded-full bg-accent/15 text-accent">
                <ImagePlus className="size-5" />
              </div>
              <p className="mt-1.5 text-sm font-bold text-white">Agrega una foto</p>
              <p className="text-[11px] text-muted">Tambien puedes publicar solo un comentario.</p>
            </div>
          </div>
        )}
      </div>

      {error ? <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-[16px] bg-accent text-xs font-black text-white"
          onClick={() => {
            if ('mediaDevices' in navigator) {
              setCameraOpen(true);
            } else {
              captureInputRef.current?.click();
            }
          }}
          type="button"
        >
          <Camera className="size-4" />
          Tomar foto
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-surface text-xs font-black text-white"
          onClick={() => galleryInputRef.current?.click()}
          type="button"
        >
          <ImagePlus className="size-4" />
          Galeria
        </button>
      </div>

      {media ? (
        <button className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-[16px] text-xs font-bold text-red-200" onClick={removePhoto} type="button">
          <Trash2 className="size-4" />
          Eliminar fotografia
        </button>
      ) : null}

      <input
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(event) => applyFile(event.target.files?.[0])}
        ref={galleryInputRef}
        type="file"
      />
      <input
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(event) => applyFile(event.target.files?.[0])}
        ref={captureInputRef}
        type="file"
      />

      {cameraOpen ? <CameraCapture onCapture={applyFile} onClose={() => setCameraOpen(false)} /> : null}
    </div>
  );
}
