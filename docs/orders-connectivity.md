# Conectividad de pedidos

La pantalla del cliente crea pedidos a traves de `ordersService`, no directamente desde componentes visuales. La futura interfaz del restaurante debe reutilizar el mismo servicio para leer, suscribirse y actualizar estados.

## Acceso actual

- Cliente: crea pedidos con `source: customer_pwa` y consulta pedidos ligados a su `customerSessionId`.
- Vista tecnica: `/staff-preview/orders` se habilita solo en desarrollo o con `VITE_ENABLE_STAFF_PREVIEW=true`.
- API tecnica: en produccion, los cambios de estado requieren `ENABLE_STAFF_PREVIEW=true` en runtime o `STAFF_PREVIEW_TOKEN` compartido con `VITE_STAFF_PREVIEW_TOKEN`.

## Siguiente etapa

Los roles definitivos quedan preparados pero no implementados en esta etapa:

- `customer`
- `waiter`
- `admin`

La autenticacion real de meseros y administradores debe reemplazar el acceso tecnico temporal antes de abrir modificaciones de estado en produccion.
