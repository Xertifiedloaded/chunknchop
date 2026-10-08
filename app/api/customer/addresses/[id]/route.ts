import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const address = await prisma.address.findUnique({
      where: { id: params.id },
    });

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: {
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        street: data.street,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country || 'USA',
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Address update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const address = await prisma.address.findUnique({
      where: { id: params.id },
    });

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Address delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
