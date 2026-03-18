# 3. Reporte de Pruebas

Se determinó un conjunto de pruebas funcionales críticas para validar los requerimientos de la PWA.

| Caso de Prueba | Pasos a Seguir | Resultado Esperado | Resultado Obtenido | Estatus |
| :--- | :--- | :--- | :--- | :--- |
| **P1: Carga del Splash / Home** | Abrir la URL raíz `/`. | Muestra logo rebotando (CSS), espera 2.5s y redirige a `/home`. | Animación visual visible y redirección exitosa. | ✅ Aprobado |
| **P2: Navegación SSR (Estadísticas)** | Navegar a `Estadísticas` desde el menú inferior. | El HTML y los datos precargados deben servirse formados (SSR) sin parpadeo de "Cargando...". | Interfaz sólida, datos precomputados se muestran inmediatamente. | ✅ Aprobado |
| **P3: Visualización del Mapa (CSR)** | Navegar a `Mapa`. Conceder permisos de ubicación al navegador. | El mapa de Leaflet carga, mueve la vista a Saltillo/Ramos y marca la ubicación real del usuario. | El mapa carga sin errores de Window en SSR. Marcadores y geolocalización operativos. | ✅ Aprobado |
| **P4: Creación de Reporte y Cámara** | Ir a `Reportar`. Tocar "Generar Foto". | Si se está en móvil, debe abrirse la aplicación de cámara trasera. | Abre selector de archivos o cámara. Muestra render visual de la foto. | ✅ Aprobado |
| **P5: Funcionamiento Offline y DB Local** | Apagar Wi-Fi / Datos en simulador. Crear reporte. | El reporte debe guardarse localmente en IndexedDB asumiendo un estado local. Muestra notificación "Guardado localmente". | Datos en Dexie correctos. Badge de conexión aparece con reportes pendientes. | ✅ Aprobado |
| **P6: Sincronización al Reconectarse** | Encender red nuevamente estando en `Home`. | El Badge de "modo sin conexión" desaparece o muestra estado de "Sincronizando". | Los Listeners JS reaccionan y asumen nuevamente conectividad online. | ✅ Aprobado |
| **P7: Instalación PWA y Manifest** | Abrir en Chrome de PC o móvil. Presionar "Instalar Colonia Alerta". | Chrome debe reconocer el `manifest.json` e instalar un WebAPK en móvil o atajo en PC. | Aparece prompt de instalación y se agrega la app al Dock/Inicio. | ✅ Aprobado |
| **P8: Permisos de Notificaciones** | Enviar el reporte online o recuperar red. | Requiere pedir autorización al navegador. Si se acepta, muestra globo nativo con icono. | Dispara API `new Notification()` y vibración exitosa `navigator.vibrate()`. | ✅ Aprobado |
