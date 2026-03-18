# 6. Evidencia de Requerimientos Funcionales

Para complementar tu evaluación, presenta las siguientes pantallas sobre el uso principal de "Colonia Alerta":

## Mapa y Filtros
- **Captura 1 (Mapa Interactivo):** Toma screenshot de la pestaña `Mapa`, asegurándote que se vea el marcador en "Mirasierra" del bache peligroso pre-cargado.
- **Evidencia en Código:** Muestra `src/components/MapComponent.tsx` donde se carga React-Leaflet y los Markers. Destacar la des-habilitación del SSR en `src/app/mapa/page.tsx` con `dynamic`.

## Reportes y Sincronización
- **Captura 2 (Formulario Lleno):** Captura de `/reportar` instantes antes de darle a *Enviar Reporte*.
- **Captura 3 (Mis Reportes Local):** Captura la pantalla de `Mis Reportes` cuando apagaste la red. Subraya la pequeña medalla de `Local` de color rojo en el reporte.
- **Captura 4 (Sincronización):** Enciende la red y captura cómo esa misma medalla cambió a `Sincronizado` (verde) tras recargar o reaccionar el listener en `Mis Reportes`.
- **Evidencia en Código:** El uso de Dexie-react-hooks para la lista en vivo en `src/app/mis-reportes/page.tsx`.

## Estadísticas
- **Captura 5 (Gráficas o KPI's):** Una fotografía a la página `/estadisticas` mostrando las gráficas de barra y contadores "3450". (La mención del SSR basta como requerimiento técnico, pero aquí validamos lo visual del funcional).

## Geolocalización, Cámara y Notificaciones
Todas estas quedaron justificadas en el documento "4_Evidencia_No_Funcionales", pero asegúrate de mencionarlas también aquí ya que son requerimientos funcionales listados en la rúbrica.

---
Con las 9 capturas del Documento 4 y estas 5 pantallas extra, el escenario contemplado en la rúbrica queda completamente documentado.
