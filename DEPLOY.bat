@echo off
REM Script de Deployment para Colonia Alerta PWA
REM Este script prepara el proyecto para despliegue

echo.
echo ===============================================
echo    COLONIA ALERTA - Script de Deployment
echo ===============================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ERROR: No estamos en el directorio correcto
    echo Por favor, execute este script desde la raiz del proyecto
    pause
    exit /b 1
)

echo [1/5] Verificando estado del repositorio...
git status

echo.
echo [2/5] Compilando proyecto...
npm run build

if errorlevel 1 (
    echo ERROR: La compilacion fallo
    pause
    exit /b 1
)

echo.
echo [3/5] Limpiando archivos temporales...
del /q *.log
del /q build.log

echo.
echo ===============================================
echo    SIGUIENTE: Despliegue en la Nube
echo ===============================================
echo.
echo Elige una opcion:
echo.
echo   1) VERCEL (Recomendado)
echo   2) RAILWAY
echo   3) RENDER
echo.
echo.
echo OPCION 1: VERCEL
echo ============════
echo   a) Ir a: https://vercel.com/signup
echo   b) Conectar con GitHub (crear repo primero)
echo   c) Importar este repositorio
echo   d) Deploy automatico (2-3 minutos)
echo.
echo OPCION 2: RAILWAY
echo ════════════════
echo   a) Ir a: https://railway.app
echo   b) Conectar GitHub
echo   c) New Project - Deploy from GitHub
echo   d) Esperar deployment automatico
echo.
echo OPCION 3: RENDER
echo ═════════════════
echo   a) Ir a: https://render.com
echo   b) New - Web Service
echo   c) Connect GitHub
echo   d) Configurar build y deploy
echo.
echo.
echo PASOS PARA CUALQUIER OPCION:
echo ══════════════════════════════
echo.
echo 1. Crear repositorio en GitHub
echo    - Ir a: https://github.com/new
echo    - Nombre: colonia-alerta
echo    - Hacer publico
echo.
echo 2. Conectar repositorio local
echo    - Abre PowerShell/Command Prompt
echo    - git remote add origin https://github.com/TUUSUARIO/colonia-alerta.git
echo    - git branch -M main
echo    - git push -u origin main
echo.
echo 3. Desplegar (ver opcion elegida arriba)
echo.
echo.
echo ¡LISTO PARA DESPLIEGUE!
echo.

pause
