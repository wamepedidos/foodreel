function routeRequest(request) {
  var action = request.action;
  var payload = request.payload || {};
  var context = publicContext(payload, request.auth || {});
  var routes = {
    getRestaurant: function() { return findById('RESTAURANTS', payload.restaurantId || APP_CONFIG.DEFAULT_RESTAURANT_ID); },
    getMenu: function() { return getMenu(payload); },
    getCategories: function() { return getCategories(payload); },
    getDish: function() { return getDish(payload); },
    createOrder: function() { return createOrder(payload, context); },
    getOrder: function() { return getOrder(payload); },
    createWaiterCall: function() { return createWaiterCall(payload); },
    createExperiencePost: function() { return createExperiencePost(payload); },
    getExperiencePost: function() { return getExperiencePost(payload); },
    getApprovedPosts: function() { return getApprovedPosts(payload); },
    toggleLike: function() { return toggleLike(payload); },
    registerView: function() { return registerView(payload); },
    registerShare: function() { return registerShare(payload); },
    getComments: function() { return getComments(payload); },
    createComment: function() { return createComment(payload); },
    loginEmployee: function() { return loginEmployee(payload); },
    getRestaurantOrders: function() { return getRestaurantOrders(payload, context); },
    updateOrderStatus: function() { return updateOrderStatus(payload, context); },
    getWaiterCalls: function() { return getWaiterCalls(payload, context); },
    updateWaiterCallStatus: function() { return updateWaiterCallStatus(payload, context); },
    getDashboardMetrics: function() { return getDashboardMetrics(payload, context); },
    getDishes: function() { return getDishes(payload, context); },
    createDish: function() { return createDish(payload, context); },
    updateDish: function() { return updateDish(payload, context); },
    updateDishStatus: function() { return updateDishStatus(payload, context); },
    archiveDish: function() { return archiveDish(payload, context); },
    uploadMedia: function() { return uploadMedia(payload, context); },
    uploadDishMedia: function() { return uploadMedia(payload, context); },
    deleteMedia: function() { return deleteMedia(payload, context); },
    getMediaUrl: function() { return getMediaUrl(payload); },
    getEmployees: function() { return getEmployees(payload, context); },
    createEmployee: function() { return createEmployee(payload, context); },
    updateEmployee: function() { return updateEmployee(payload, context); },
    updateEmployeeStatus: function() { return updateEmployeeStatus(payload, context); },
    updateEmployeeRole: function() { return updateEmployeeRole(payload, context); },
    resetEmployeeAccess: function() { return resetEmployeeAccess(payload, context); },
    approveExperiencePost: function() { return approveExperiencePost(payload, context); },
    rejectExperiencePost: function() { return rejectExperiencePost(payload, context); },
    moderateComment: function() { return moderateComment(payload, context); }
  };
  if (!routes[action]) throw appError('UNKNOWN_ACTION', 'Accion no soportada: ' + action);
  return routes[action]();
}
