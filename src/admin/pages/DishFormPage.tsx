import {
  ArrowDown,
  ArrowUp,
  Eye,
  ImagePlus,
  Link as LinkIcon,
  MessageCircle,
  PackagePlus,
  Plus,
  Save,
  Send,
  Star,
  Trash2,
  Upload,
  Video
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AdminDish, DishAddition, DishMediaItem, Sauce } from '../adminTypes';
import { getInteractionRate } from '../components/DashboardComponents';
import { createDish, getAdminDishes, getDishesSnapshot, updateDish, uploadDishMedia } from '../../services/dishesService';
import { restaurantConfig } from '../../config/restaurant';
import { useToast } from '../../components/Toast';
import { formatCurrency } from '../../utils/format';

const categories = ['Bebida', 'Entrada', 'Plato fuerte', 'Postre'];
const servingOptions = [
  { label: '1 persona', value: 1 },
  { label: '2 personas', value: 2 },
  { label: '3 personas', value: 3 },
  { label: '4 personas', value: 4 },
  { label: '5 o mas', value: 5 },
  { label: 'Porcion variable', value: 0 }
];
const featureOptions = [
  'Nuevo',
  'Mas vendido',
  'Recomendado por el chef',
  'Especialidad de la casa',
  'Edicion limitada',
  'Disponible por temporada',
  'Para compartir',
  'Porcion individual',
  'Plato ligero',
  'Favorito de los clientes',
  'Preparacion artesanal',
  'Ingredientes locales'
];
const allergenOptions = ['Gluten', 'Lacteos', 'Huevo', 'Mani', 'Frutos secos', 'Mariscos', 'Pescado', 'Soya'];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function blankDish(): AdminDish {
  const iso = new Date().toISOString();
  return {
    id: '',
    restaurantId: restaurantConfig.restaurantId,
    categoryId: 'Plato fuerte',
    title: '',
    shortDescription: '',
    description: '',
    price: 0,
    status: 'draft',
    mainImageUrl: '',
    gallery: [],
    videoUrl: '',
    videoThumbnailUrl: '',
    servingSizes: [1],
    servingDescription: '',
    spicyLevel: 0,
    isVegan: false,
    isVegetarian: false,
    isGlutenFree: false,
    sauces: [],
    sauceSelectionRequired: false,
    minimumSauces: 0,
    maximumSauces: 1,
    features: [],
    ingredients: [],
    removableIngredients: [],
    additions: [],
    allergens: [],
    dietaryNotes: '',
    crossContaminationWarning: '',
    preparationTimeMin: '',
    preparationTimeMax: '',
    likesCount: 0,
    viewsCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    addedToOrderCount: 0,
    ordersCount: 0,
    customerPostsCount: 0,
    soldCount: 0,
    sortOrder: 1,
    createdAt: iso,
    updatedAt: iso
  };
}

function normalizeDishForm(dish: AdminDish): AdminDish {
  return {
    ...dish,
    additions: Array.isArray(dish.additions) ? dish.additions : [],
    gallery: Array.isArray(dish.gallery) ? dish.gallery : [],
    ingredients: Array.isArray(dish.ingredients) ? dish.ingredients : [],
    removableIngredients: Array.isArray(dish.removableIngredients) ? dish.removableIngredients : dish.ingredients ?? [],
    sauces: Array.isArray(dish.sauces) ? dish.sauces : []
  };
}

