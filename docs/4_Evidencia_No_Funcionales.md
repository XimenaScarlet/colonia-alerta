# 4. Evidencia de Requerimientos No Funcionales

Para el reporte de la tarea, debes tomar las siguientes capturas y referenciar los fragmentos de código del proyecto:

## Splash y Home
1. **Captura 1 (Splash):** Sitúate en DevTools -> Network -> Slow 3G, recarga la app y toma foto rápida del logo rebotando de `Colonia Alerta`.
2. **Captura 2 (Home):** Pantalla principal mostrando los Resúmenes y Acciones Rápidas (tarjetas de "142 Reportes Hoy").
* **Fragmento de código a referenciar:** `src/app/page.tsx` (efecto de setTimeout) y `src/app/home/page.tsx`.

## SSR y CSR
1. **Captura 3 (SSR):** En DevTools, pestaña Network, selecciona la primera petición HTTP de `/estadisticas` y muestra que el Response o Payload ya contiene el HTML estructurado con los números "3450".
2. **Captura 4 (CSR):** Muestra el formulario vacío de `/reportar` o el mapa, donde ocurre hidratación dinámica del lado del cliente.
* **Fragmento de código a referenciar:** `src/app/estadisticas/page.tsx` (componente async de Next.js sin 'use client') vs `src/app/reportar/page.tsx` (que posee 'use client').

## Datos Locales, Remotos y Offline
1. **Captura 5 (IndexedDB):** Ve a DevTools -> Application -> IndexedDB -> `ColoniaAlertaDB` y toma captura mostrando un registro u objeto JSON allí almacenado.
2. **Captura 6 (Badge Offline):** Apaga el internet de tu PC/móvil, ingresa a la Home y toma foto del aviso *Modo Sin Conexión*.
* **Fragmento de código a referenciar:** `src/lib/db.ts` (esquema de persistencia) y el uso de `db.reports.add(...)` en `page.tsx`.

## Notificaciones
1. **Captura 7 (Notificación Nativa):** Toma foto del momento en que Chrome/móvil te muestra el globo push nativo "Reporte Guardado".
* **Fragmento de código a referenciar:** La sección de código en `src/app/reportar/page.tsx` desde `const sendNotification = ...` hasta el uso de `new Notification(...)`.

## Uso de Elementos Físicos del Dispositivo
1. **Captura 8 (Geolocalización):** Toma captura de la ventana emergente de Chrome preguntando "¿Colonia Alerta quiere saber tu ubicación?". 
2. **Captura 9 (Cámara):** Fotografía el momento (desde otro celular idealmente) donde se abre el selector de cámara al presionar el área punteada en "Tomar o subir foto".
* **Fragmento de código a referenciar:** `navigator.geolocation.getCurrentPosition(...)` e `<input type="file" capture="environment">` en `src/app/reportar/page.tsx`.
