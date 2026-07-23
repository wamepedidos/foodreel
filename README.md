# FoodReel Menu Social - Google Sheets + Apps Script

Esta PWA usa Google Apps Script como API y Google Sheets como fuente principal de datos operativos. Las fotos se guardan en Google Drive. Los videos se guardan en Firebase Storage y en Sheets solo queda la ruta/URL y metadata.

## Arquitectura

PWA React -> `src/services/apiClient.ts` -> Google Apps Script Web App -> Google Sheets + Google Drive + Firebase Storage para videos.

El frontend no lee ni escribe directamente el archivo de Sheets. Todas las operaciones usan acciones JSON como:

```json
{
  "action": "createOrder",
  "payload": {}
}
```

Respuesta uniforme:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## Hojas creadas

`setupSpreadsheet()` crea estas pestañas con encabezados estables:

`CONFIG`, `RESTAURANTS`, `CATEGORIES`, `DISHES`, `DISH_MEDIA`, `SAUCES`, `ADDITIONS`, `TABLES`, `TABLE_SESSIONS`, `USERS`, `EMPLOYEES`, `ORDERS`, `ORDER_ITEMS`, `EXPERIENCE_POSTS`, `COMMENTS`, `LIKES`, `VIEWS`, `SHARES`, `FAVORITES`, `WAITER_CALLS`, `AUDIT_LOG`.

## Instalacion de Apps Script

1. Crea un Google Sheet nuevo.
2. Abre `Extensiones > Apps Script`.
3. Crea los archivos `.gs` del directorio `apps-script/` con los mismos nombres.
4. Copia el contenido de cada archivo.
5. En `Project Settings > Script Properties`, agrega:
   - `SPREADSHEET_ID`: ID del Google Sheet.
   - `FIREBASE_STORAGE_BUCKET`: bucket de Firebase Storage, por ejemplo `mi-app.appspot.com`.
   - `FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL`: email de la cuenta de servicio.
   - `FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY`: private key completa, con saltos como `\n`.
6. Ejecuta manualmente `setupSpreadsheet()`.
7. Ejecuta `seedDemoData()` solo si quieres insertar datos demo.
8. Despliega como Web App con “Execute as: Me” y acceso “Anyone” o el alcance que uses para la PWA.
9. Copia la URL `/exec` del despliegue.

## Variables del frontend

Crea `.env` local o configura el hosting con:

```bash
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
VITE_TABLE_ACCESS_TOKEN=
```

`VITE_TABLE_ACCESS_TOKEN` es opcional si la fila de `TABLES.accessToken` esta vacia. Si configuras token por mesa, usa el mismo valor en el QR o entorno de esa mesa.

## Prueba rapida

Con la URL del Web App:

```bash
curl -X POST "https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec" \
  -H "content-type: text/plain;charset=utf-8" \
  -d "{\"action\":\"getMenu\",\"payload\":{\"restaurantId\":\"la-esquina-burger\"}}"
```

## Administrador inicial

`setupSpreadsheet()` crea:

- Email: `admin@foodreel.demo`
- Password inicial: `AdminDemo2026`
- Rol: `admin`

El hash y salt se guardan en `EMPLOYEES`. La contraseña plana no se devuelve al frontend.

## Multimedia

- Imagenes: Apps Script valida tipo/tamano, sube el blob a Drive y guarda metadata en `DISH_MEDIA`.
- Videos: Apps Script valida tipo/tamano, sube a Firebase Storage con cuenta de servicio y guarda la ruta del objeto en `DISH_MEDIA.driveFileId`.
- No se guarda base64 en Sheets.
- Limite actual de video: 45 MB para evitar fallos por limites de Apps Script.

## Datos temporales que siguen en localStorage

Permitidos y usados temporalmente:

- Carrito.
- Tema visual.
- Identificador de sesion anonima.
- Identificador de sesion de mesa.
- Idempotency key pendiente de pedido.
- Sesion administrativa local.

Pedidos, platos, empleados, publicaciones, comentarios, likes, vistas, compartidos, llamadas al mesero y metricas se guardan via Apps Script en Sheets.

## Despliegue y actualizacion

Cuando cambies Apps Script, crea una nueva version del despliegue Web App. Si cambia la URL del despliegue, actualiza `VITE_GOOGLE_APPS_SCRIPT_URL` y vuelve a compilar/publicar la PWA.

## Limitaciones conocidas

- Google Sheets no tiene listeners en tiempo real: pedidos y llamadas usan polling cada 4 segundos con Page Visibility API.
- Menu, empleados y dashboard usan cache/polling menos frecuente.
- Los comentarios nuevos quedan `pending`; deben aprobarse para aparecer publicamente.
- Videos pesados deben cargarse fuera de esta etapa o comprimirse antes de subirlos.
- Firebase se usa solo como almacenamiento de videos, no como base de datos.
