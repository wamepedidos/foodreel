function doGet(e) {
  try {
    var request = parseRequest(e);
    if (!request.action) {
      return ok({ status: 'healthy', app: APP_CONFIG.APP_NAME });
    }
    return ok(routeRequest(request));
  } catch (error) {
    return fail(error.code || 'SERVER_ERROR', error.message || 'Error inesperado.');
  }
}

function doPost(e) {
  try {
    var request = parseRequest(e);
    return ok(routeRequest(request));
  } catch (error) {
    return fail(error.code || 'SERVER_ERROR', error.message || 'Error inesperado.');
  }
}
