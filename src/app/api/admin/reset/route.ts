import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // ELIMINA TODOS LOS REPORTES
    const result = await prisma.report.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: 'Base de datos de reportes limpiada con éxito.',
      deletedCount: result.count 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
