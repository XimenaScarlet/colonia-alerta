import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('createdBy');

    let where: any = {};
    if (createdBy) {
      where.createdBy = createdBy;
    }

    const count = await prisma.report.count({ where });

    return NextResponse.json({
      success: true,
      count,
      userId: createdBy,
    });
  } catch (error) {
    console.error('Error counting reports:', error);
    return NextResponse.json(
      { success: false, error: 'Error al contar reportes' },
      { status: 500 }
    );
  }
}
