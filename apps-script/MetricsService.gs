function getDashboardMetrics(payload, context) {
  requireRole(context, ['admin']);
  var restaurantId = payload.restaurantId || context.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID;
  var dishes = allRows('DISHES').filter(function(row) {
    return row.restaurantId === restaurantId && row.status !== 'archived';
  }).map(dishToAdmin);
  var orders = allRows('ORDERS').filter(function(row) {
    return row.restaurantId === restaurantId;
  });
  var posts = allRows('EXPERIENCE_POSTS').filter(function(row) {
    return row.restaurantId === restaurantId;
  });
  var shares = allRows('SHARES').filter(function(row) {
    return row.restaurantId === restaurantId;
  });
  var stats = dashboardFromDishes(dishes);
  stats.ordersSentTotal = orders.length;
  stats.salesTotal = orders.reduce(function(total, order) { return total + toNumber(order.total); }, 0);
  stats.customerPostsTotal = posts.length;
  stats.pendingPostsTotal = posts.filter(function(post) { return post.status === 'pending'; }).length;
  stats.menuSharesCount = toNumber(getConfigValue('menuSharesCount', '0'));
  stats.postSharesTotal = shares.filter(function(share) { return share.targetType === 'experiencePost'; }).length;
  stats.topInteractionDish = dishes.slice().sort(function(a, b) {
    return (b.likesCount + b.commentsCount + b.sharesCount) - (a.likesCount + a.commentsCount + a.sharesCount);
  })[0] || null;
  return stats;
}

function dashboardFromDishes(dishes) {
  var totals = dishes.reduce(function(acc, dish) {
    acc.views += dish.viewsCount;
    acc.likes += dish.likesCount;
    acc.comments += dish.commentsCount;
    acc.shares += dish.sharesCount;
    acc.added += dish.addedToOrderCount;
    acc.orders += dish.ordersCount;
    return acc;
  }, { views: 0, likes: 0, comments: 0, shares: 0, added: 0, orders: 0 });
  var interactions = totals.likes + totals.comments + totals.shares;
  return {
    viewsTotal: totals.views,
    likesTotal: totals.likes,
    commentsTotal: totals.comments,
    dishSharesTotal: totals.shares,
    menuSharesCount: 0,
    addedToOrderTotal: totals.added,
    ordersSentTotal: totals.orders,
    customerPostsTotal: 0,
    activeDishes: dishes.filter(function(dish) { return dish.status === 'active'; }).length,
    unavailableDishes: dishes.filter(function(dish) { return dish.status === 'unavailable'; }).length,
    topViewedDish: topByMetric(dishes, 'viewsCount'),
    topLikedDish: topByMetric(dishes, 'likesCount'),
    topCommentedDish: topByMetric(dishes, 'commentsCount'),
    topSharedDish: topByMetric(dishes, 'sharesCount'),
    topAddedDish: topByMetric(dishes, 'addedToOrderCount'),
    topCategory: topCategory(dishes),
    averageViews: dishes.length ? totals.views / dishes.length : 0,
    averageInteractions: dishes.length ? interactions / dishes.length : 0,
    interactionRate: totals.views > 0 ? interactions / totals.views : 0
  };
}

function topByMetric(rows, metric) {
  return rows.slice().sort(function(a, b) { return toNumber(b[metric]) - toNumber(a[metric]); })[0] || null;
}

function topCategory(dishes) {
  var map = {};
  dishes.forEach(function(dish) {
    map[dish.categoryId] = (map[dish.categoryId] || 0) + dish.viewsCount;
  });
  return Object.keys(map).sort(function(a, b) { return map[b] - map[a]; })[0] || 'Sin datos';
}
