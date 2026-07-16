import type { Dish } from '../types';

export const dishes: Dish[] = [
  {
    id: 'classic-burger',
    name: 'Hamburguesa Clásica',
    category: 'Hamburguesas',
    shortDescription: 'Carne jugosa, cheddar fundido, vegetales frescos y salsa de la casa.',
    description:
      'Una hamburguesa generosa con carne de res sellada a la plancha, queso cheddar, lechuga crocante, tomate maduro, cebolla morada y nuestra salsa ahumada en pan brioche tostado.',
    price: 29900,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85',
    video: 'https://cdn.coverr.co/videos/coverr-making-a-cheeseburger-8744/1080p.mp4',
    ingredients: ['Carne 150g', 'Queso cheddar', 'Lechuga', 'Tomate', 'Cebolla morada', 'Pan brioche'],
    available: true,
    tag: 'Más pedido',
    likesCount: 248,
    viewsCount: 1200,
    commentsCount: 37
  },
  {
    id: 'special-burger',
    name: 'Hamburguesa Especial',
    category: 'Hamburguesas',
    shortDescription: 'Doble carne, tocineta crujiente, queso americano y cebolla caramelizada.',
    description:
      'Nuestra opción más intensa: doble carne, tocineta dorada, queso americano, cebolla caramelizada lentamente, pepinillos y mayonesa de ajo rostizado.',
    price: 36900,
    image:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=85',
    ingredients: ['Doble carne', 'Tocineta', 'Queso americano', 'Pepinillos', 'Cebolla caramelizada'],
    available: true,
    tag: 'Recomendado',
    likesCount: 185,
    viewsCount: 980,
    commentsCount: 24
  },
  {
    id: 'alfredo-pasta',
    name: 'Pasta Alfredo',
    category: 'Pastas',
    shortDescription: 'Fettuccine cremoso con parmesano, pollo grillado y pimienta recién molida.',
    description:
      'Fettuccine al dente cubierto con salsa Alfredo sedosa, parmesano, mantequilla, crema, pollo grillado y un toque de pimienta negra para equilibrar la intensidad.',
    price: 26900,
    image:
      'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=1200&q=85',
    video: 'https://cdn.coverr.co/videos/coverr-twirling-pasta-3933/1080p.mp4',
    ingredients: ['Fettuccine', 'Pollo grillado', 'Parmesano', 'Crema', 'Mantequilla', 'Pimienta negra'],
    available: true,
    tag: 'Nuevo',
    likesCount: 196,
    viewsCount: 890,
    commentsCount: 21
  },
  {
    id: 'bbq-ribs',
    name: 'Costillas BBQ',
    category: 'Parrilla',
    shortDescription: 'Costillas cocidas lentamente con salsa BBQ brillante y papas rústicas.',
    description:
      'Costillas de cerdo marinadas por horas, cocidas a baja temperatura y terminadas con salsa BBQ de la casa. Se sirven con papas rústicas y ensalada fresca.',
    price: 34900,
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
    ingredients: ['Costillas de cerdo', 'Salsa BBQ', 'Papas rústicas', 'Ensalada fresca'],
    available: true,
    tag: 'Promoción',
    likesCount: 201,
    viewsCount: 1100,
    commentsCount: 29
  },
  {
    id: 'smoked-bbq-platter',
    name: 'Tabla BBQ Ahumada',
    category: 'Parrilla',
    shortDescription: 'Carnes ahumadas con salsa BBQ, papas doradas y encurtidos frescos.',
    description:
      'Una tabla intensa para compartir: cortes de cerdo y res ahumados lentamente, glaseado BBQ de la casa, papas doradas, pepinillos y cebolla encurtida para equilibrar el sabor.',
    price: 42900,
    image:
      'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=85',
    video: '/media/bbqlads_pindown.io_1784234850.mp4',
    ingredients: ['Cerdo ahumado', 'Res BBQ', 'Salsa de la casa', 'Papas doradas', 'Pepinillos', 'Cebolla encurtida'],
    available: true,
    tag: 'Recomendado',
    likesCount: 231,
    viewsCount: 1320,
    commentsCount: 33
  },
  {
    id: 'papas-bravas',
    name: 'Papas Bravas',
    category: 'Entradas',
    shortDescription: 'Papas doradas con alioli suave, salsa brava y cebollín fresco.',
    description:
      'Papas crocantes por fuera y suaves por dentro, bañadas con salsa brava ligeramente picante, alioli cremoso y cebollín. Perfectas para compartir.',
    price: 9900,
    image:
      'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=1200&q=85',
    ingredients: ['Papa criolla', 'Salsa brava', 'Alioli', 'Cebollín', 'Paprika ahumada'],
    available: true,
    tag: 'Recomendado',
    likesCount: 152,
    viewsCount: 740,
    commentsCount: 18
  },
  {
    id: 'street-food-bites',
    name: 'Bocados Callejeros',
    category: 'Street food',
    shortDescription: 'Bocados calientes con salsa cremosa, hierbas frescas y toque picante.',
    description:
      'Una mezcla inspirada en comida callejera: bocados crocantes recién servidos, salsa cremosa especiada, hierbas frescas y un final ligeramente picante que invita a seguir probando.',
    price: 21900,
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
    video: '/media/streetfoodbites_pindown.io_1784235212.mp4',
    ingredients: ['Bocados crocantes', 'Salsa cremosa', 'Hierbas frescas', 'Ají suave', 'Limón', 'Cebolla crispy'],
    available: true,
    tag: 'Nuevo',
    likesCount: 174,
    viewsCount: 860,
    commentsCount: 16
  },
  {
    id: 'berry-cheesecake',
    name: 'Cheesecake de frutos rojos',
    category: 'Postres',
    shortDescription: 'Cheesecake cremoso con coulis de frutos rojos y base crocante.',
    description:
      'Postre frío de textura aterciopelada, base de galleta dorada y coulis artesanal de mora, fresa y frambuesa. Dulce, fresco y equilibrado.',
    price: 14900,
    image:
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1200&q=85',
    ingredients: ['Queso crema', 'Galleta', 'Mora', 'Fresa', 'Frambuesa', 'Vainilla'],
    available: true,
    tag: 'Nuevo',
    likesCount: 156,
    viewsCount: 780,
    commentsCount: 19
  },
  {
    id: 'crispy-chicken-bites',
    name: 'Bites de Pollo Crujiente',
    category: 'Entradas',
    shortDescription: 'Pollo crocante con salsa cremosa, limón fresco y especias de la casa.',
    description:
      'Bocados de pollo marinados, rebozados y dorados al momento. Llegan con salsa cremosa especiada, limón fresco y un toque de hierbas para compartir al centro de la mesa.',
    price: 23900,
    image:
      'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=85',
    video: '/media/rahanumanaim4_pindown.io_1784235460.mp4',
    ingredients: ['Pollo marinado', 'Rebozado crocante', 'Salsa cremosa', 'Limón', 'Hierbas frescas'],
    available: true,
    tag: 'Nuevo',
    likesCount: 143,
    viewsCount: 690,
    commentsCount: 14
  },
  {
    id: 'loaded-fries',
    name: 'Papas Loaded',
    category: 'Entradas',
    shortDescription: 'Papas doradas con queso fundido, salsa de la casa y topping crocante.',
    description:
      'Papas doradas y calientes cubiertas con queso fundido, salsa cremosa de la casa, cebollín y topping crocante. Una entrada abundante para picar sin ceremonia.',
    price: 18900,
    image:
      'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1200&q=85',
    video: '/media/Jakefooddrinks_pindown.io_1784235658.mp4',
    ingredients: ['Papas doradas', 'Queso fundido', 'Salsa de la casa', 'Cebollín', 'Topping crocante'],
    available: true,
    tag: 'Promoción',
    likesCount: 167,
    viewsCount: 820,
    commentsCount: 20
  },
  {
    id: 'creamy-house-special',
    name: 'Especial Cremoso de la Casa',
    category: 'Especiales',
    shortDescription: 'Preparación cremosa, dorada y llena de sabor para antojos fuertes.',
    description:
      'Un especial caliente de textura cremosa, bordes dorados y sabor profundo. Combina una base suave con topping crocante y especias de la casa para un plato reconfortante.',
    price: 28900,
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=85',
    video: '/media/Rezeptfood147_pindown.io_1784235768.mp4',
    ingredients: ['Base cremosa', 'Queso gratinado', 'Especias de la casa', 'Topping crocante', 'Hierbas frescas'],
    available: true,
    tag: 'Recomendado',
    likesCount: 192,
    viewsCount: 930,
    commentsCount: 22
  }
];
