'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Camera, MapPin, Send, Loader, Check } from 'lucide-react';
import { db } from '@/lib/db';
import { reportService, notificationService, userService } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export default function CreateReportPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
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
  
  // Solo cargar página si está autenticado
  useEffect(() => {
    if (status === 'authenticated') {
      setPageLoading(false);
    }
  }, [status]);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700 shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-gray-700">
            <Send className="w-10 h-10 text-blue-400 -rotate-12" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Acceso Requerido</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Para mantér nuestra comunidad segura y confiable, es necesario iniciar sesión para realizar reportes.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/login?callbackUrl=/reportar')}
              className="w-full bg-blue-500 hover:bg-blue-600 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 text-lg"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => router.push('/auth/register?callbackUrl=/reportar')}
              className="w-full bg-gray-700 hover:bg-gray-600 font-semibold py-4 rounded-2xl transition-all border border-gray-600"
            >
              Crear Cuenta Nueva
            </button>
            <button
              onClick={() => router.push('/mapa')}
              className="w-full text-gray-500 hover:text-gray-300 text-sm font-medium pt-2"
            >
              Volver al Mapa
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          console.error('Geo Error:', error);
          setGeoLoading(false);
          let msg = 'No se pudo obtener la ubicación.';
          if (error.code === 1) msg = 'Permiso de ubicación denegado.';
          if (error.code === 3) msg = 'Tiempo de espera agotado (GPS lento). intenta de nuevo.';
          
          notificationService.sendError('Ubicación No Disponible', msg);
          alert(msg);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
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
      };

      if (editId) {
        // Modo edición
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
        // Modo creación
        if (isOnline) {
          // Si hay conexión, enviar a BD directamente
          try {
            console.log('Enviando reporte al API:', reportData);
            const response = await reportService.createReport(reportData);
            console.log('Respuesta del API:', response);
            
            if (response.success) {
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
            // Fallback a Dexie si falla API aunque estemos online
            await db.reports.add({
              ...reportData,
              datetime: new Date().toISOString(),
              status: 'Pendiente',
              synced: false,
              createdBy: session?.user?.id || userService.getUserId()
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
            ...reportData,
            datetime: new Date().toISOString(),
            status: 'Pendiente',
            synced: false,
            createdBy: session?.user?.id || userService.getUserId()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24 text-white">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8 pt-4">
          <h1 className="text-4xl font-bold text-white mb-2">{editId ? 'Editar Reporte' : 'Nuevo Reporte'}</h1>
          <p className="text-gray-400">
            {editId 
              ? 'Actualiza los detalles de tu reporte' 
              : 'Comparte lo que sucede en tu colonia para que la comunidad y las autoridades estén al tanto.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* CATEGORÍA DEL INCIDENTE */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">Categoría del Incidente</h3>
            <select 
              required
              className="w-full p-4 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-base appearance-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="" className="bg-gray-900">Selecciona categoría</option>
              <option value="Bache" className="bg-gray-900">🕳️ Bache</option>
              <option value="Luminaria Dañada" className="bg-gray-900">💡 Luminaria Dañada</option>
              <option value="Basura Acumulada" className="bg-gray-900">🗑️ Basura Acumulada</option>
              <option value="Fuga de Agua" className="bg-gray-900">💧 Fuga de Agua</option>
              <option value="Inseguridad" className="bg-gray-900">⚠️ Inseguridad</option>
              <option value="Otro" className="bg-gray-900">📍 Otro</option>
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
              rows={4}
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
              <p className="text-xs text-gray-500 font-medium mb-1">Ubicación actual estimada</p>
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
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Obtener GPS
                </>
              )}
            </button>
          </div>

          {/* Información Adicional */}
          <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="text-blue-400 flex-shrink-0">ℹ️</div>
            <p className="text-xs text-blue-300">Su reporte será validado por la comunidad antes de ser enviado a las autoridades correspondientes.</p>
          </div>

          {/* Botón Enviar Reporte */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 disabled:shadow-none flex items-center justify-center gap-2 text-lg mb-8"
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
        </form>
      </div>

      {/* Modal Success */}
      {submitted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="text-center bg-gray-900 rounded-3xl p-10 border border-green-500/30 max-w-sm mx-4 transform animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-4 border-green-500/30">
                <Check className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">¡Completado!</h2>
            <p className="text-gray-400">Tu reporte ha sido registrado exitosamente.</p>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-8 overflow-hidden">
               <div className="bg-green-500 h-full animate-progress-fast"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

