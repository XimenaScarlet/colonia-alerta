import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Params {
  id: string;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json().catch(() => ({}));
    
    // El usuario que vota puede ser autenticado o tener un ID local
    const voterId = session?.user?.id || body.localUserId;

    if (!voterId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ID de usuario para votar' },
        { status: 400 }
      );
    }

    const { id } = await context.params;

    // Obtener reporte actual
    const report = await prisma.report.findUnique({
      where: { id },
      select: { upvotes: true, upvotedBy: true, priority: true }
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    // Validar si ya votó
    if (report.upvotedBy.includes(voterId)) {
      return NextResponse.json(
        { success: false, error: 'Ya has apoyado este reporte' },
        { status: 400 }
      );
    }

    // Calcular nueva prioridad (Subir a "Alta" si llega a 10 votos)
    const newUpvotes = report.upvotes + 1;
    const shouldUpgradePriority = newUpvotes >= 10 && report.priority !== 'Alta';

    // Actualizar reporte
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        upvotes: { increment: 1 },
        upvotedBy: { push: voterId },
        ...(shouldUpgradePriority && { priority: 'Alta' })
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedReport,
      priorityUpgraded: shouldUpgradePriority
    });

  } catch (error) {
    console.error('Error upvoting report:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar el voto' },
      { status: 500 }
    );
  }
}
