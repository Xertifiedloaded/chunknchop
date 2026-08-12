import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';
import { LocationType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locations = await prisma.storageLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true },
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type } = await request.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    if (!type || !Object.values(LocationType).includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${Object.values(LocationType).join(', ')}` },
        { status: 400 }
      );
    }

    const location = await prisma.storageLocation.create({
      data: { name: name.trim(), type },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A location with this name already exists' }, { status: 409 });
    }

    console.error('Error creating location:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
