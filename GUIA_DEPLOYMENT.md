# 🚀 GUÍA DE DESPLIEGUE - COLONIA ALERTA PWA

## Opción 1: Despliegue en VERCEL (Recomendado - Más simple con Next.js)

### Paso 1: Preparar el Repositorio en GitHub

```bash
# 1. Ir a https://github.com/new
# 2. Crear nuevo repositorio llamado: colonia-alerta
# 3. NO inicializar con README (ya lo tenemos)
# 4. Copiar el URL del repositorio

# 5. En tu terminal local:
cd c:\Users\scarl\OneDrive\Escritorio\AZU\colonia-alerta
git remote add origin https://github.com/TU_USUARIO/colonia-alerta.git
git branch -M main
git push -u origin main
```

### Paso 2: Autenticarse en Vercel

1. Visita: **https://vercel.com/signup**
2. Haz clic en "Continue with GitHub"
3. Autoriza Vercel para acceder a tu GitHub

### Paso 3: Importar Proyecto en Vercel

1. Ve a: **https://vercel.com/new**
2. Selecciona "Import Git Repository"
3. Pega la URL de tu repositorio: `https://github.com/TU_USUARIO/colonia-alerta`
4. Haz clic en "Import"

### Paso 4: Configurar Variables de Entorno

En la página de configuración de Vercel, agrega:

```
NEXTAUTH_SECRET = colonia-alerta-pwa-secret-key-2026
NEXTAUTH_URL = https://colonia-alerta-TUUSUARIO.vercel.app
DATABASE_URL = file:./prisma/dev.db
```

### Paso 5: Deploy

1. Haz clic en "Deploy"
2. Espera 2-3 minutos
3. ¡Listo! Tu URL será: `https://colonia-alerta-TUUSUARIO.vercel.app`

**Pros:**
- ✅ Súper fácil (3 clics)
- ✅ Dominio .vercel.app automático
- ✅ HTTPS automático
- ✅ Despliegues automáticos en cada push
- ✅ Mejor rendimiento
- ✅ Soporte prioritario para Next.js

---

## Opción 2: Despliegue en RAILWAY (Alternativa Rápida)

### Paso 1: Preparar GitHub
```bash
# Mismo proceso que arriba
git remote add origin https://github.com/TU_USUARIO/colonia-alerta.git
git push -u origin main
```

### Paso 2: Crear Proyecto en Railway

1. Ve a: **https://railway.app**
2. Haz clic en "Start a new project"
3. Selecciona "Deploy from GitHub" (o "Deploy from Git")
4. Conecta tu repositorio GitHub
5. Selecciona el repositorio: `colonia-alerta`

### Paso 3: Configurar Variables

En Railway, agrega variables de entorno:
```
NODE_ENV=production
NEXTAUTH_SECRET=colonia-alerta-pwa-secret-key-2026
DATABASE_URL=file:./prisma/dev.db
```

### Paso 4: Deploy Automático

Railway desplegará automáticamente. Tu URL será algo como:
`https://colonia-alerta-production-xxxx.railway.app`

**Pros:**
- ✅ Muy rápido
- ✅ Interfaz intuitiva
- ✅ Buen rendimiento
- ✅ Soporte para múltiples lenguajes

---

## Opción 3: Despliegue en RENDER

### Paso 1: Push a GitHub
```bash
git push -u origin main
```

### Paso 2: Conectar Render

1. Ve a: **https://render.com**
2. Haz clic en "New +"
3. Selecciona "Web Service"
4. Conecta tu repositorio GitHub
5. Selecciona: `colonia-alerta`

### Paso 3: Configurar

- **Name:** colonia-alerta
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`

### Paso 4: Variables de Entorno

Agrega:
```
NODE_ENV=production
NEXTAUTH_SECRET=colonia-alerta-pwa-secret-key-2026
```

Haz clic en "Create Web Service"

Tu URL será: `https://colonia-alerta.onrender.com`

---

## Opción 4: Despliegue en NETLIFY

### Paso 1: Push a GitHub
```bash
git push -u origin main
```

