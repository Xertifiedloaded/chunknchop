import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/request';

export async function GET(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: authUser.id,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return NextResponse.json({
      addresses: addresses.map((address) => ({
        id: address.id,
        label: address.label,
        fullName: address.name,
        address: address.address,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        phone: address.phone,
        country: address.country,
        isDefault: address.isDefault,
      })),
    });
  } catch (error) {
    console.error('GET /api/customer/addresses:', error);

    return NextResponse.json({ error: 'Failed to load addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getUserFromRequest(request);

    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { label, fullName, address, city, state, zipCode, phone, country = 'Nigeria', isDefault = false } = body;

    if (!label?.trim() || !fullName?.trim() || !address?.trim() || !city?.trim() || !state?.trim() || !zipCode?.trim() || !phone?.trim()) {
      return NextResponse.json(
        {
          error: 'Label, full name, address, city, state, ZIP code and phone are required',
        },
        { status: 400 }
      );
    }

    const addressData = {
      userId: authUser.id,
      label: label.trim(),
      name: fullName.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      phone: phone.trim(),
      country: country.trim(),
      isDefault: Boolean(isDefault),
    };

    const createdAddress = await prisma.$transaction(async (tx) => {
      /*
       * If this address is going to be the default address,
       * remove default from the user's existing addresses first.
       */
      if (addressData.isDefault) {
        await tx.address.updateMany({
          where: {
            userId: authUser.id,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      /*
       * If this is the user's first address, automatically
       * make it the default.
       */
      const addressCount = await tx.address.count({
        where: {
          userId: authUser.id,
        },
      });

      return tx.address.create({
        data: {
          ...addressData,
          isDefault: addressData.isDefault || addressCount === 0,
        },
      });
    });

    return NextResponse.json(
      {
        address: {
          id: createdAddress.id,
          label: createdAddress.label,
          fullName: createdAddress.name,
          address: createdAddress.address,
          city: createdAddress.city,
          state: createdAddress.state,
          zipCode: createdAddress.zipCode,
          phone: createdAddress.phone,
          country: createdAddress.country,
          isDefault: createdAddress.isDefault,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/customer/addresses:', error);

    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
