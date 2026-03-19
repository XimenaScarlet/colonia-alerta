import { prisma } from '@/lib/prisma';
import { StatisticsWithOfflineReports } from './StatisticsWithOfflineReports';

export const dynamic = 'force-dynamic';

async function getStatistics() {
  try {
    const total = await prisma.report.count();
    const resolved = await prisma.report.count({ where: { status: 'Resuelto' } });
    const pending = await prisma.report.count({ where: { status: 'Pendiente' } });
    const inProgress = await prisma.report.count({ where: { status: 'En Proceso' } });

    const byCategory = await prisma.report.groupBy({
      by: ['category'],
      _count: true,
    });

    const byMunicipio = await prisma.report.groupBy({
      by: ['municipio'],
      _count: true,
    });

    const byColonia = await prisma.report.groupBy({
      by: ['colonia'],
      _count: true,
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    });

    return {
      total,
      resolved,
      pending,
      inProgress,
      percentageResolved: total > 0 ? Math.round((resolved / total) * 100) : 0,
      byCategory,
      byMunicipio,
      byColonia,
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return {
      total: 0,
      resolved: 0,
      pending: 0,
      inProgress: 0,
      percentageResolved: 0,
      byCategory: [],
      byMunicipio: [],
      byColonia: [],
    };
  }
}

export default async function EstadisticasPage() {
  const stats = await getStatistics();
  return <StatisticsWithOfflineReports serverStats={stats} />;
}
