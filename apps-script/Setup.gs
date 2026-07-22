function setupSpreadsheet() {
  Object.keys(SHEET_HEADERS).forEach(function(name) {
    getSheet(name);
  });
  ensureBaseConfig();
  ensureRestaurant();
  ensureInitialCategories();
  ensureInitialTable();
  ensureInitialAdmin();
  ensureDriveFolders();
  return { ok: true, sheets: Object.keys(SHEET_HEADERS) };
}

function seedDemoData() {
  setupSpreadsheet();
  if (allRows('DISHES').some(function(row) { return row.restaurantId === APP_CONFIG.DEFAULT_RESTAURANT_ID; })) {
    return { inserted: false, message: 'Ya existen platos para este restaurante.' };
  }
  var timestamp = nowIso();
  var categoryId = 'cat-plato-fuerte';
  var dishes = [
    ['demo-burger', 'Burger Ahumada', 'Pan artesanal, carne jugosa y salsa de la casa.', 32900],
    ['demo-tacos', 'Tacos Vitos', 'Tortillas calientes con carne sazonada y limon.', 26900],
    ['demo-postre', 'Postre Dorado', 'Final dulce con textura cremosa.', 15900]
  ].map(function(item, index) {
    return {
      id: item[0],
      restaurantId: APP_CONFIG.DEFAULT_RESTAURANT_ID,
      categoryId: index === 2 ? 'cat-postre' : categoryId,
      title: item[1],
      shortDescription: item[2],
      description: item[2],
      price: item[3],
      status: 'active',
      mainImageUrl: '',
      videoUrl: '',
      videoThumbnailUrl: '',
      servingSizesJson: '[1]',
      servingDescription: '',
      spicyLevel: 0,
      isVegan: false,
      isVegetarian: false,
      isGlutenFree: false,
      featuresJson: '["Demo"]',
      ingredientsJson: '[]',
      allergensJson: '[]',
      crossContaminationWarning: '',
      preparationTimeMin: 12,
      preparationTimeMax: 25,
      sauceSelectionRequired: false,
      minimumSauces: 0,
      maximumSauces: 0,
      likesCount: 0,
      viewsCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      addedToOrderCount: 0,
      ordersCount: 0,
      sortOrder: index + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });
  batchAppend('DISHES', dishes);
  invalidateMenu(APP_CONFIG.DEFAULT_RESTAURANT_ID);
  return { inserted: true, count: dishes.length };
}

function ensureBaseConfig() {
  BASE_CONFIG_ROWS.forEach(function(row) {
    if (!findOneBy('CONFIG', 'key', row[0])) {
      appendRecord('CONFIG', { key: row[0], value: row[1], description: row[2], updatedAt: nowIso() });
    }
  });
}

function ensureRestaurant() {
  if (!findById('RESTAURANTS', APP_CONFIG.DEFAULT_RESTAURANT_ID)) {
    var timestamp = nowIso();
    appendRecord('RESTAURANTS', {
      id: APP_CONFIG.DEFAULT_RESTAURANT_ID,
      name: APP_CONFIG.DEFAULT_RESTAURANT_NAME,
      slug: APP_CONFIG.DEFAULT_RESTAURANT_SLUG,
      logoLightUrl: '',
      logoDarkUrl: '',
      description: 'Carta digital social',
      address: 'Calle 74 #12-18',
      phone: '',
      primaryColor: '#FF6500',
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
}

function ensureInitialCategories() {
  INITIAL_CATEGORIES.forEach(function(name, index) {
    var id = 'cat-' + name.toLowerCase().replace(/\s+/g, '-');
    if (!findById('CATEGORIES', id)) {
      appendRecord('CATEGORIES', {
        id: id,
        restaurantId: APP_CONFIG.DEFAULT_RESTAURANT_ID,
        name: name,
        description: '',
        imageUrl: '',
        sortOrder: index + 1,
        active: true,
        createdAt: nowIso(),
        updatedAt: nowIso()
      });
    }
  });
}

function ensureInitialTable() {
  if (!findById('TABLES', 'mesa-7')) {
    appendRecord('TABLES', {
      id: 'mesa-7',
      restaurantId: APP_CONFIG.DEFAULT_RESTAURANT_ID,
      tableNumber: 7,
      tableName: 'Mesa 7',
      accessToken: '',
      qrUrl: '',
      status: 'available',
      active: true,
      currentSessionId: '',
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  }
}

function ensureInitialAdmin() {
  if (!findById('EMPLOYEES', 'employee-admin-demo')) {
    var salt = makeId('salt');
    appendRecord('EMPLOYEES', {
      id: 'employee-admin-demo',
      restaurantId: APP_CONFIG.DEFAULT_RESTAURANT_ID,
      userId: '',
      firstName: 'Admin',
      lastName: 'Demo',
      email: 'admin@foodreel.demo',
      phone: '',
      photoUrl: '',
      role: 'admin',
      active: true,
      passwordHash: digestPassword('AdminDemo2026', salt),
      passwordSalt: salt,
      notificationsEnabled: false,
      pushSubscriptionId: '',
      deviceTokensJson: '[]',
      lastNotificationAt: '',
      lastLoginAt: '',
      createdAt: nowIso(),
      updatedAt: nowIso()
    });
  }
}
