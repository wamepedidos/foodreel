import { Camera, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function CameraCapture({
  onCapture,
  onClose
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('No pudimos abrir la camara. Revisa el permiso o elige una foto de la galeria.');
    }
  };

  useEffect(() => {
    void startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('La camara aun no esta lista.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('No pudimos guardar la foto.');
          return;
        }
        onCapture(new File([blob], `experiencia-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        onClose();
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-[90] flex justify-center bg-black/85 backdrop-blur" role="dialog">
      <div className="flex h-dvh w-full max-w-[520px] flex-col bg-card md:my-4 md:h-[calc(100dvh-32px)] md:rounded-[28px] md:border md:border-white/10">
        <div className="flex items-center justify-between border-b border-white/10 px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))]">
          <div>
            <h2 className="text-lg font-black text-white">Tomar foto</h2>
            <p className="text-xs text-muted">Usa la camara del dispositivo cuando este disponible.</p>
          </div>
          <button aria-label="Cerrar camara" className="grid size-10 place-items-center rounded-2xl bg-white/5 text-white" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 p-4">
          <div className="grid h-full place-items-center overflow-hidden rounded-[20px] bg-black">
            {error ? (
              <div className="p-5 text-center">
                <p className="text-sm text-red-100">{error}</p>
                <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-accent px-4 text-sm font-black text-white" onClick={startCamera} type="button">
                  <RotateCcw className="size-4" />
                  Intentar de nuevo
                </button>
              </div>
            ) : (
              <video className="h-full w-full object-cover" muted playsInline ref={videoRef} />
            )}
          </div>
        </div>

        <div className="border-t border-white/10 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-sm font-black text-white shadow-glow" onClick={capture} type="button">
            <Camera className="size-5" />
            Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}
