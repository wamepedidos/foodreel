import { Check, Plus, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { Dish, DishCustomizationChoice } from '../types';
import { useCartStore, type CartCustomization } from '../store/useCartStore';
import { QuantitySelector } from './QuantitySelector';
import { useToast } from './Toast';
import { incrementDishAddedToOrder } from '../services/dishesService';
import { formatCurrency } from '../utils/format';

export function AddToCartButton({ dish, variant = 'compact' }: { dish: Dish; variant?: 'compact' | 'reel' }) {
  const quantity = useCartStore((state) => state.getQuantity(dish.id));
  const addDish = useCartStore((state) => state.addDish);
  const { showToast } = useToast();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const hasCustomizations = Boolean(
    dish.sauces?.length || dish.additions?.length || dish.removableIngredients?.length || dish.ingredients.length
  );

  const add = (customization?: CartCustomization) => {
    addDish(dish, customization);
    void incrementDishAddedToOrder(dish.id);
    showToast('Agregado al carrito');
  };

  if (quantity > 0 && variant !== 'reel') {
    return (
      <>
        <div className="flex min-w-0 flex-1 items-stretch gap-2">
          <QuantitySelector dishId={dish.id} price={dish.price} quantity={quantity} />
          <button
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-surface text-white transition hover:border-accent/50"
            disabled={!dish.available}
            onClick={() => (hasCustomizations ? setCustomizerOpen(true) : add())}
            type="button"
          >
            <Plus className="size-5" />
          </button>
        </div>
        <DishCustomizationSheet dish={dish} onAdd={add} onClose={() => setCustomizerOpen(false)} open={customizerOpen} />
      </>
    );
  }

  return (
    <>
      <button
        className={
          variant === 'reel'
            ? 'flex h-10 min-w-0 w-full items-center justify-center gap-1.5 rounded-[16px] bg-accent px-3 text-[0.78rem] font-bold text-white shadow-[0_14px_36px_rgba(252,45,4,0.30)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
            : 'flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
        }
        disabled={!dish.available}
        onClick={() => (hasCustomizations ? setCustomizerOpen(true) : add())}
        type="button"
      >
        {variant === 'reel' ? (
          <>
            <span className="truncate">{quantity > 0 ? 'Personalizar' : 'Agregar'}</span>
            <span className="text-white/80">{'\u2022'}</span>
            <span className="truncate">{formatCurrency(dish.price)}</span>
          </>
        ) : (
          <>
            <span className="truncate">{quantity > 0 ? 'Personalizar' : 'Agregar'}</span>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15">
              <Plus className="size-5" />
            </span>
          </>
        )}
      </button>
      <DishCustomizationSheet dish={dish} onAdd={add} onClose={() => setCustomizerOpen(false)} open={customizerOpen} />
    </>
  );
}

function DishCustomizationSheet({
  dish,
  onAdd,
  onClose,
  open
}: {
  dish: Dish;
  onAdd: (customization: CartCustomization) => void;
  onClose: () => void;
  open: boolean;
}) {
  const sauceOptions = useMemo(() => normalizeChoices(dish.sauces), [dish.sauces]);
  const additionOptions = useMemo(() => normalizeChoices(dish.additions), [dish.additions]);
  const removableIngredients = dish.removableIngredients?.length ? dish.removableIngredients : dish.ingredients;
  const [selectedSauceIds, setSelectedSauceIds] = useState(() =>
    sauceOptions.filter((sauce) => sauce.defaultSelected).map((sauce) => sauce.id)
  );
  const [selectedAdditionIds, setSelectedAdditionIds] = useState(() =>
    additionOptions.filter((addition) => addition.defaultSelected).map((addition) => addition.id)
  );
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const selectedAdditions = additionOptions.filter((addition) => selectedAdditionIds.includes(addition.id));
  const selectedSauces = sauceOptions.filter((sauce) => selectedSauceIds.includes(sauce.id));
  const additionsTotal = selectedAdditions.reduce((total, addition) => total + addition.price, 0);
  const unitTotal = dish.price + additionsTotal;
  const minSauces = dish.minimumSauces ?? 0;
  const maxSauces = dish.maximumSauces ?? sauceOptions.length;
  const sauceError =
    sauceOptions.length && selectedSauces.length < minSauces
      ? `Elige minimo ${minSauces} salsa${minSauces === 1 ? '' : 's'}`
      : '';

  if (!open) {
    return null;
  }

  const toggleSauce = (sauce: DishCustomizationChoice) => {
    setSelectedSauceIds((current) => {
      if (current.includes(sauce.id)) {
        return current.filter((id) => id !== sauce.id);
      }

      if (maxSauces <= 1) {
        return [sauce.id];
      }

      if (current.length >= maxSauces) {
        return current;
      }

      return [...current, sauce.id];
    });
  };

  const submit = () => {
    if (sauceError) {
      return;
    }

    onAdd({
      notes,
      removedIngredients,
      selectedAdditions,
      selectedSauces
    });
    onClose();
  };

  return (
    <div aria-label={`Personalizar ${dish.name}`} aria-modal="true" className="fixed inset-0 z-[90] flex justify-center bg-black/72 backdrop-blur-sm md:items-center" role="dialog">
      <div className="flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-base text-white shadow-2xl md:h-[calc(100dvh-48px)] md:rounded-[28px] md:border md:border-white/10">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pb-4 pt-[calc(18px+env(safe-area-inset-top))]">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Personalizar</p>
            <h2 className="line-clamp-2 text-xl font-black leading-7">{dish.name}</h2>
            <p className="mt-1 text-sm font-bold text-muted">{formatCurrency(unitTotal)}</p>
          </div>
          <button className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-surface" onClick={onClose} type="button">
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {sauceOptions.length ? (
            <CustomizationSection
              caption={`${minSauces ? `Minimo ${minSauces}. ` : ''}${maxSauces ? `Maximo ${maxSauces}.` : ''}`}
              title="Salsas"
            >
              <div className="grid gap-2">
                {sauceOptions.map((sauce) => {
                  const active = selectedSauceIds.includes(sauce.id);
                  return (
                    <button
                      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                        active ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-surface'
                      }`}
                      key={sauce.id}
                      onClick={() => toggleSauce(sauce)}
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-bold leading-5">{sauce.name}</span>
                        {sauce.description ? <span className="block text-xs font-medium leading-5 text-muted">{sauce.description}</span> : null}
                      </span>
                      {active ? <Check className="size-5 shrink-0 text-accent" /> : null}
                    </button>
                  );
                })}
              </div>
              {sauceError ? <p className="mt-2 text-xs font-bold text-red-300">{sauceError}</p> : null}
            </CustomizationSection>
          ) : null}

          {removableIngredients.length ? (
            <CustomizationSection caption="Marca lo que no quieres en tu plato." title="Quitar ingredientes">
              <div className="flex flex-wrap gap-2">
                {removableIngredients.map((ingredient) => {
                  const active = removedIngredients.includes(ingredient);
                  return (
                    <button
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active ? 'border-accent/60 bg-accent/10 text-accent' : 'border-white/10 bg-surface text-white/72'
                      }`}
                      key={ingredient}
                      onClick={() =>
                        setRemovedIngredients((current) =>
                          active ? current.filter((item) => item !== ingredient) : [...current, ingredient]
                        )
                      }
                      type="button"
                    >
                      Sin {ingredient}
                    </button>
                  );
                })}
              </div>
            </CustomizationSection>
          ) : null}

          {additionOptions.length ? (
            <CustomizationSection caption="Selecciona extras para sumar al plato." title="Adiciones">
              <div className="grid gap-2">
                {additionOptions.map((addition) => {
                  const active = selectedAdditionIds.includes(addition.id);
                  return (
                    <button
                      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                        active ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-surface'
                      }`}
                      key={addition.id}
                      onClick={() =>
                        setSelectedAdditionIds((current) =>
                          active ? current.filter((id) => id !== addition.id) : [...current, addition.id]
                        )
                      }
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-bold leading-5">{addition.name}</span>
                        {addition.description ? <span className="block text-xs font-medium leading-5 text-muted">{addition.description}</span> : null}
                      </span>
                      <span className="shrink-0 text-sm font-black text-accent">+{formatCurrency(addition.price)}</span>
                    </button>
                  );
                })}
              </div>
            </CustomizationSection>
          ) : null}

          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted">Nota para cocina</span>
            <textarea
              className="mt-2 min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-surface px-3 py-3 text-sm font-medium leading-6 outline-none focus:border-accent/60"
              maxLength={180}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: poca sal, bien tostado..."
              value={notes}
            />
          </label>
        </div>

        <footer className="border-t border-white/10 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4">
          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-black text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            disabled={Boolean(sauceError)}
            onClick={submit}
            type="button"
          >
            Agregar por {formatCurrency(unitTotal)}
          </button>
        </footer>
      </div>
    </div>
  );
}

function CustomizationSection({ caption, children, title }: { caption?: string; children: ReactNode; title: string }) {
  return (
    <section className="mb-4">
      <div className="mb-2">
        <h3 className="text-sm font-black leading-5">{title}</h3>
        {caption ? <p className="text-xs font-medium leading-5 text-muted">{caption}</p> : null}
      </div>
      {children}
    </section>
  );
}

function normalizeChoices(choices: DishCustomizationChoice[] = []) {
  return choices
    .filter((choice) => choice.available !== false)
    .map((choice) => ({
      ...choice,
      description: choice.description ?? '',
      id: String(choice.id || choice.name),
      name: String(choice.name).trim(),
      price: Number(choice.price) || 0
    }))
    .filter((choice) => choice.name);
}
