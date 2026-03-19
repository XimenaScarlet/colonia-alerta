const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    const svgPath = path.join(__dirname, 'public/icons/icon.svg');
    
    // Generar icono 192x192
    await sharp(svgPath)
      .resize(192, 192, { fit: 'contain', background: { r: 14, g: 165, b: 233, alpha: 1 } })
      .png()
      .toFile(path.join(__dirname, 'public/icons/icon-192x192.png'));
    console.log('✅ Creado: public/icons/icon-192x192.png');

    // Generar icono 512x512
    await sharp(svgPath)
      .resize(512, 512, { fit: 'contain', background: { r: 14, g: 165, b: 233, alpha: 1 } })
      .png()
      .toFile(path.join(__dirname, 'public/icons/icon-512x512.png'));
    console.log('✅ Creado: public/icons/icon-512x512.png');

    console.log('✅ Todos los iconos generados correctamente');
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
    process.exit(1);
  }
}

generateIcons();
