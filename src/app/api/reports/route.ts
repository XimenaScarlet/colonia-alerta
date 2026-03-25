import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const municipio = searchParams.get('municipio');
    const colonia = searchParams.get('colonia');
    const createdBy = searchParams.get('createdBy');

    // Construir filtros
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (municipio) where.municipio = municipio;
    if (colonia) where.colonia = colonia;
    if (createdBy) where.createdBy = createdBy;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión del usuario
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión para crear un reporte' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      clientSideId,
      title,
      description,
      category,
      municipio,
      colonia,
      lat,
      lng,
      priority,
      photoB64,
    } = body;

    // Validaciones básicas
    if (!title || !description || !category || !municipio) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validación de longitud (5 a 400 caracteres)
    if (title.length < 5 || title.length > 400) {
      return NextResponse.json(
        { success: false, error: 'El título debe tener entre 5 y 400 caracteres' },
        { status: 400 }
      );
    }

    if (description.length < 5 || description.length > 400) {
      return NextResponse.json(
        { success: false, error: 'La descripción debe tener entre 5 y 400 caracteres' },
        { status: 400 }
      );
    }

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: 'Ubicación no proporcionada' },
        { status: 400 }
      );
    }

    // DE-DUPLICACIÓN: Si viene un clientSideId, verificar si ya existe
    if (clientSideId) {
      const existingReport = await prisma.report.findUnique({
        where: { clientSideId }
      });
      
      if (existingReport) {
        console.log('Reporte duplicado detectado (clientSideId):', clientSideId);
        return NextResponse.json({
          success: true,
          data: existingReport,
          duplicated: true
        });
      }
    }

    const report = await prisma.report.create({
      data: {
        clientSideId,
        title,
        description,
        category,
        municipio,
        colonia: colonia || '',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        priority: priority || 'Media',
        status: 'Pendiente',
        photoB64,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear reporte' },
      { status: 500 }
    );
  }
}
