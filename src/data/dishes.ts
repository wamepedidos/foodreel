import type { Dish } from '../types';

const videoPoster = '/brand/foodreel-logo.png';

export const dishes: Dish[] = [
  {
    id: 'bbq-smoked-board',
    name: 'Tabla BBQ Ahumada',
    category: 'Parrilla',
    shortDescription: 'Carnes ahumadas, salsa BBQ brillante y acompanantes calientes.',
    description:
      'Una tabla intensa para compartir con carnes ahumadas lentamente, salsa BBQ de la casa, papas doradas y un contraste fresco para equilibrar cada bocado.',
    price: 42900,
    image: videoPoster,
    video: '/media/bbqlads_pindown.io_1784234850.mp4',
    ingredients: ['Carnes ahumadas', 'Salsa BBQ', 'Papas doradas', 'Encurtidos', 'Especias de la casa'],
    available: true,
    tag: 'Recomendado',
    likesCount: 231,
    viewsCount: 1320,
    commentsCount: 33
  },
  {
    id: 'street-food-bites',
    name: 'Bocados Callejeros',
    category: 'Street food',
    shortDescription: 'Bocados calientes con salsa cremosa, hierbas y toque picante.',
    description:
      'Inspirado en antojos de calle: bocados crocantes recien servidos, salsa especiada, hierbas frescas y un final ligeramente picante.',
    price: 21900,
    image: videoPoster,
    video: '/media/streetfoodbites_pindown.io_1784235212.mp4',
    ingredients: ['Bocados crocantes', 'Salsa cremosa', 'Hierbas frescas', 'Aji suave', 'Limon'],
    available: true,
    tag: 'Nuevo',
    likesCount: 174,
    viewsCount: 860,
    commentsCount: 16
  },
  {
    id: 'crispy-chicken-bites',
    name: 'Bites de Pollo Crujiente',
    category: 'Entradas',
    shortDescription: 'Pollo crocante con salsa cremosa, limon y especias.',
    description:
      'Bocados de pollo marinados, rebozados y dorados al momento. Llegan con salsa cremosa especiada, limon fresco y hierbas para compartir.',
    price: 23900,
    image: videoPoster,
    video: '/media/rahanumanaim4_pindown.io_1784235460.mp4',
    ingredients: ['Pollo marinado', 'Rebozado crocante', 'Salsa cremosa', 'Limon', 'Hierbas frescas'],
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
    shortDescription: 'Papas doradas con queso fundido, salsa y topping crocante.',
    description:
      'Papas calientes y doradas cubiertas con queso fundido, salsa cremosa de la casa, cebollin y topping crocante.',
    price: 18900,
    image: videoPoster,
    video: '/media/Jakefooddrinks_pindown.io_1784235658.mp4',
    ingredients: ['Papas doradas', 'Queso fundido', 'Salsa de la casa', 'Cebollin', 'Topping crocante'],
    available: true,
    tag: 'Recomendado',
    likesCount: 167,
    viewsCount: 820,
    commentsCount: 20
  },
  {
    id: 'creamy-house-special',
    name: 'Especial Cremoso',
    category: 'Especiales',
    shortDescription: 'Preparacion cremosa, dorada y llena de sabor.',
    description:
      'Un especial caliente de textura cremosa, bordes dorados y sabor profundo. Combina una base suave con topping crocante y especias de la casa.',
    price: 28900,
    image: videoPoster,
    video: '/media/Rezeptfood147_pindown.io_1784235768.mp4',
    ingredients: ['Base cremosa', 'Queso gratinado', 'Especias', 'Topping crocante', 'Hierbas frescas'],
    available: true,
    tag: 'Recomendado',
    likesCount: 192,
    viewsCount: 930,
    commentsCount: 22
  },
  {
    id: 'applebees-glazed-ribs',
    name: 'Costillas Glaseadas',
    category: 'Parrilla',
    shortDescription: 'Costillas jugosas con glaseado dulce, ahumado y brillante.',
    description:
      'Costillas cocidas lentamente hasta quedar suaves, terminadas con glaseado BBQ dulce y ahumado. Un plato potente para quienes buscan sabor de parrilla.',
    price: 38900,
    image: videoPoster,
    video: '/media/applebees_pindown.io_1784238569.mp4',
    ingredients: ['Costillas', 'Glaseado BBQ', 'Especias ahumadas', 'Papas', 'Ensalada fresca'],
    available: true,
    tag: 'Recomendado',
    likesCount: 214,
    viewsCount: 1180,
    commentsCount: 27
  },
  {
    id: 'aroma-pizza',
    name: 'Pizza Artesanal Aroma',
    category: 'Pizzas',
    shortDescription: 'Masa dorada, queso fundido y toppings de la casa.',
    description:
      'Pizza de masa artesanal con borde dorado, salsa de tomate especiada, queso fundido y toppings preparados para servirse caliente.',
    price: 32900,
    image: videoPoster,
    video: '/media/aromatapizzaria_pindown.io_1784239416.mp4',
    ingredients: ['Masa artesanal', 'Salsa de tomate', 'Queso mozzarella', 'Oregano', 'Toppings de la casa'],
    available: true,
    tag: 'Nuevo',
    likesCount: 188,
    viewsCount: 910,
    commentsCount: 19
  },
  {
    id: 'brittney-recipe-bowl',
    name: 'Bowl Cremoso Casero',
    category: 'Especiales',
    shortDescription: 'Bowl caliente con salsa cremosa y textura reconfortante.',
    description:
      'Un bowl de sabor casero con base caliente, salsa cremosa, toque especiado y acabado fresco. Ideal para una comida rapida y completa.',
    price: 25900,
    image: videoPoster,
    video: '/media/brittneyrecipe_pindown.io_1784239293.mp4',
    ingredients: ['Base caliente', 'Salsa cremosa', 'Proteina de la casa', 'Hierbas', 'Especias'],
    available: true,
    tag: 'Nuevo',
    likesCount: 136,
    viewsCount: 720,
    commentsCount: 13
  },
  {
    id: 'cooking-trends-tacos',
    name: 'Tacos Crocantes',
    category: 'Tacos',
    shortDescription: 'Tacos con relleno jugoso, salsa y contraste crocante.',
    description:
      'Tacos servidos al momento con relleno jugoso, salsa de la casa, vegetales frescos y un punto crocante que los hace adictivos.',
    price: 24900,
    image: videoPoster,
    video: '/media/cookingtrends25_pindown.io_1784238302.mp4',
    ingredients: ['Tortillas', 'Proteina sazonada', 'Salsa de la casa', 'Vegetales frescos', 'Crocante'],
    available: true,
    tag: 'Nuevo',
    likesCount: 151,
    viewsCount: 790,
    commentsCount: 15
  },
  {
    id: 'crackerbarrel-country-chicken',
    name: 'Pollo Country',
    category: 'Pollo',
    shortDescription: 'Pollo estilo casero con acompanantes calientes.',
    description:
      'Plato de pollo estilo country con sazon profundo, textura dorada y acompanantes calientes para una experiencia abundante.',
    price: 30900,
    image: videoPoster,
    video: '/media/crackerbarrel_pindown.io_1784239085.mp4',
    ingredients: ['Pollo sazonado', 'Salsa casera', 'Papas', 'Vegetales', 'Especias'],
    available: true,
    tag: 'Recomendado',
    likesCount: 176,
    viewsCount: 880,
    commentsCount: 18
  },
  {
    id: 'creme-pasta',
    name: 'Pasta Cremosa',
    category: 'Pastas',
    shortDescription: 'Pasta banada en salsa cremosa, queso y hierbas.',
    description:
      'Pasta caliente con salsa cremosa, queso, hierbas frescas y textura sedosa. Un plato suave, generoso y muy aromatico.',
    price: 27900,
    image: videoPoster,
    video: '/media/cremedelafood_pindown.io_1784239076.mp4',
    ingredients: ['Pasta', 'Crema', 'Queso', 'Hierbas frescas', 'Pimienta'],
    available: true,
    tag: 'Recomendado',
    likesCount: 205,
    viewsCount: 1040,
    commentsCount: 24
  },
  {
    id: 'fellipe-dessert',
    name: 'Postre Dorado',
    category: 'Postres',
    shortDescription: 'Postre dulce con acabado dorado y textura suave.',
    description:
      'Una opcion dulce para cerrar la comida: textura suave, acabado dorado y un equilibrio entre cremosidad y toque crocante.',
    price: 15900,
    image: videoPoster,
    video: '/media/fellipe0565_pindown.io_1784239265.mp4',
    ingredients: ['Base dulce', 'Crema', 'Topping dorado', 'Vainilla', 'Salsa de la casa'],
    available: true,
    tag: 'Nuevo',
    likesCount: 128,
    viewsCount: 610,
    commentsCount: 11
  },
  {
    id: 'lola-house-special',
    name: 'Antojo de la Casa',
    category: 'Especiales',
    shortDescription: 'Preparacion abundante con salsa, queso y mucho sabor.',
    description:
      'Un antojo de la casa pensado para verse y saberse intenso: salsa generosa, queso, textura caliente y un final especiado.',
    price: 29900,
    image: videoPoster,
    video: '/media/lolacarolafood_pindown.io_1784239184.mp4',
    ingredients: ['Base de la casa', 'Queso', 'Salsa especiada', 'Topping crocante', 'Hierbas'],
    available: true,
    tag: 'Recomendado',
    likesCount: 219,
    viewsCount: 1210,
    commentsCount: 31
  },
  {
    id: 'one-stop-sandwich',
    name: 'Sandwich Crunch',
    category: 'Sandwiches',
    shortDescription: 'Sandwich caliente con relleno jugoso y borde crocante.',
    description:
      'Sandwich armado al momento con pan caliente, relleno jugoso, salsa de la casa y un toque crocante para cada mordida.',
    price: 22900,
    image: videoPoster,
    video: '/media/onestop44_pindown.io_1784238412.mp4',
    ingredients: ['Pan tostado', 'Relleno de la casa', 'Salsa cremosa', 'Vegetales', 'Queso'],
    available: true,
    tag: 'Nuevo',
    likesCount: 149,
    viewsCount: 760,
    commentsCount: 14
  },
  {
    id: 'vitos-pastor-tacos',
    name: 'Tacos Vitos al Pastor',
    category: 'Tacos',
    shortDescription: 'Tacos calientes con carne sazonada, salsa y limon.',
    description:
      'Tacos estilo Vitos con carne sazonada, tortilla caliente, salsa intensa, cebolla, cilantro y limon fresco.',
    price: 26900,
    image: videoPoster,
    video: '/media/VitosTacos_pindown.io_1784239144.mp4',
    ingredients: ['Tortillas', 'Carne sazonada', 'Cebolla', 'Cilantro', 'Limon', 'Salsa'],
    available: true,
    tag: 'Recomendado',
    likesCount: 197,
    viewsCount: 970,
    commentsCount: 23
  },
  {
    id: 'vitos-quesadillas',
    name: 'Quesadillas Vitos',
    category: 'Tacos',
    shortDescription: 'Quesadillas doradas con queso fundido y salsa fresca.',
    description:
      'Quesadillas calientes con tortilla dorada, queso fundido, relleno sazonado y salsa fresca para terminar cada bocado.',
    price: 25900,
    image: videoPoster,
    video: '/media/VitosTacos_pindown.io_1784239258.mp4',
    ingredients: ['Tortilla dorada', 'Queso fundido', 'Relleno sazonado', 'Salsa fresca', 'Limon'],
    available: true,
    tag: 'Nuevo',
    likesCount: 184,
    viewsCount: 940,
    commentsCount: 21
  }
];
