function getMenu(payload) {
  var restaurantId = payload.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  var cache = CacheService.getScriptCache();
  var cacheKey = 'menu:' + restaurantId;
  var cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);
  var restaurant = allRows('RESTAURANTS').filter(function(row) {
    return row.id === restaurantId && toBool(row.active);
  })[0] || null;
  var categories = allRows('CATEGORIES').filter(function(row) {
    return row.restaurantId === restaurantId && toBool(row.active);
  }).sort(function(a, b) {
    return toNumber(a.sortOrder) - toNumber(b.sortOrder);
  }).map(categoryToFrontend);
  var dishes = allRows('DISHES').filter(function(row) {
    return row.restaurantId === restaurantId && row.status === 'active';
  }).sort(function(a, b) {
    return toNumber(a.sortOrder) - toNumber(b.sortOrder);
  }).map(dishToPublic);
  var result = { restaurant: restaurant, categories: categories, dishes: dishes };
  cache.put(cacheKey, JSON.stringify(result), APP_CONFIG.CACHE_MENU_SECONDS);
  return result;
}

function getCategories(payload) {
  var restaurantId = payload.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  return allRows('CATEGORIES').filter(function(row) {
    return row.restaurantId === restaurantId;
  }).map(categoryToFrontend);
}

function getDish(payload) {
  requireFields(payload, ['dishId']);
  var dish = findById('DISHES', payload.dishId);
  return dish ? dishToAdmin(dish) : null;
}

function getDishes(payload) {
  var restaurantId = payload.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  return {
    dishes: allRows('DISHES').filter(function(row) {
      return row.restaurantId === restaurantId;
    }).map(dishToAdmin)
  };
}

function createDish(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['restaurantId', 'title', 'price']);
  var timestamp = nowIso();
  var record = dishFromFrontend(payload, timestamp);
  record.id = record.id || makeId('dish');
  record.createdAt = timestamp;
  record.updatedAt = timestamp;
  appendRecord('DISHES', record);
  saveSaucesForDish(record.id, payload.sauces || [], record.restaurantId);
  invalidateMenu(record.restaurantId);
  audit('createDish', 'dish', record.id, null, record, context);
  return dishToAdmin(record);
}

function updateDish(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['dishId', 'dish']);
  var previous = findById('DISHES', payload.dishId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro el plato.');
  var record = dishFromFrontend(Object.assign({}, payload.dish, { id: payload.dishId }), previous.createdAt);
  record.updatedAt = nowIso();
  var updated = updateRecord('DISHES', payload.dishId, record);
  saveSaucesForDish(payload.dishId, payload.dish.sauces || [], updated.restaurantId);
  invalidateMenu(updated.restaurantId);
  audit('updateDish', 'dish', updated.id, previous, updated, context);
  return dishToAdmin(updated);
}

function updateDishStatus(payload, context) {
  requireRole(context, ['admin']);
  requireFields(payload, ['dishId', 'status']);
  if (['draft', 'active', 'unavailable', 'archived'].indexOf(payload.status) === -1) {
    throw appError('INVALID_STATUS', 'Estado de plato no permitido.');
  }
  var previous = findById('DISHES', payload.dishId);
  if (!previous) throw appError('NOT_FOUND', 'No se encontro el plato.');
  var updated = updateRecord('DISHES', payload.dishId, { status: payload.status, updatedAt: nowIso() });
  invalidateMenu(updated.restaurantId);
  audit('updateDishStatus', 'dish', updated.id, previous, updated, context);
  return dishToAdmin(updated);
}

function archiveDish(payload, context) {
  payload.status = 'archived';
  return updateDishStatus(payload, context);
}

function registerDishAddedToOrder(payload) {
  requireFields(payload, ['dishId', 'restaurantId']);
  return { count: incrementCellById('DISHES', payload.dishId, 'addedToOrderCount', 1) };
}

function invalidateMenu(restaurantId) {
  CacheService.getScriptCache().remove('menu:' + restaurantId);
}

