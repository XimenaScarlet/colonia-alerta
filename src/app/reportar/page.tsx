'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Camera, MapPin, Send, Loader, Check } from 'lucide-react';
import { db } from '@/lib/db';
import { reportService, notificationService } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export default function CreateReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Media' as const,
    lat: 0,
    lng: 0,
  });
  const [locationDisplay, setLocationDisplay] = useState('No establecida');
  
  // Redirigir a login si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/reportar');
    } else if (status === 'authenticated') {
      // Una vez autenticado, marcar que ya no está cargando
      setPageLoading(false);
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return null;
  }

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
          const locationStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setLocationDisplay(locationStr);
          // Guardar en localStorage para reutilizar
          localStorage.setItem('savedLocation', JSON.stringify({ lat, lng, timestamp: new Date().getTime() }));
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

  // Cargar ubicación guardada al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savedLocation');
      if (saved) {
        try {
          const { lat, lng } = JSON.parse(saved);
          setFormData(prev => ({ ...prev, lat, lng }));
          setLocationDisplay(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } catch (e) {
          console.log('Error loading saved location');
        }
      }
      
      // Cargar reporte si está en modo edición
      const searchParams = new URLSearchParams(window.location.search);
      const edit = searchParams.get('edit');
      if (edit) {
        setEditId(edit);
        loadReportForEditing(edit);
      }
    }
  }, []);

  const loadReportForEditing = async (reportId: string) => {
    try {
      const response = await reportService.getReport(reportId);
      if (response.success) {
        const report = response.data;
        setFormData({
          title: report.title,
          description: report.description,
          category: report.category,
          priority: report.priority,
          lat: report.lat,
          lng: report.lng,
        });
        setLocationDisplay(`${report.lat.toFixed(6)}, ${report.lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      alert('No se pudo cargar el reporte');
      router.push('/mapa');
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
        municipio: 'Saltillo',
        colonia: '',
        lat: formData.lat,
        lng: formData.lng,
        priority: formData.priority,
        photoB64: photoPreview || undefined,
      };

      let savedReport: any = null;

      if (editId) {
        // Modo edición: actualizar reporte existente
        try {
          const response = await reportService.updateReport(editId, reportData);
          if (response.success) {
            setSubmitted(true);
            setTimeout(() => {
              router.push('/mapa');
            }, 1500);
          } else {
            throw new Error(response.error || 'Error al actualizar reporte');
          }
        } catch (error) {
          console.error('Error updating report:', error);
          alert('Error al actualizar reporte. Intenta nuevamente.');
        }
      } else {
        // Modo creación: crear nuevo reporte
        if (isOnline) {
          // Si hay conexión, enviar a BD directamente
          try {
            console.log('Enviando reporte al API:', reportData);
            const response = await reportService.createReport(reportData);
            console.log('Respuesta del API:', response);
            
            if (response.success) {
              savedReport = response.data;
              
              // También guardar en Dexie para sincronización rápida
              await db.reports.add({
                title: formData.title,
                description: formData.description,
                category: formData.category,
                municipio: 'Saltillo',
                colonia: '',
                lat: formData.lat,
                lng: formData.lng,
                priority: formData.priority,
                photoUrl: photoPreview || undefined,
                datetime: new Date().toISOString(),
                status: 'Pendiente',
                synced: true
              });

              notificationService.sendReportCreated(formData.title, formData.category, '');
              setSubmitted(true);
              setTimeout(() => {
                router.push('/reportes');
              }, 1500);
            } else {
              throw new Error(response.error || 'Error al crear reporte');
            }
          } catch (error) {
            console.error('Error saving to API:', error);
            // Mostrar error detallado al usuario
            alert(`Error al crear reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            setLoading(false);
            // Fallback a Dexie si falla API
            await db.reports.add({
              title: formData.title,
              description: formData.description,
              category: formData.category,
              municipio: 'Saltillo',
              colonia: '',
              lat: formData.lat,
              lng: formData.lng,
              priority: formData.priority,
              photoUrl: photoPreview || undefined,
              datetime: new Date().toISOString(),
              status: 'Pendiente',
              synced: false
            });
            notificationService.sendReportSaved(formData.category, true);
            setSubmitted(true);
            setTimeout(() => {
              router.push('/reportes');
            }, 1500);
          }
        } else {
          // Sin conexión, guardar en Dexie
          await db.reports.add({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            municipio: 'Saltillo',
            colonia: '',
            lat: formData.lat,
            lng: formData.lng,
            priority: formData.priority,
            photoUrl: photoPreview || undefined,
            datetime: new Date().toISOString(),
            status: 'Pendiente',
            synced: false
          });

          notificationService.sendReportSaved(formData.category, true);
          setSubmitted(true);
          setTimeout(() => {
            router.push('/reportes');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error al guardar reporte:', error);
      alert('Hubo un problema al guardar el reporte. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8 pt-4">
          <h1 className="text-4xl font-bold text-white mb-2">{editId ? 'Editar Reporte' : 'Nuevo Reporte'}</h1>
          <p className="text-gray-400">{editId ? 'Actualiza los detalles de tu reporte' : 'Su voz es el primer paso para mejorar nuestra comunidad. Complete los detalles a continuación para informar una incidencia de manera precisa.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA - EVIDENCIA VISUAL */}
          <div>
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 sticky top-20">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Evidencia Visual</h3>
              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-900 aspect-square md:aspect-auto md:h-96">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white p-2.5 rounded-full backdrop-blur-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-xl cursor-pointer bg-gray-900/50 border-2 border-dashed border-gray-600 hover:border-blue-500/50 transition-all group aspect-square md:aspect-auto md:h-96">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-blue-500/10 p-4 rounded-xl mb-3 group-hover:bg-blue-500/20 transition-colors">
                      <Camera className="w-10 h-10 text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-300 font-medium">Subir foto o vídeo</p>
                    <p className="text-xs text-gray-500 mt-1">Arrastra o haz clic</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,video/*" 
                    capture="environment" 
                    onChange={handlePhotoCapture}
                  />
                </label>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA - DATOS */}
          <div className="space-y-6">
            
            {/* CATEGORÍA DEL INCIDENTE */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Categoría del Incidente</h3>
              <select 
                required
                className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Infraestructura Vial</option>
                <option value="Bache">🕳️ Bache</option>
                <option value="Luminaria Dañada">💡 Luminaria Dañada</option>
                <option value="Basura Acumulada">🗑️ Basura Acumulada</option>
                <option value="Fuga de Agua">💧 Fuga de Agua</option>
                <option value="Inseguridad">⚠️ Inseguridad</option>
                <option value="Otro">📍 Otro</option>
              </select>
            </div>

            {/* TÍTULO BREVE */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Título Breve</h3>
              <input 
                type="text" 
                required 
                placeholder="Ej: Socavón en Calle Principal"
                className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            {/* DESCRIPCIÓN DETALLADA */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Descripción Detallada</h3>
              <textarea 
                required
                rows={2}
                placeholder="Describe lo que está ocurriendo..."
                className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* UBICACIÓN DEL SUCESO */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Ubicación del Suceso</h3>
              
              <div className="bg-gray-900/50 rounded-lg p-4 mb-4 border border-gray-600">
                <p className="text-xs text-gray-500 font-medium mb-1">Ubicación actual</p>
                <p className="text-gray-100 font-mono text-sm">{locationDisplay}</p>
              </div>

              {/* Botón GPS */}
              <button
                type="button"
                onClick={getLocation}
                disabled={geoLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-lg text-blue-400 font-medium transition-colors disabled:opacity-50"
              >
                {geoLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Obtener ubicación...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Prescrigar GPS
                  </>
                )}
              </button>
            </div>

            {/* Su reporte será validado... */}
            <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="text-blue-400 flex-shrink-0">ℹ️</div>
              <p className="text-xs text-blue-300">Su reporte será validado por la comunidad antes de ser enviado a las autoridades.</p>
            </div>

            {/* Botón Enviar Reporte */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:shadow-none flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {editId ? 'Actualizando...' : 'Enviando Reporte...'}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {editId ? 'Actualizar Reporte' : 'Enviar Reporte'}
                </>
              )}
            </button>
          </div>

        </form>
      </div>

      {submitted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="text-center bg-gray-900 rounded-2xl p-8 border border-green-500/30 max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Reporte Enviado!</h2>
            <p className="text-gray-400">Tu reporte ha sido registrado exitosamente.</p>
            <p className="text-sm text-gray-500 mt-4">Redirigiendo...</p>
          </div>
        </div>
      )}
    </div>
  );
}

