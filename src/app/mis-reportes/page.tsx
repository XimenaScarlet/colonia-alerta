'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { WifiOff, CheckCircle, Clock } from 'lucide-react';

export default function MisReportesPage() {
  const [filter, setFilter] = useState('Todos');
  
  const reports = useLiveQuery(
    () => db.reports.reverse().sortBy('datetime'),
    []
  );

  if (!reports) return <div className="p-8 text-center text-gray-500">Cargando reportes...</div>;

  const filteredReports = reports.filter(r => filter === 'Todos' || r.status === filter);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mis Reportes</h2>
        <select 
          className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium outline-none"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="Todos">Todos</option>
          <option value="Pendiente">Pendientes</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Resuelto">Resueltos</option>
        </select>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center bg-gray-50 rounded-2xl p-8 border border-gray-100 mt-4">
          <p className="text-gray-500">No tienes reportes en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-1 rounded">
                  {report.category}
                </span>
                
                {report.status === 'Pendiente' && <span className="flex items-center gap-1 text-xs font-medium text-orange-600"><Clock size={12}/> Pendiente</span>}
                {report.status === 'En Proceso' && <span className="flex items-center gap-1 text-xs font-medium text-blue-600"><Clock size={12}/> En Proceso</span>}
                {report.status === 'Resuelto' && <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle size={12}/> Resuelto</span>}
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1">{report.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{report.description}</p>
              
              <div className="flex justify-between items-end border-t border-gray-50 pt-3 mt-2">
                <div className="text-xs text-gray-400">
                  {new Date(report.datetime).toLocaleDateString()} • {report.colonia}
                </div>
                {!report.synced ? (
                  <div className="flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-md">
                    <WifiOff size={12} />
                    <span>Local</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                    <CheckCircle size={12} />
                    <span>Sincronizado</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
