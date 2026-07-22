import type { Dish } from '../../types';

export type SelectedExperienceDish = {
  dishId: string;
  name: string;
  image: string;
  price: number;
  quantity?: number;
  orderId?: string | null;
};

export type ExperienceMediaDraft = {
  file: File;
  previewUrl: string;
};

export function dishToSelection(dish: Dish): SelectedExperienceDish {
  return {
    dishId: dish.id,
    name: dish.name,
    image: dish.image,
    price: dish.price
  };
}
