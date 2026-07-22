import { ArrowLeft, ShoppingBag, Utensils } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantConfig } from '../../config/restaurant';
import { createExperiencePost } from '../../services/experiencePostsService';
import { uploadMediaFile } from '../../services/mediaService';
import { useCartStore } from '../../store/useCartStore';
import { readCustomerProfile } from '../../utils/customerProfile';
import { formatCurrency } from '../../utils/format';
import { getOrCreateCustomerSessionId, getOrCreateTableSessionId } from '../../utils/session';
import { CustomerNameDialog } from '../CustomerNameDialog';
import { useToast } from '../Toast';
import { ExperienceCaptionInput } from './ExperienceCaptionInput';
import { ExperienceConsent } from './ExperienceConsent';
import { ExperienceMediaPicker } from './ExperienceMediaPicker';
import { PublishExperienceButton } from './PublishExperienceButton';
import { UploadProgress } from './UploadProgress';
import type { ExperienceMediaDraft } from './experienceTypes';

type FormErrors = {
  caption?: string;
  consent?: string;
  media?: string;
  submit?: string;
};

function makeExperienceIdempotencyKey() {
  return `experience_${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function fileToImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No pudimos leer la imagen.'));
    };
    image.src = url;
  });
}

async function compressImage(file: File) {
  const image = await fileToImage(file);
  const maxSide = 1440;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No pudimos preparar la imagen.');
  }
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => (nextBlob ? resolve(nextBlob) : reject(new Error('No pudimos comprimir la imagen.'))), 'image/jpeg', 0.82);
  });
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
}

export function CreateExperiencePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const cartItems = useCartStore((state) => state.items);
  const selectedCartDishId = useCartStore((state) => state.selectedDishId);
  const [media, setMedia] = useState<ExperienceMediaDraft | null>(null);
  const [caption, setCaption] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const idempotencyKeyRef = useRef(makeExperienceIdempotencyKey());

  const customerSessionId = useMemo(() => getOrCreateCustomerSessionId(), []);
  const tableSessionId = useMemo(
    () => getOrCreateTableSessionId(restaurantConfig.restaurantId, restaurantConfig.tableId),
    []
  );
  const cartDish = useMemo(
    () => cartItems.find((item) => item.dishId === selectedCartDishId) ?? cartItems[cartItems.length - 1] ?? null,
    [cartItems, selectedCartDishId]
  );

  useEffect(() => {
    if (!readCustomerProfile().displayName.trim()) {
      setNameDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (media) {
        URL.revokeObjectURL(media.previewUrl);
      }
    };
  }, [media]);

  const validate = () => {
    const nextErrors: FormErrors = {};
    const trimmedCaption = caption.replace(/\s+/g, ' ').trim();

    if (!media && !trimmedCaption) {
      nextErrors.caption = 'Agrega una fotografia o escribe un comentario para publicar.';
    }
    if (trimmedCaption.length > 300) {
      nextErrors.caption = 'El comentario no puede superar 300 caracteres.';
    }
    if (!readCustomerProfile().displayName.trim()) {
      setNameDialogOpen(true);
      nextErrors.submit = 'Confirma tu nombre para publicar.';
    }
    if (!consentAccepted) {
      nextErrors.consent = 'Debes aceptar la autorizacion de publicacion.';
    }
    if (!navigator.onLine) {
      nextErrors.submit = 'Necesitas conexion para publicar.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const publish = async () => {
    if (publishing || !validate()) {
      return;
    }

    setPublishing(true);
    setProgress(8);
    setProgressLabel('Preparando publicacion');
    setErrors({});

    try {
      const profile = readCustomerProfile();
      const trimmedCaption = caption.replace(/\s+/g, ' ').trim();
      let mediaUrl: string | null = null;
      let mediaDriveFileId: string | null = null;

      if (media) {
        setProgress(28);
        setProgressLabel('Comprimiendo imagen');
        const compressedFile = await compressImage(media.file);
        setProgress(62);
        setProgressLabel('Subiendo imagen');
        const uploaded = await uploadMediaFile(compressedFile, { type: 'image' });
        mediaUrl = uploaded.fileUrl;
        mediaDriveFileId = uploaded.driveFileId;
      }

      setProgress(82);
      setProgressLabel('Publicando');
      const post = await createExperiencePost({
        dishId: cartDish?.dishId ?? null,
        dishImage: cartDish?.image ?? null,
        dishName: cartDish?.name ?? null,
        idempotencyKey: idempotencyKeyRef.current,
        mediaDriveFileId,
        mediaType: mediaUrl ? 'image' : null,
        mediaUrl,
        orderId: null,
        restaurantId: restaurantConfig.restaurantId,
        tableSessionId,
        text: trimmedCaption,
        userId: customerSessionId,
        userName: profile.displayName.trim() || 'Cliente',
        userPhoto: null
      });

      setProgress(100);
      showToast('Tu experiencia fue enviada. Gracias por ayudarnos a crecer.');
      navigate(`/experience/${post.id}`, { replace: true });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'No pudimos publicar tu experiencia.';
      setErrors({ submit: message });
      idempotencyKeyRef.current = makeExperienceIdempotencyKey();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 pb-[112px] pt-4">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-4 flex items-center gap-3">
          <button
            aria-label="Volver"
            className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-surface text-white"
            onClick={() => navigate('/comunidad')}
            type="button"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Mesa {restaurantConfig.tableNumber}</p>
            <h1 className="truncate text-xl font-black text-white">Comparte tu experiencia</h1>
          </div>
        </div>

        <section className="space-y-4 rounded-[24px] border border-white/10 bg-card p-4 shadow-2xl">
          <div className="rounded-[20px] border border-accent/25 bg-accent/10 p-4">
            <h2 className="text-base font-black text-white">{'Por favor, crea una publicaci\u00f3n y ay\u00fadanos a crecer.'}</h2>
            <p className="mt-2 text-sm leading-5 text-white/75">
              {'Cu\u00e9ntales a otros clientes qu\u00e9 est\u00e1s disfrutando y comparte tu momento en el restaurante.'}
            </p>
          </div>

          <ExperienceMediaPicker
            error={errors.media}
            media={media}
            onChange={setMedia}
            onError={(message) => setErrors((current) => ({ ...current, media: message }))}
          />
          <ExperienceCaptionInput error={errors.caption} onChange={setCaption} value={caption} />

          <div className="rounded-[20px] border border-white/10 bg-surface p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
                {cartDish ? <ShoppingBag className="size-5" /> : <Utensils className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-white">Plato relacionado automaticamente</p>
                {cartDish ? (
                  <p className="truncate text-xs text-muted">
                    {cartDish.name} · {formatCurrency(cartDish.price)} · x{cartDish.quantity}
                  </p>
                ) : (
                  <p className="text-xs text-muted">No hay platos en el carrito. Se publicara como experiencia general.</p>
                )}
              </div>
            </div>
          </div>

          <ExperienceConsent accepted={consentAccepted} error={errors.consent} onChange={setConsentAccepted} />
          {progressLabel ? <UploadProgress label={progressLabel} progress={progress} /> : null}
          {errors.submit ? <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{errors.submit}</p> : null}

          <div className="sticky bottom-[88px] z-30 rounded-[20px] border border-white/10 bg-base/90 p-2 backdrop-blur">
            <PublishExperienceButton disabled={publishing} onClick={publish} publishing={publishing} />
          </div>
        </section>
      </div>

      <CustomerNameDialog
        description="Usaremos este nombre visible para tus publicaciones y pedidos de esta mesa."
        onClose={() => setNameDialogOpen(false)}
        open={nameDialogOpen}
        title="Confirma tu nombre"
      />
    </div>
  );
}
