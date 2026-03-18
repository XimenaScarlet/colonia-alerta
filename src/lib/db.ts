import Dexie, { type EntityTable } from 'dexie';

export interface Report {
  id?: number;
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
}

const db = new Dexie('ColoniaAlertaDB') as Dexie & {
  reports: EntityTable<Report, 'id'>;
};

db.version(1).stores({
  reports: '++id, category, municipio, colonia, status, synced' // Primary key and indexed props
});

export { db };
