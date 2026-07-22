import type { RestaurantConfig } from '../types';

export const restaurantConfig: RestaurantConfig = {
  restaurantId: 'la-esquina-burger',
  brandName: 'FoodReel',
  restaurantName: 'La Esquina Burger',
  logoSrc: '/brand/foodreel-logo.png',
  logoText: 'F',
  tableId: 'mesa-7',
  tableNumber: 7,
  tableAccessToken: import.meta.env.VITE_TABLE_ACCESS_TOKEN ?? '',
  colors: {
    primary: '#FF6500',
    background: '#0B0B0C',
    surface: '#151516'
  },
  info: {
    address: 'Calle 74 #12-18',
    serviceLabel: 'Carta digital social'
  }
};
