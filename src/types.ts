export type DishTag = 'Más pedido' | 'Nuevo' | 'Recomendado' | 'Promoción';

export type Dish = {
  id: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  image: string;
  video?: string;
  ingredients: string[];
  available: boolean;
  tag?: DishTag;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
};

export type RestaurantConfig = {
  brandName: string;
  restaurantName: string;
  logoSrc?: string;
  logoText: string;
  tableNumber: number;
  colors: {
    primary: string;
    background: string;
    surface: string;
  };
  info: {
    address: string;
    serviceLabel: string;
  };
};