function dishFromFrontend(input, createdAt) {
  return {
    id: input.id || '',
    restaurantId: input.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID,
    categoryId: input.categoryId || 'Plato fuerte',
    title: String(input.title || '').trim(),
    shortDescription: String(input.shortDescription || '').slice(0, 140),
    description: String(input.description || ''),
    price: toNumber(input.price),
    status: input.status || 'draft',
    mainImageUrl: input.mainImageUrl || '',
    videoUrl: input.videoUrl || '',
    videoThumbnailUrl: input.videoThumbnailUrl || '',
    servingSizesJson: safeJson(input.servingSizes || []),
    servingDescription: input.servingDescription || '',
    spicyLevel: toNumber(input.spicyLevel),
    isVegan: Boolean(input.isVegan),
    isVegetarian: Boolean(input.isVegetarian),
    isGlutenFree: Boolean(input.isGlutenFree),
    featuresJson: safeJson(input.features || []),
    ingredientsJson: safeJson(input.ingredients || []),
    allergensJson: safeJson(input.allergens || []),
    crossContaminationWarning: input.crossContaminationWarning || '',
    preparationTimeMin: input.preparationTimeMin === '' ? '' : toNumber(input.preparationTimeMin),
    preparationTimeMax: input.preparationTimeMax === '' ? '' : toNumber(input.preparationTimeMax),
    sauceSelectionRequired: Boolean(input.sauceSelectionRequired),
    minimumSauces: toNumber(input.minimumSauces),
    maximumSauces: toNumber(input.maximumSauces),
    likesCount: toNumber(input.likesCount),
    viewsCount: toNumber(input.viewsCount),
    commentsCount: toNumber(input.commentsCount),
    sharesCount: toNumber(input.sharesCount),
    addedToOrderCount: toNumber(input.addedToOrderCount),
    ordersCount: toNumber(input.ordersCount),
    sortOrder: toNumber(input.sortOrder),
    createdAt: createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

function dishToPublic(row) {
  return {
    id: row.id,
    name: row.title,
    category: row.categoryId,
    shortDescription: row.shortDescription,
    description: row.description,
    price: toNumber(row.price),
      image: row.mainImageUrl || row.videoThumbnailUrl,
      video: row.videoUrl || undefined,
      ingredients: parseJson(row.ingredientsJson, []),
      sauces: findManyBy('SAUCES', 'dishId', row.id).filter(function(sauce) { return toBool(sauce.available); }).map(sauceToFrontend),
      sauceSelectionRequired: toBool(row.sauceSelectionRequired),
      minimumSauces: toNumber(row.minimumSauces),
      maximumSauces: toNumber(row.maximumSauces),
      allergens: parseJson(row.allergensJson, []),
      available: row.status === 'active',
      tag: parseJson(row.featuresJson, [])[0],
      features: parseJson(row.featuresJson, []),
      servingSizes: parseJson(row.servingSizesJson, []),
      servingDescription: row.servingDescription,
      spicyLevel: toNumber(row.spicyLevel),
      isVegan: toBool(row.isVegan),
      isVegetarian: toBool(row.isVegetarian),
      isGlutenFree: toBool(row.isGlutenFree),
      dietaryNotes: row.dietaryNotes,
      crossContaminationWarning: row.crossContaminationWarning,
      likesCount: toNumber(row.likesCount),
    viewsCount: toNumber(row.viewsCount),
    commentsCount: toNumber(row.commentsCount),
    sharesCount: toNumber(row.sharesCount),
    addedToOrderCount: toNumber(row.addedToOrderCount)
  };
}

function dishToAdmin(row) {
  var dish = dishToPublic(row);
  return Object.assign({}, row, {
    gallery: findManyBy('DISH_MEDIA', 'dishId', row.id).filter(function(item) { return item.type === 'image'; }).map(function(item) {
      return { id: item.id, url: item.fileUrl, type: item.type, name: item.fileName };
    }),
    sauces: findManyBy('SAUCES', 'dishId', row.id).map(sauceToFrontend),
    servingSizes: parseJson(row.servingSizesJson, []),
    features: parseJson(row.featuresJson, []),
    ingredients: parseJson(row.ingredientsJson, []),
    allergens: parseJson(row.allergensJson, []),
    price: dish.price,
    spicyLevel: toNumber(row.spicyLevel),
    isVegan: toBool(row.isVegan),
    isVegetarian: toBool(row.isVegetarian),
    isGlutenFree: toBool(row.isGlutenFree),
    sauceSelectionRequired: toBool(row.sauceSelectionRequired),
    minimumSauces: toNumber(row.minimumSauces),
    maximumSauces: toNumber(row.maximumSauces),
    likesCount: toNumber(row.likesCount),
    viewsCount: toNumber(row.viewsCount),
    commentsCount: toNumber(row.commentsCount),
    sharesCount: toNumber(row.sharesCount),
    addedToOrderCount: toNumber(row.addedToOrderCount),
    ordersCount: toNumber(row.ordersCount),
    customerPostsCount: 0,
    soldCount: 0,
    sortOrder: toNumber(row.sortOrder)
  });
}

function categoryToFrontend(row) {
  return Object.assign({}, row, { active: toBool(row.active), sortOrder: toNumber(row.sortOrder) });
}

function saveSaucesForDish(dishId, sauces, restaurantId) {
  sauces.forEach(function(sauce, index) {
    if (!sauce.name) return;
    var existing = sauce.id ? findById('SAUCES', sauce.id) : null;
    var record = {
      id: existing ? existing.id : makeId('sauce'),
      restaurantId: restaurantId,
      dishId: dishId,
      name: sauce.name,
      description: sauce.description || '',
      price: toNumber(sauce.price),
      available: Boolean(sauce.available),
      defaultSelected: Boolean(sauce.defaultSelected),
      imageUrl: sauce.imageUrl || '',
      sortOrder: index + 1,
      createdAt: existing ? existing.createdAt : nowIso(),
      updatedAt: nowIso()
    };
    if (existing) updateRecord('SAUCES', existing.id, record);
    else appendRecord('SAUCES', record);
  });
}

function sauceToFrontend(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: toNumber(row.price),
    available: toBool(row.available),
    defaultSelected: toBool(row.defaultSelected),
    imageUrl: row.imageUrl
  };
}