export function DishFormPage() {
  const { dishId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [dish, setDish] = useState<AdminDish>(() => blankDish());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const isEditing = Boolean(dishId);

  useEffect(() => {
    if (!dishId) return;
    const cached = getDishesSnapshot().find((item) => item.id === dishId);
    if (cached) setDish(normalizeDishForm(cached));
    void getAdminDishes()
      .then((dishes) => {
        const found = dishes.find((item) => item.id === dishId);
        if (found) setDish(normalizeDishForm(found));
      })
      .catch(() => undefined);
  }, [dishId]);

  const title = isEditing ? 'Editar plato' : 'Crear plato';

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!dish.title.trim()) nextErrors.title = 'El titulo es obligatorio.';
    if (Number(dish.price) < 0) nextErrors.price = 'El precio debe ser mayor o igual a cero.';
    if (dish.shortDescription.length > 140) nextErrors.shortDescription = 'Maximo 140 caracteres.';
    if (dish.preparationTimeMin !== '' && Number(dish.preparationTimeMin) < 0) nextErrors.preparationTimeMin = 'No puede ser negativo.';
    if (
      dish.preparationTimeMin !== '' &&
      dish.preparationTimeMax !== '' &&
      Number(dish.preparationTimeMax) < Number(dish.preparationTimeMin)
    ) {
      nextErrors.preparationTimeMax = 'El maximo no puede ser inferior al minimo.';
    }
    if (dish.minimumSauces < 0) nextErrors.minimumSauces = 'El minimo no puede ser negativo.';
    if (dish.maximumSauces < dish.minimumSauces) nextErrors.maximumSauces = 'El maximo debe ser mayor o igual al minimo.';
    if (dish.additions.some((addition) => Number(addition.price) < 0)) {
      nextErrors.additions = 'Las adiciones no pueden tener precio negativo.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveDish = async (status: AdminDish['status']) => {
    if (!validate()) return;
    setSaving(true);
    try {
      let payload = { ...dish, status };
      if (pendingFiles.length) {
        const uploaded = await uploadDishMedia(pendingFiles, setUploadProgress);
        const images = uploaded.filter((item) => item.type === 'image');
        const video = uploaded.find((item) => item.type === 'video');
        payload = {
          ...payload,
          gallery: [...payload.gallery.filter((item) => !item.url.startsWith('blob:')), ...images],
          mainImageUrl: payload.mainImageUrl.startsWith('blob:') ? images[0]?.url ?? payload.mainImageUrl : payload.mainImageUrl,
          videoUrl: payload.videoUrl.startsWith('blob:') ? video?.url ?? payload.videoUrl : payload.videoUrl
        };
      }
      const saved = isEditing && dishId ? await updateDish(dishId, payload) : await createDish(payload);
      setDish(saved);
      setPendingFiles([]);
      showToast('Plato guardado correctamente');
      navigate('/admin/menu');
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'No se pudo guardar el plato.';
      setErrors((current) => ({ ...current, submit: message }));
      showToast(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Carta</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-card px-4 text-sm font-black disabled:opacity-50"
            disabled={saving}
            onClick={() => saveDish('draft')}
            type="button"
          >
            <Save className="size-5" />
            Guardar borrador
          </button>
          <button
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-4 text-sm font-black text-white shadow-glow disabled:opacity-50"
            disabled={saving}
            onClick={() => saveDish(dish.status === 'unavailable' ? 'unavailable' : 'active')}
            type="button"
          >
            <Upload className="size-5" />
            Publicar plato
          </button>
          <Link className="inline-flex h-12 items-center rounded-2xl border border-white/10 bg-card px-4 text-sm font-black" to="/admin/menu">
            Cancelar
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5">
          {errors.submit ? (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm font-bold text-red-100">
              {errors.submit}
            </p>
          ) : null}
          <FormSection title="Informacion principal">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField error={errors.title} label="Titulo del plato" onChange={(value) => setDish({ ...dish, title: value })} value={dish.title} />
              <NumberField error={errors.price} label="Precio" onChange={(value) => setDish({ ...dish, price: value })} value={dish.price} />
              <TextField
                error={errors.shortDescription}
                label="Descripcion corta"
                maxLength={140}
                onChange={(value) => setDish({ ...dish, shortDescription: value })}
                value={dish.shortDescription}
              />
              <NumberField label="Orden dentro de la categoria" onChange={(value) => setDish({ ...dish, sortOrder: value })} value={dish.sortOrder} />
            </div>
            <label className="mt-4 grid gap-1 text-sm font-bold text-white/64">
              Descripcion completa
              <textarea
                className="min-h-28 rounded-2xl border border-white/10 bg-base px-3 py-3 text-sm text-white outline-none focus:border-accent"
                onChange={(event) => setDish({ ...dish, description: event.target.value })}
                value={dish.description}
              />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ToggleButton active={dish.status === 'active'} label="Disponible" onClick={() => setDish({ ...dish, status: 'active' })} />
              <ToggleButton active={dish.status === 'unavailable'} label="Agotado" onClick={() => setDish({ ...dish, status: 'unavailable' })} />
              <ToggleButton active={dish.status === 'draft'} label="Borrador" onClick={() => setDish({ ...dish, status: 'draft' })} />
            </div>
          </FormSection>

          <DishMediaUploader
            dish={dish}
            onChange={setDish}
            onFiles={(files) => setPendingFiles((current) => [...current, ...files])}
            progress={uploadProgress}
          />
          <DishCategorySelector dish={dish} onChange={setDish} />
          <ServingSizeSelector dish={dish} onChange={setDish} />
          <SpicyLevelSelector dish={dish} onChange={setDish} />
          <DietaryOptions dish={dish} onChange={setDish} />
          <SauceManager dish={dish} errors={errors} onChange={setDish} />
          <AdditionManager dish={dish} error={errors.additions} onChange={setDish} />
          <DishFeaturesSelector dish={dish} onChange={setDish} />
          <PreparationTimeFields dish={dish} errors={errors} onChange={setDish} />
          <IngredientManager dish={dish} onChange={setDish} />
          <AllergenSelector dish={dish} onChange={setDish} />
          {isEditing ? <DishPerformancePanel dish={dish} /> : null}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <DishPreview dish={dish} />
        </aside>
      </div>
    </div>
  );
}

function FormSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-card p-4 shadow-2xl shadow-black/20">
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TextField({
  error,
  label,
  maxLength,
  onChange,
  value
}: {
  error?: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-white/64">
      {label}
      <input
        className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

function NumberField({
  error,
  label,
  onChange,
  value
}: {
  error?: string;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-white/64">
      {label}
      <input
        className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm text-white outline-none focus:border-accent"
        min={0}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`h-11 rounded-2xl border px-3 text-sm font-black ${
        active ? 'border-accent bg-accent text-white' : 'border-white/10 bg-base text-white/70'
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function DishMediaUploader({
  dish,
  onChange,
  onFiles,
  progress
}: {
  dish: AdminDish;
  onChange: (dish: AdminDish) => void;
  onFiles: (files: File[]) => void;
  progress: number;
}) {
  const [error, setError] = useState('');
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm'];
  const maxBytes = 18 * 1024 * 1024;

  const pickFiles = (files: FileList | null, target: 'main' | 'gallery' | 'video') => {
    if (!files?.length) return;
    const accepted = Array.from(files).filter((file) => {
      const validType = target === 'video' ? videoTypes.includes(file.type) : imageTypes.includes(file.type);
      const validSize = file.size <= maxBytes;
      if (!validType) setError('Formato no permitido.');
      if (!validSize) setError('El archivo supera el tamano permitido.');
      return validType && validSize;
    });
    if (!accepted.length) return;
    setError('');
    onFiles(accepted);

    if (target === 'main') {
      onChange({ ...dish, mainImageUrl: URL.createObjectURL(accepted[0]), videoThumbnailUrl: dish.videoThumbnailUrl || URL.createObjectURL(accepted[0]) });
    }
    if (target === 'video') {
      onChange({ ...dish, videoUrl: URL.createObjectURL(accepted[0]) });
    }
    if (target === 'gallery') {
      const galleryItems: DishMediaItem[] = accepted.map((file) => ({
        id: createId('gallery'),
        name: file.name,
        type: 'image',
        url: URL.createObjectURL(file)
      }));
      onChange({ ...dish, gallery: [...dish.gallery, ...galleryItems] });
    }
  };

  const moveGallery = (index: number, direction: -1 | 1) => {
    const next = [...dish.gallery];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onChange({ ...dish, gallery: next });
  };

  return (
    <FormSection title="Foto y video">
      <div className="grid gap-3 md:grid-cols-3">
        <MediaInput icon={<ImagePlus className="size-5" />} label="Foto principal" onChange={(files) => pickFiles(files, 'main')} />
        <MediaInput icon={<ImagePlus className="size-5" />} label="Galeria" multiple onChange={(files) => pickFiles(files, 'gallery')} />
        <MediaInput icon={<Video className="size-5" />} label="Video principal" onChange={(files) => pickFiles(files, 'video')} />
      </div>
      {error ? <p className="mt-3 text-sm font-bold text-red-300">{error}</p> : null}
      {progress > 0 ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
          <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MediaPreview label="Portada" url={dish.mainImageUrl} />
        <MediaPreview label="Video" url={dish.videoUrl} video />
      </div>
      {dish.gallery.length ? (
        <div className="mt-4 grid gap-2">
          {dish.gallery.map((item, index) => (
            <div className="flex items-center gap-3 rounded-2xl bg-base p-2" key={item.id}>
              <img alt="" className="size-12 rounded-xl object-cover" src={item.url} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{item.name}</span>
              <button aria-label="Subir imagen" className="grid size-9 place-items-center rounded-xl bg-white/8" onClick={() => moveGallery(index, -1)} type="button">
                <ArrowUp className="size-4" />
              </button>
              <button aria-label="Bajar imagen" className="grid size-9 place-items-center rounded-xl bg-white/8" onClick={() => moveGallery(index, 1)} type="button">
                <ArrowDown className="size-4" />
              </button>
              <button
                aria-label="Seleccionar portada"
                className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent"
                onClick={() => onChange({ ...dish, mainImageUrl: item.url })}
                type="button"
              >
                <Star className="size-4" />
              </button>
              <button
                aria-label="Eliminar imagen"
                className="grid size-9 place-items-center rounded-xl bg-red-500/10 text-red-200"
                onClick={() => onChange({ ...dish, gallery: dish.gallery.filter((galleryItem) => galleryItem.id !== item.id) })}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </FormSection>
  );
}

function MediaInput({
  icon,
  label,
  multiple,
  onChange
}: {
  icon: React.ReactNode;
  label: string;
  multiple?: boolean;
  onChange: (files: FileList | null) => void;
}) {
  return (
    <label className="grid cursor-pointer gap-2 rounded-2xl border border-dashed border-white/14 bg-base p-4 text-center text-sm font-black text-white/70 transition hover:border-accent/60">
      <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-accent/12 text-accent">{icon}</span>
      {label}
      <input className="sr-only" multiple={multiple} onChange={(event) => onChange(event.target.files)} type="file" />
    </label>
  );
}

function MediaPreview({ label, url, video }: { label: string; url: string; video?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-base">
      <div className="aspect-video bg-black/30">
        {url ? (
          video ? (
            <video className="size-full object-cover" controls src={url} />
          ) : (
            <img alt="" className="size-full object-cover" src={url} />
          )
        ) : (
          <div className="grid size-full place-items-center text-sm font-bold text-white/38">Sin archivo</div>
        )}
      </div>
      <p className="p-3 text-xs font-black text-white/62">{label}</p>
    </div>
  );
}

export function DishCategorySelector({ dish, onChange }: { dish: AdminDish; onChange: (dish: AdminDish) => void }) {
  return (
    <FormSection title="Categoria">
      <select
        className="h-12 w-full rounded-2xl border border-white/10 bg-base px-3 text-sm font-bold text-white outline-none focus:border-accent"
        onChange={(event) => onChange({ ...dish, categoryId: event.target.value })}
        value={dish.categoryId}
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </FormSection>
  );
}

export function ServingSizeSelector({ dish, onChange }: { dish: AdminDish; onChange: (dish: AdminDish) => void }) {
  const toggle = (value: number) => {
    onChange({
      ...dish,
      servingSizes: dish.servingSizes.includes(value)
        ? dish.servingSizes.filter((item) => item !== value)
        : [...dish.servingSizes, value]
    });
  };

  return (
    <FormSection title="Para cuantas personas es este plato">
      <div className="flex flex-wrap gap-2">
        {servingOptions.map((option) => (
          <button
            className={`h-11 rounded-2xl border px-3 text-sm font-black ${
              dish.servingSizes.includes(option.value) ? 'border-accent bg-accent text-white' : 'border-white/10 bg-base text-white/70'
            }`}
            key={option.value}
            onClick={() => toggle(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <TextField label="Texto opcional" onChange={(value) => onChange({ ...dish, servingDescription: value })} value={dish.servingDescription} />
    </FormSection>
  );
}

export function SpicyLevelSelector({ dish, onChange }: { dish: AdminDish; onChange: (dish: AdminDish) => void }) {
  return (
    <FormSection title="Nivel de picante">
      <ToggleButton active={dish.spicyLevel > 0} label="Es picante" onClick={() => onChange({ ...dish, spicyLevel: dish.spicyLevel > 0 ? 0 : 1 })} />
      {dish.spicyLevel > 0 ? (
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((level) => (
            <button
              className={`grid size-11 place-items-center rounded-2xl border ${
                dish.spicyLevel >= level ? 'border-accent bg-accent text-white' : 'border-white/10 bg-base text-white/42'
              }`}
              key={level}
              onClick={() => onChange({ ...dish, spicyLevel: level as 1 | 2 | 3 })}
              type="button"
            >
              <Star className="size-5" fill="currentColor" />
            </button>
          ))}
        </div>
      ) : null}
      <p className="mt-3 text-sm text-white/58">Vista previa cliente: {dish.spicyLevel ? `${dish.spicyLevel} estrella(s) de picante` : 'Sin picante'}</p>
    </FormSection>
  );
}

export function DietaryOptions({ dish, onChange }: { dish: AdminDish; onChange: (dish: AdminDish) => void }) {
  const setVegan = (checked: boolean) => onChange({ ...dish, isVegan: checked, isVegetarian: checked ? true : dish.isVegetarian });
  return (
    <FormSection title="Caracteristicas alimentarias">
      <div className="grid gap-2 sm:grid-cols-3">
        <Checkbox checked={dish.isVegan} label="Vegano" onChange={setVegan} />
        <Checkbox checked={dish.isVegetarian} label="Vegetariano" onChange={(checked) => onChange({ ...dish, isVegetarian: checked })} />
        <Checkbox checked={dish.isGlutenFree} label="Libre de gluten" onChange={(checked) => onChange({ ...dish, isGlutenFree: checked })} />
      </div>
      <p className="mt-3 rounded-2xl bg-amber-500/10 p-3 text-sm leading-6 text-amber-100">
        Esta informacion debe ser validada por el restaurante. Libre de gluten no elimina automaticamente riesgos de contaminacion cruzada.
      </p>
    </FormSection>
  );
}

function Checkbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-base px-3 text-sm font-bold text-white/72">
      <input checked={checked} className="size-4 accent-accent" onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      {label}
    </label>
  );
}

export function SauceManager({
  dish,
  errors,
  onChange
}: {
  dish: AdminDish;
  errors: Record<string, string>;
  onChange: (dish: AdminDish) => void;
}) {
  const updateSauce = (sauceId: string, patch: Partial<Sauce>) => {
    onChange({ ...dish, sauces: dish.sauces.map((sauce) => (sauce.id === sauceId ? { ...sauce, ...patch } : sauce)) });
  };

  return (
    <FormSection title="Salsas seleccionables">
      <div className="grid gap-3 sm:grid-cols-4">
        <Checkbox checked={dish.sauceSelectionRequired} label="Seleccion obligatoria" onChange={(checked) => onChange({ ...dish, sauceSelectionRequired: checked })} />
        <NumberField error={errors.minimumSauces} label="Minimo" onChange={(value) => onChange({ ...dish, minimumSauces: value })} value={dish.minimumSauces} />
        <NumberField error={errors.maximumSauces} label="Maximo" onChange={(value) => onChange({ ...dish, maximumSauces: value })} value={dish.maximumSauces} />
        <ToggleButton active={dish.maximumSauces === 1} label="Una sola salsa" onClick={() => onChange({ ...dish, maximumSauces: 1 })} />
      </div>
      <div className="mt-4 grid gap-3">
        {dish.sauces.map((sauce) => (
          <div className="grid gap-2 rounded-2xl bg-base p-3 lg:grid-cols-[1fr_1fr_120px_auto]" key={sauce.id}>
            <input className="h-11 rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-accent" onChange={(event) => updateSauce(sauce.id, { name: event.target.value })} placeholder="Nombre" value={sauce.name} />
            <input className="h-11 rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-accent" onChange={(event) => updateSauce(sauce.id, { description: event.target.value })} placeholder="Descripcion" value={sauce.description} />
            <input className="h-11 rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-accent" min={0} onChange={(event) => updateSauce(sauce.id, { price: Number(event.target.value) })} type="number" value={sauce.price} />
            <div className="flex gap-2">
              <Checkbox checked={sauce.available} label="Disp." onChange={(checked) => updateSauce(sauce.id, { available: checked })} />
              <Checkbox checked={sauce.defaultSelected} label="Def." onChange={(checked) => updateSauce(sauce.id, { defaultSelected: checked })} />
              <button className="grid size-11 place-items-center rounded-xl bg-red-500/10 text-red-200" onClick={() => onChange({ ...dish, sauces: dish.sauces.filter((item) => item.id !== sauce.id) })} type="button">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-base px-4 text-sm font-black"
        onClick={() =>
          onChange({
            ...dish,
            sauces: [
              ...dish.sauces,
              { id: createId('sauce'), name: '', description: '', price: 0, available: true, defaultSelected: false, imageUrl: '' }
            ]
          })
        }
        type="button"
      >
        <Plus className="size-4" />
        Agregar salsa
      </button>
    </FormSection>
  );
}

export function AdditionManager({
  dish,
  error,
  onChange
}: {
  dish: AdminDish;
  error?: string;
  onChange: (dish: AdminDish) => void;
}) {
  const updateAddition = (additionId: string, patch: Partial<DishAddition>) => {
    onChange({
      ...dish,
      additions: dish.additions.map((addition) => (addition.id === additionId ? { ...addition, ...patch } : addition))
    });
  };

  return (
    <FormSection title="Adiciones seleccionables">
      <div className="grid gap-3">
        {dish.additions.map((addition) => (
          <div className="grid gap-2 rounded-2xl bg-base p-3 lg:grid-cols-[1fr_1fr_120px_auto]" key={addition.id}>
            <input className="h-11 rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-accent" onChange={(event) => updateAddition(addition.id, { name: event.target.value })} placeholder="Nombre" value={addition.name} />
            <input className="h-11 rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-accent" onChange={(event) => updateAddition(addition.id, { description: event.target.value })} placeholder="Descripcion" value={addition.description} />
            <input className="h-11 rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-accent" min={0} onChange={(event) => updateAddition(addition.id, { price: Number(event.target.value) })} type="number" value={addition.price} />
            <div className="flex gap-2">
              <Checkbox checked={addition.available} label="Disp." onChange={(checked) => updateAddition(addition.id, { available: checked })} />
              <Checkbox checked={addition.defaultSelected} label="Def." onChange={(checked) => updateAddition(addition.id, { defaultSelected: checked })} />
              <button className="grid size-11 place-items-center rounded-xl bg-red-500/10 text-red-200" onClick={() => onChange({ ...dish, additions: dish.additions.filter((item) => item.id !== addition.id) })} type="button">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs font-bold text-red-300">{error}</p> : null}
      <button
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-base px-4 text-sm font-black"
        onClick={() =>
          onChange({
            ...dish,
            additions: [
              ...dish.additions,
              { id: createId('addition'), name: '', description: '', price: 0, available: true, defaultSelected: false }
            ]
          })
        }
        type="button"
      >
        <Plus className="size-4" />
        Agregar adicion
      </button>
    </FormSection>
  );
}

export function DishFeaturesSelector({ dish, onChange }: { dish: AdminDish; onChange: (dish: AdminDish) => void }) {
  return (
    <FormSection title="Caracteristicas del plato">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {featureOptions.map((feature) => (
          <Checkbox
            checked={dish.features.includes(feature)}
            key={feature}
            label={feature}
            onChange={(checked) =>
              onChange({ ...dish, features: checked ? [...dish.features, feature] : dish.features.filter((item) => item !== feature) })
            }
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {dish.features.slice(0, 3).map((feature) => (
          <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-black text-accent" key={feature}>
            {feature}
          </span>
        ))}
      </div>
    </FormSection>
  );
}

export function PreparationTimeFields({
  dish,
  errors,
  onChange
}: {
  dish: AdminDish;
  errors: Record<string, string>;
  onChange: (dish: AdminDish) => void;
}) {
  const parse = (value: string) => (value === '' ? '' : Number(value));
  return (
    <FormSection title="Tiempo de preparacion">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-white/64">
          Tiempo minimo
          <input className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm outline-none focus:border-accent" min={0} onChange={(event) => onChange({ ...dish, preparationTimeMin: parse(event.target.value) })} type="number" value={dish.preparationTimeMin} />
          {errors.preparationTimeMin ? <span className="text-xs text-red-300">{errors.preparationTimeMin}</span> : null}
        </label>
        <label className="grid gap-1 text-sm font-bold text-white/64">
          Tiempo maximo
          <input className="h-12 rounded-2xl border border-white/10 bg-base px-3 text-sm outline-none focus:border-accent" min={0} onChange={(event) => onChange({ ...dish, preparationTimeMax: parse(event.target.value) })} type="number" value={dish.preparationTimeMax} />
          {errors.preparationTimeMax ? <span className="text-xs text-red-300">{errors.preparationTimeMax}</span> : null}
        </label>
      </div>
    </FormSection>
  );
}

export function IngredientManager({ dish, onChange }: { dish: AdminDish; onChange: (dish: AdminDish) => void }) {
  return (
    <FormSection title="Ingredientes y observaciones">
      <TagEditor label="Ingredientes" onChange={(items) => onChange({ ...dish, ingredients: items })} value={dish.ingredients} />
      <div className="mt-4">
        <TagEditor
          label="Ingredientes que el cliente puede quitar"
          onChange={(items) => onChange({ ...dish, removableIngredients: items })}
          value={dish.removableIngredients}
        />
      </div>
      <label className="mt-3 grid gap-1 text-sm font-bold text-white/64">
        Observaciones alimentarias
        <textarea className="min-h-20 rounded-2xl border border-white/10 bg-base px-3 py-3 text-sm outline-none focus:border-accent" onChange={(event) => onChange({ ...dish, dietaryNotes: event.target.value })} value={dish.dietaryNotes} />
      </label>
    </FormSection>
  );
}

export function AllergenSelector({ dish, onChange }: { dish: AdminDish; onChange: (dish: AdminDish) => void }) {
  return (
    <FormSection title="Alergenos">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {allergenOptions.map((allergen) => (
          <Checkbox
            checked={dish.allergens.includes(allergen)}
            key={allergen}
            label={allergen}
            onChange={(checked) =>
              onChange({ ...dish, allergens: checked ? [...dish.allergens, allergen] : dish.allergens.filter((item) => item !== allergen) })
            }
          />
        ))}
      </div>
      <TextField label="Advertencia sobre contaminacion cruzada" onChange={(value) => onChange({ ...dish, crossContaminationWarning: value })} value={dish.crossContaminationWarning} />
    </FormSection>
  );
}

function TagEditor({ label, onChange, value }: { label: string; onChange: (items: string[]) => void; value: string[] }) {
  const [draft, setDraft] = useState('');
  return (
    <div className="grid gap-2">
      <label className="grid gap-1 text-sm font-bold text-white/64">
        {label}
        <div className="flex gap-2">
          <input className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-base px-3 text-sm outline-none focus:border-accent" onChange={(event) => setDraft(event.target.value)} value={draft} />
          <button
            className="grid size-12 place-items-center rounded-2xl bg-accent text-white"
            onClick={() => {
              if (!draft.trim()) return;
              onChange([...value, draft.trim()]);
              setDraft('');
            }}
            type="button"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </label>
      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <button className="rounded-full bg-base px-3 py-1 text-xs font-bold text-white/70" key={item} onClick={() => onChange(value.filter((current) => current !== item))} type="button">
            {item} x
          </button>
        ))}
      </div>
    </div>
  );
}

export function DishPreview({ dish }: { dish: AdminDish }) {
  const prep =
    dish.preparationTimeMin !== '' && dish.preparationTimeMax !== ''
      ? `Preparacion aproximada: ${dish.preparationTimeMin}-${dish.preparationTimeMax} min`
      : '';
  const dietary = [
    dish.isVegan ? 'Vegano' : '',
    dish.isVegetarian ? 'Vegetariano' : '',
    dish.isGlutenFree ? 'Libre de gluten' : ''
  ].filter(Boolean);

  return (
    <section className="rounded-[28px] border border-white/10 bg-card p-4 shadow-2xl shadow-black/25">
      <h3 className="text-lg font-black">Vista previa del plato</h3>
      <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-base">
        <div className="relative aspect-[9/13] bg-black">
          {dish.videoUrl ? (
            <video className="size-full object-cover" muted src={dish.videoUrl} />
          ) : dish.mainImageUrl ? (
            <img alt="" className="size-full object-cover" src={dish.mainImageUrl} />
          ) : (
            <div className="grid size-full place-items-center text-white/38">Reel</div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4">
            <p className="text-xl font-black">{dish.title || 'Nombre del plato'}</p>
            <p className="mt-1 font-black text-accent">{formatCurrency(dish.price)}</p>
            <p className="mt-2 line-clamp-2 text-sm text-white/72">{dish.shortDescription || 'Descripcion corta del plato'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[dish.categoryId, ...dish.features.slice(0, 3), ...dietary].filter(Boolean).slice(0, 5).map((tag) => (
                <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <PreviewBlock title="Mosaico" value={`${dish.title || 'Plato'} · ${formatCurrency(dish.price)}`} />
        <PreviewBlock title="Descripcion" value={[dish.description || dish.shortDescription, prep, dish.servingDescription].filter(Boolean).join(' ')} />
        <PreviewBlock title="Picante" value={dish.spicyLevel ? `${dish.spicyLevel}/3` : 'No picante'} />
      </div>
    </section>
  );
}

function PreviewBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-base p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{title}</p>
      <p className="mt-1 text-sm leading-5 text-white/72">{value || 'Sin informacion'}</p>
    </div>
  );
}

export function DishPerformancePanel({ dish }: { dish: AdminDish }) {
  return (
    <FormSection title="Rendimiento del plato">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <ReadOnlyMetric icon={<Eye className="size-4" />} label="Visualizaciones" value={dish.viewsCount} />
        <ReadOnlyMetric icon={<Star className="size-4" />} label="Me gusta" value={dish.likesCount} />
        <ReadOnlyMetric icon={<MessageCircle className="size-4" />} label="Comentarios" value={dish.commentsCount} />
        <ReadOnlyMetric icon={<Send className="size-4" />} label="Compartidos" value={dish.sharesCount} />
        <ReadOnlyMetric icon={<PackagePlus className="size-4" />} label="Agregado al Pedido" value={dish.addedToOrderCount} />
        <ReadOnlyMetric icon={<PackagePlus className="size-4" />} label="Cantidad de pedidos" value={dish.ordersCount} />
        <ReadOnlyMetric icon={<ImagePlus className="size-4" />} label="Publicaciones relacionadas" value={dish.customerPostsCount} />
        <ReadOnlyMetric icon={<Star className="size-4" />} label="Tasa interaccion" value={`${getInteractionRate(dish)}%`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton label="Ver comentarios" to="/admin/comments" />
        <LinkButton label="Ver publicaciones relacionadas" to="/admin/publications" />
        <LinkButton label="Ver como cliente" to="/menu" />
      </div>
      <p className="mt-3 text-sm text-white/54">Metricas de solo lectura. No se pueden editar manualmente desde este formulario.</p>
    </FormSection>
  );
}

function ReadOnlyMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-base p-3">
      <p className="flex items-center gap-1 text-xs text-white/48">{icon}{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function LinkButton({ label, to }: { label: string; to: string }) {
  return (
    <Link className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-base px-3 text-xs font-black" to={to}>
      <LinkIcon className="size-4" />
      {label}
    </Link>
  );
}
