var APP_CONFIG = {
  APP_NAME: 'RestaurantApp',
  DEFAULT_SPREADSHEET_ID: '1Ker24aWxc1iGu39UU7Cx7yGEb4IwZlddQBbp7ZIEIM4',
  DEFAULT_RESTAURANT_ID: 'la-esquina-burger',
  DEFAULT_RESTAURANT_NAME: 'La Esquina Burger',
  DEFAULT_RESTAURANT_SLUG: 'la-esquina-burger',
  DEFAULT_TIMEZONE: 'America/Bogota',
  MAX_IMAGE_BYTES: 10 * 1024 * 1024,
  MAX_VIDEO_BYTES: 45 * 1024 * 1024,
  CACHE_MENU_SECONDS: 120,
  VIEW_DEDUP_HOURS: 6
};

var SHEET_HEADERS = {
  CONFIG: ['key', 'value', 'description', 'updatedAt'],
  RESTAURANTS: ['id', 'name', 'slug', 'logoLightUrl', 'logoDarkUrl', 'description', 'address', 'phone', 'primaryColor', 'active', 'createdAt', 'updatedAt'],
  CATEGORIES: ['id', 'restaurantId', 'name', 'description', 'imageUrl', 'sortOrder', 'active', 'createdAt', 'updatedAt'],
  DISHES: ['id', 'restaurantId', 'categoryId', 'title', 'shortDescription', 'description', 'price', 'status', 'mainImageUrl', 'videoUrl', 'videoThumbnailUrl', 'servingSizesJson', 'servingDescription', 'spicyLevel', 'isVegan', 'isVegetarian', 'isGlutenFree', 'featuresJson', 'ingredientsJson', 'allergensJson', 'crossContaminationWarning', 'preparationTimeMin', 'preparationTimeMax', 'sauceSelectionRequired', 'minimumSauces', 'maximumSauces', 'likesCount', 'viewsCount', 'commentsCount', 'sharesCount', 'addedToOrderCount', 'ordersCount', 'sortOrder', 'createdAt', 'updatedAt'],
  DISH_MEDIA: ['id', 'restaurantId', 'dishId', 'type', 'driveFileId', 'fileUrl', 'thumbnailUrl', 'mimeType', 'fileName', 'sizeBytes', 'sortOrder', 'isPrimary', 'createdAt'],
  SAUCES: ['id', 'restaurantId', 'dishId', 'name', 'description', 'price', 'available', 'defaultSelected', 'imageUrl', 'sortOrder', 'createdAt', 'updatedAt'],
  TABLES: ['id', 'restaurantId', 'tableNumber', 'tableName', 'accessToken', 'qrUrl', 'status', 'active', 'currentSessionId', 'createdAt', 'updatedAt'],
  TABLE_SESSIONS: ['id', 'restaurantId', 'tableId', 'customerSessionId', 'waiterId', 'status', 'openedAt', 'closedAt', 'total'],
  USERS: ['id', 'restaurantId', 'name', 'email', 'phone', 'photoUrl', 'role', 'active', 'createdAt', 'updatedAt'],
  EMPLOYEES: ['id', 'restaurantId', 'userId', 'firstName', 'lastName', 'email', 'phone', 'photoUrl', 'role', 'active', 'passwordHash', 'passwordSalt', 'notificationsEnabled', 'pushSubscriptionId', 'deviceTokensJson', 'lastNotificationAt', 'lastLoginAt', 'createdAt', 'updatedAt'],
  ORDERS: ['id', 'restaurantId', 'tableId', 'tableNumber', 'tableSessionId', 'customerSessionId', 'orderNumber', 'idempotencyKey', 'source', 'status', 'subtotal', 'upsellTotal', 'total', 'customerNotes', 'waiterId', 'createdAt', 'receivedAt', 'confirmedAt', 'preparationStartedAt', 'readyAt', 'deliveredAt', 'accountRequestedAt', 'paidAt', 'cancelledAt', 'cancellationReason'],
  ORDER_ITEMS: ['id', 'orderId', 'restaurantId', 'dishId', 'dishName', 'dishImageUrl', 'quantity', 'unitPrice', 'selectedOptionsJson', 'selectedSaucesJson', 'selectedExtrasJson', 'notes', 'subtotal', 'isUpsell', 'createdAt'],
  EXPERIENCE_POSTS: ['id', 'restaurantId', 'tableSessionId', 'userId', 'userName', 'userPhotoUrl', 'mediaUrl', 'mediaDriveFileId', 'mediaType', 'text', 'dishId', 'dishName', 'dishImageUrl', 'orderId', 'status', 'likesCount', 'viewsCount', 'commentsCount', 'sharesCount', 'createdAt', 'updatedAt'],
  COMMENTS: ['id', 'restaurantId', 'targetType', 'targetId', 'userId', 'userName', 'userPhotoUrl', 'parentCommentId', 'text', 'status', 'likesCount', 'createdAt', 'updatedAt'],
  LIKES: ['id', 'restaurantId', 'targetType', 'targetId', 'userId', 'sessionId', 'createdAt'],
  VIEWS: ['id', 'restaurantId', 'targetType', 'targetId', 'userId', 'sessionId', 'viewedDate', 'createdAt'],
  SHARES: ['id', 'restaurantId', 'targetType', 'targetId', 'userId', 'sessionId', 'shareMethod', 'createdAt'],
  FAVORITES: ['id', 'restaurantId', 'targetType', 'targetId', 'userId', 'sessionId', 'createdAt'],
  WAITER_CALLS: ['id', 'restaurantId', 'tableId', 'tableNumber', 'tableSessionId', 'customerSessionId', 'type', 'message', 'status', 'waiterId', 'createdAt', 'acceptedAt', 'resolvedAt', 'cancelledAt'],
  AUDIT_LOG: ['id', 'restaurantId', 'userId', 'userRole', 'action', 'resourceType', 'resourceId', 'previousDataJson', 'newDataJson', 'ipOrSession', 'createdAt']
};

var BASE_CONFIG_ROWS = [
  ['restaurantName', APP_CONFIG.DEFAULT_RESTAURANT_NAME, 'Nombre visible del restaurante'],
  ['restaurantSlug', APP_CONFIG.DEFAULT_RESTAURANT_SLUG, 'Slug publico'],
  ['restaurantLogo', '', 'URL del logo principal'],
  ['primaryColor', '#FF6500', 'Color principal de la PWA'],
  ['currency', 'COP', 'Moneda para precios'],
  ['country', 'CO', 'Pais de operacion'],
  ['timezone', APP_CONFIG.DEFAULT_TIMEZONE, 'Zona horaria del restaurante'],
  ['menuSharesCount', '0', 'Contador separado de compartidos de la carta'],
  ['maintenanceMode', 'false', 'Modo mantenimiento'],
  ['publicMenuEnabled', 'true', 'Disponibilidad publica del menu']
];

var INITIAL_CATEGORIES = ['Bebida', 'Entrada', 'Plato fuerte', 'Postre'];

var ORDER_STATUSES = ['new', 'received', 'confirmed', 'preparing', 'ready', 'delivered', 'account_requested', 'paid', 'cancelled'];
var EMPLOYEE_ROLES = ['admin', 'waiter', 'kitchen'];
var ADMIN_ROLES = ['admin', 'ADMINISTRADOR'];
var STAFF_ROLES = ['admin', 'waiter', 'kitchen', 'ADMINISTRADOR', 'MESERO', 'COCINA'];
