'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Camera, MapPin, Send, Loader } from 'lucide-react';
import { db } from '@/lib/db';
import { reportService, notificationService } from '@/lib/api-client';

export default function CreateReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Redirigir a login si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/reportar');
    }
  }, [status, router]);

  // Mostrar loading mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión, no renderizar nada (ya redirigió)
  if (!session) {
    return null;
  }
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    municipio: 'Saltillo',
    colonia: '',
    priority: 'Media' as const,
    lat: 0,
    lng: 0,
  });

  const [locationDisplay, setLocationDisplay] = useState('No establecida');

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setGeoLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData(prev => ({
            ...prev,
            lat,
            lng
          }));
          setLocationDisplay(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setGeoLoading(false);
          notificationService.sendLocationObtained(lat, lng);
        },
        (error) => {
          console.error(error);
          setGeoLoading(false);
          notificationService.sendError('Ubicación No Disponible', 'Por favor verifica los permisos de geolocalización');
          alert('No se pudo obtener la ubicación. Por favor, verifica los permisos de geolocalización.');
        }
      );
    }
  };

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192x192.png' });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/icons/icon-192x192.png' });
        }
      });
    }
    
    // Vibración si es soportado
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.title.trim()) {
      alert('Por favor ingresa un título');
      return;
    }
    if (!formData.category) {
      alert('Por favor selecciona una categoría');
      return;
    }
    if (!formData.colonia.trim()) {
      alert('Por favor ingresa la colonia');
      return;
    }
    if (!formData.description.trim()) {
      alert('Por favor ingresa una descripción');
      return;
    }
    if (formData.lat === 0 || formData.lng === 0) {
      alert('Por favor establece una ubicación');
      return;
    }

    setLoading(true);

    try {
      const isOnline = navigator.onLine;

      // Preparar datos del reporte
      const reportData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        municipio: formData.municipio,
        colonia: formData.colonia,
        lat: formData.lat,
        lng: formData.lng,
        priority: formData.priority,
        photoB64: photoPreview || undefined,
      };

      let savedReport: any = null;

      if (isOnline) {
        // Si hay conexión, enviar a BD directamente
        try {
          const response = await reportService.createReport(reportData);
          if (response.success) {
            savedReport = response.data;
            
            // También guardar en Dexie para sincronización rápida
            await db.reports.add({
              ...formData,
              photoUrl: photoPreview || undefined,
              datetime: new Date().toISOString(),
              status: 'Pendiente',
              synced: true
            });

            notificationService.sendReportCreated(formData.title, formData.category, formData.colonia);
          } else {
            throw new Error(response.error || 'Error al crear reporte');
          }
        } catch (error) {
          console.error('Error saving to API:', error);
          // Fallback a Dexie si falla API
          await db.reports.add({
            ...formData,
            photoUrl: photoPreview || undefined,
            datetime: new Date().toISOString(),
            status: 'Pendiente',
            synced: false
          });
          notificationService.sendReportSaved(formData.category, true);
        }
      } else {
        // Sin conexión, guardar en Dexie
        await db.reports.add({
          ...formData,
          photoUrl: photoPreview || undefined,
          datetime: new Date().toISOString(),
          status: 'Pendiente',
          synced: false
        });

        notificationService.sendReportSaved(formData.category, true);
      }

      router.push('/reportes');
    } catch (error) {
      console.error('Error al guardar reporte:', error);
      alert('Hubo un problema al guardar el reporte. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-2xl shadow-sm my-4 border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Foto (Uso de Hardware) */}
        <div className="flex flex-col items-center justify-center w-full">
          {photoPreview ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-2">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full text-xl hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sky-300 border-dashed rounded-xl cursor-pointer bg-sky-50 hover:bg-sky-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Camera className="w-8 h-8 mb-2 text-sky-500" />
                <p className="text-sm text-sky-600 font-medium">Tomar o subir foto (opcional)</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handlePhotoCapture}
              />
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título del Reporte *</label>
          <input 
            type="text" 
            required 
            placeholder="Ej. Bache profundo en calle principal"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
          <select 
            required
            className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 outline-none"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          >
            <option value="">Selecciona una categoría</option>
            <option value="Bache">🕳️ Bache</option>
            <option value="Luminaria Dañada">💡 Luminaria Dañada</option>
            <option value="Basura Acumulada">🗑️ Basura Acumulada</option>
            <option value="Fuga de Agua">💧 Fuga de Agua</option>
            <option value="Inseguridad">⚠️ Inseguridad</option>
            <option value="Otro">📍 Otro</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio *</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
              value={formData.municipio}
              onChange={e => setFormData({...formData, municipio: e.target.value})}
            >
              <option value="Saltillo">Saltillo</option>
              <option value="Ramos Arizpe">Ramos Arizpe</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colonia *</label>
            <input 
              type="text" 
              required 
              placeholder="Ej. Mirasierra"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              value={formData.colonia}
              onChange={e => setFormData({...formData, colonia: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
          <textarea 
            required
            rows={3}
            placeholder="Describe el problema detalladamente..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none resize-none"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            value={formData.priority}
            onChange={e => setFormData({...formData, priority: e.target.value as any})}
          >
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        {/* Geolocalización Mejorada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación (GPS) *</label>
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  📍 {locationDisplay}
                </p>
                {formData.lat !== 0 && (
                  <p className="text-xs text-green-600 mt-1">✓ Ubicación confirmada</p>
                )}
              </div>
            </div>
            
            <button 
              type="button"
              onClick={getLocation}
              disabled={geoLoading}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white px-4 py-3 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-70 font-medium"
            >
              {geoLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  Usar Mi Ubicación Actual
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Necesitas permitir acceso a ubicación en tu navegador
            </p>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 p-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-70 mt-6"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Enviando...
            </>
          ) : (
            <>
              <Send size={20} />
              Enviar Reporte
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-2">
          Los campos con * son obligatorios
        </p>
      </form>
    </div>
  );
}
