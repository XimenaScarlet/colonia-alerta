# 5. Guía de Publicación (Vercel)

El proyecto está diseñado usando Next.js, por lo que su ecosistema nativo de despliegue principal (y más sencillo de justificar en la universidad) es **Vercel** o alternativamente **Firebase Hosting**. Abajo las instrucciones exactas para Vercel.

## Requisitos Previos
Tener una cuenta gratuita en [Vercel](https://vercel.com/) ligada a tu GitHub y tener el código del proyecto subido a un repositorio.

## Pasos de Despliegue
1. Entra a Vercel con tu cuenta escolar o personal.
2. Pulsa el botón **"Add New..."** -> **"Project"**
3. Importa el repositorio donde subiste `colonia-alerta`.
4. En el panel de configuración (Build and Output Settings), Vercel detectará Next.js automáticamente y rellenará los comandos. Verifica que estén así:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (o `npm run build`)
   - **Install Command**: `npm install`
5. Pulsa el botón **Deploy**.
6. Espera unos minutos mientras Vercel procesa el empaquetado y genera el Service Worker gracias a `next-pwa`.
7. **Obtener URL**: Al terminar, Vercel mostrará el link con el formato parecido a: `https://colonia-alerta.vercel.app`.

## Comandos Útiles (Por si se evalúa localmente)
- **Instalar**: `npm install`
- **Compilación de Producción**: `npm run build`
- **Correr Servidor de Producción**: `npm run start` (Esto simula exactamente el ambiente publicado, importante para probar SSR y el caché del Service Worker PWA).

La URL esperada en el reporte final para el profesor debe ser la originada al terminar el paso 7.
