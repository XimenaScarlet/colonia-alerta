import Dexie, { type EntityTable } from 'dexie';

export interface IncidentReport {
  id?: number;
  serverId?: string;
  clientSideId?: string; // ID único generado en el cliente para de-duplicación
  title: string;
  description: string;
  category: string;
  municipio: string;
  colonia: string;
  lat: number;
  lng: number;
  datetime: string;
  photoUrl?: string;
  priority: 'Baja' | 'Media' | 'Alta';
  status: 'Pendiente' | 'En Proceso' | 'Resuelto';
  synced: boolean;
  createdBy?: string;
}

const db = new Dexie('ColoniaAlertaDB') as Dexie & {
  reports: EntityTable<IncidentReport, 'id'> ;
};

db.version(2).stores({
  reports: '++id, serverId, clientSideId, category, municipio, colonia, status, synced, createdBy' // Primary key and indexed props
});

export { db };