### Paso 2: Conectar Netlify

1. Ve a: **https://app.netlify.com**
2. Haz clic en "Add new site"
3. Selecciona "Import an existing project"
4. Elije GitHub y autoriza
5. Selecciona: `colonia-alerta`

### Paso 3: Configurar Build

- **Build command:** `npm run build`
- **Publish directory:** `.next`

### Paso 4: Deploy

Netlify comenzará el despliegue automáticamente

Tu URL será: `https://colonia-alerta-TUUSUARIO.netlify.app`

---

## COMPARATIVA DE PLATAFORMAS

| Plataforma | Facilidad | Rendimiento | Precio | Mejor Para |
|-----------|----------|------------|-------|-----------|
| **Vercel** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Gratis | Next.js |
| **Railway** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Gratis | General |
| **Render** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Gratis | Flexible |
| **Netlify** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Gratis | Estático |

**Recomendación: VERCEL** 🎯 (Optimizado específicamente para Next.js)

---

## PASOS MANUALES - DESPLIEGUE LOCAL

Si prefieres desplegar localmente durante desarrollo:

```bash
# 1. Build de producción
npm run build

# 2. Iniciar servidor
npm run start

# 3. Acceder a la app
# Abre http://localhost:3000 en tu navegador
```

---

## VERIFICACIÓN POST-DESPLIEGUE

Una vez desplegado, verifica que todo funciona:

### Checklist:
- ✅ Splash screen (3 segundos)
- ✅ Home page carga
- ✅ Puedes crear reportes
- ✅ Puedes ver reportes
- ✅ Notificaciones funcionan
- ✅ GPS funciona
- ✅ Cámara funciona
- ✅ Modo offline funciona
- ✅ PWA se puede instalar

### Probar PWA:
1. Abre DevTools (F12)
2. Ve a "Application" → "Manifest"
3. Debes ver tu manifest.json
4. Busca el icono de instalación en la barra de direcciones
5. Haz clic en "Instalar"

---

## DOMINIO PERSONALIZADO (Opcional)

### En Vercel:
1. Ve a "Settings" → "Domains"
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS

### En Railway:
1. Ve a "Settings" → "Custom Domain"
2. Agrega tu dominio
3. Configura los registros DNS

---

## TROUBLESHOOTING

### Error: "Cannot find module 'next'"
```bash
npm install
```

### Error: "Port 3000 already in use"
```bash
# Mata el proceso
taskkill /F /IM node.exe
# O usa otro puerto
npm run start -- -p 3001
```

### Build falla
```bash
# Limpia caché y reinstala
rm -r node_modules
rm package-lock.json
npm install
npm run build
```

### Variables de entorno no funcionan
- Verifica que están en `.env.production`
- Asegúrate en la plataforma están en las variables de Vercel/Railway/etc
- Redeploy después de cambiar variables

---

## MONITOREO POST-DESPLIEGUE

### En Vercel:
- Dashboard mostrará stats de uso
- Logs en "Deployments" → "Build Logs"
- Errores en "Deployments" → "Error Logs"

### En Railway:
- Real-time logs en el dashboard
- Monitoreo de CPU/Memoria
- Alertas automáticas

---

## SIGUIENTE: GitHub Actions para CI/CD (Avanzado)

Si quieres despliegues automáticos en cada push:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@master
```

---

## RESUMEN RÁPIDO 🚀

1. **Push a GitHub:**
   ```bash
   git push -u origin main
   ```

2. **Ir a Vercel → Import → GitHub**

3. **Seleccionar repo**

4. **Deploy** (Automático en ~2 minutos)

5. **Compartir URL:** `https://colonia-alerta-TUUSUARIO.vercel.app`

---

**¿Necesitas ayuda?**
- Docs Vercel: https://vercel.com/docs
- Docs Railway: https://docs.railway.app
- Docs Render: https://render.com/docs
- Community Next.js: https://github.com/vercel/next.js/discussions

---

**Documento generado:** Marzo 18, 2026
**Para:** SABER HACER 3 - PWA Unidad 2
