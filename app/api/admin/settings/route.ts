import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // In a real application, you would store these settings in the database
    // For now, we'll just return success
    // Example: await prisma.systemSettings.upsert({ ... })

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
