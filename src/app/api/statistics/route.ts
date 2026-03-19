import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Total de reportes
    const total = await prisma.report.count();

    // Reportes por estado
    const byStatus = await prisma.report.groupBy({
      by: ['status'],
      _count: true,
    });

    // Reportes por categoría
    const byCategory = await prisma.report.groupBy({
      by: ['category'],
      _count: true,
    });

    // Reportes por municipio
    const byMunicipio = await prisma.report.groupBy({
      by: ['municipio'],
      _count: true,
    });

    // Reportes por colonia (top 10)
    const colonias = await prisma.report.groupBy({
      by: ['colonia'],
      _count: true,
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Contar resueltos
    const resolved = await prisma.report.count({
      where: { status: 'Resuelto' },
    });

    // Contar pendientes
    const pending = await prisma.report.count({
      where: { status: 'Pendiente' },
    });

    // Contar en proceso
    const inProgress = await prisma.report.count({
      where: { status: 'En Proceso' },
    });

    // Mapear datos para el frontend
    const statusMap = {
      Pendiente: 0,
      'En Proceso': 0,
      Resuelto: 0,
    };

    byStatus.forEach((item: any) => {
      statusMap[item.status as keyof typeof statusMap] = item._count;
    });

    const categoryMap: Record<string, number> = {};
    byCategory.forEach((item: any) => {
      categoryMap[item.category] = item._count;
    });

    const municipioMap: Record<string, number> = {};
    byMunicipio.forEach((item: any) => {
      municipioMap[item.municipio] = item._count;
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        resolved,
        pending,
        inProgress,
        percentageResolved: total > 0 ? Math.round((resolved / total) * 100) : 0,
        byStatus: statusMap,
        byCategory: categoryMap,
        byMunicipio: municipioMap,
        topColonias: colonias.map((c: any) => ({
          colonia: c.colonia,
          count: c._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
