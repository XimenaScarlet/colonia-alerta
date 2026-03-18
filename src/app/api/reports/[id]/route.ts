import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener reporte' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Obtener el reporte actual para comparar estados
    const currentReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!currentReport) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        status: body.status,
        // Registrar fecha de resolución si cambia a Resuelto
        ...(body.status === 'Resuelto' && !currentReport.resolvedAt && { resolvedAt: new Date() }),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Incluir información sobre el cambio para notificaciones
    const statusChanged = currentReport.status !== body.status;

    return NextResponse.json({
      success: true,
      data: report,
      statusChanged,
      previousStatus: currentReport.status,
      newStatus: body.status,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar reporte' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Reporte eliminado',
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar reporte' },
      { status: 500 }
    );
  }
}
