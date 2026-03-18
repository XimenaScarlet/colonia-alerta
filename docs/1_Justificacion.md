# 1. Justificación de Plataformas y Herramientas Utilizadas

El desarrollo de **Colonia Alerta** requiere un stack tecnológico moderno que garantice rendimiento, experiencia de usuario asimilada a  una app nativa, y funcionamiento offline constante. Las herramientas seleccionadas son:

## Next.js (App Router)
Se eligió Next.js por su capacidad híbrida de Server-Side Rendering (SSR) y Client-Side Rendering (CSR). El App Router permite estructurar secciones complejas con facilidad. El uso de SSR es crucial para la pantalla de *Estadísticas*, donde los datos agregados pueden generarse desde el servidor mejorando el SEO y la carga inicial, mientras que CSR es vital para la interactividad del mapa y los formularios.

## TypeScript
Añade tipado estático al proyecto, reduciendo errores en tiempo de ejecución. Permite definir claramente las interfaces de datos, como los reportes, asegurando que las interacciones con IndexedDB y el tipado de componentes sean robustos y confiables a nivel empresarial/académico.

## Tailwind CSS
La elección de Tailwind CSS se debe a su motor de estilos mediante clases de utilidad. Permite diseñar componentes totalmente responsivos (Mobile-First) con un aspecto limpio e institucional, sin la necesidad de salir del contexto del JSX ni mantener grandes hojas de estilo sueltas.

## Leaflet + OpenStreetMap
Leaflet es una biblioteca ligera, open-source y muy estable para implementar mapas interactivos del lado del cliente. Junto con los azulejos de OpenStreetMap, proporciona una solución de geolocalización sin requerir una facturación o clave de API comercial (como Google Maps), haciéndola ideal para proyectos escolares.

## Dexie.js (IndexedDB)
IndexedDB es la base de datos nativa del navegador para almacenamiento estructurado off-line. Dado que su API nativa es compleja, se adoptó **Dexie.js** como un *wrapper* para facilitar consultas robustas, rápidas y simplificar el uso de promesas al almacenar reportes pendientes de sincronización. Además, abstrae el almacenamiento de imágenes en formato base64 asociado a cada reporte.

## next-pwa (Service Workers)
La herramienta `next-pwa` automatiza la generación y actualización del Service Worker. Esto es vital para cumplir el requerimiento de instalar la aplicación como PWA y asegurar que los recursos de la red (HTML, CSS, JS, Iconos) sean cacheados y la aplicación pueda abrirse sin conexión a internet.

## Web APIs (Notificaciones, Geolocalización, Cámara)
Se utilizan APIs integradas en navegadores modernos (HTML5) para interactuar con los periféricos del dispositivo, simulando una aplicación nativa. La API `navigator.geolocation` permite autocompletar coordenadas en el reporte. `<input type="file" capture="environment">` permite prender la cámara del celular. Las Notificaciones Web se usan para simular eventos push sin necesidad de integrar infraestructuras complejas como Firebase Cloud Messaging.
