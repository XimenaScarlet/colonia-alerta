import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
    const session = await getServerSession(authOptions);
    const { id } = await context.params;
    const body = await request.json();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    // Obtener el reporte actual
    const currentReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!currentReport) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Validar permisos: solo admin o creador del reporte
    const isAdmin = session.user.role === 'admin';
    const isCreator = currentReport.createdBy === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para editar este reporte' },
        { status: 403 }
      );
    }

    // Si no es admin y está intentando cambiar estado, no permitir
    if (!isAdmin && body.status) {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden cambiar el estado de reportes' },
        { status: 403 }
      );
    }

    // Construir datos de actualización
    const updateData: any = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.municipio !== undefined) updateData.municipio = body.municipio;
    if (body.colonia !== undefined) updateData.colonia = body.colonia;
    if (body.lat !== undefined) updateData.lat = body.lat;
    if (body.lng !== undefined) updateData.lng = body.lng;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;

    // Registrar fecha de resolución si cambia a Resuelto (solo admin)
    if (isAdmin && body.status === 'Resuelto' && !currentReport.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const report = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

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
    const session = await getServerSession(authOptions);
    const { id } = await context.params;

    // Validar autenticación
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }

    // Obtener el reporte actual
    const currentReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!currentReport) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Validar permisos: solo admin o creador del reporte
    const isAdmin = session.user.role === 'admin';
    const isCreator = currentReport.createdBy === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar este reporte' },
        { status: 403 }
      );
    }

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
