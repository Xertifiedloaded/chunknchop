import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

type AggregateResult<T> = {
  cursor?: {
    firstBatch?: T[];
  };
};

type DashboardAggregate = {
  totals?: Array<{ count?: number }>;
  paid?: Array<{ count?: number; revenueCents?: number }>;
  statuses?: Array<{ _id: string; count: number }>;
  recent?: Array<Record<string, unknown> & { _id: string }>;
  productSalesAll?: Array<{
    _id: string;
    productId?: string;
    slug?: string;
    name?: string;
    category?: string;
    units?: number;
    revenueCents?: number;
  }>;
  weeklyRevenue?: Array<{
    _id: string;
    revenueCents?: number;
    orderCount?: number;
  }>;
  hourlyOrders?: Array<{ _id: string; count?: number }>;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const LAGOS_TIME_ZONE = 'Africa/Lagos';

function getLagosDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LAGOS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}

function lagosMidnightAsUtcIso(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+01:00`).toISOString();
}

function getWeekRanges(now = new Date()) {
  const todayKey = getLagosDateKey(now);
  const [year, month, day] = todayKey.split('-').map(Number);
  const todayUtc = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (todayUtc.getUTCDay() + 6) % 7;
  const thisMonday = addDays(todayKey, -mondayOffset);
  const previousMonday = addDays(thisMonday, -7);
  const nextMonday = addDays(thisMonday, 7);

  return {
    thisMonday,
    previousMonday,
    nextMonday,
    matchStart: lagosMidnightAsUtcIso(previousMonday),
    matchEnd: lagosMidnightAsUtcIso(nextMonday),
  };
}

function validCategory(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || /^(unknown|uncategorized|n\/?a|null|undefined)$/i.test(normalized)) {
    return null;
  }
  return normalized;
}

function validName(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || /^(unknown|unnamed product|null|undefined)$/i.test(normalized)) {
    return null;
  }
  return normalized;
}

function asNumber(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET() {
  const access = await requireAdminApi();
  if (access.response) return access.response;

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS).toISOString();
    const weekRanges = getWeekRanges(now);
    const todayKey = getLagosDateKey(now);
    const tomorrowKey = addDays(todayKey, 1);
    const todayStart = lagosMidnightAsUtcIso(todayKey);
    const tomorrowStart = lagosMidnightAsUtcIso(tomorrowKey);

    const [users, products, publishedProducts, coupons, aggregate] = await Promise.all([
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.product.count(),
      prisma.product.count({ where: { published: true } }),
      prisma.coupon.count(),
      prisma.$runCommandRaw({
        aggregate: 'StoreOrder',
        pipeline: [
          {
            $facet: {
              totals: [{ $count: 'count' }],
              paid: [
                { $match: { paymentStatus: 'paid' } },
                {
                  $group: {
                    _id: null,
                    count: { $sum: 1 },
                    revenueCents: { $sum: '$subtotalCents' },
                  },
                },
              ],
              statuses: [
                {
                  $group: {
                    _id: { $ifNull: ['$status', 'unknown'] },
                    count: { $sum: 1 },
                  },
                },
              ],
              recent: [
                { $sort: { createdAt: -1 } },
                { $limit: 8 },
                {
                  $project: {
                    _id: 1,
                    customerName: 1,
                    email: 1,
                    status: 1,
                    paymentStatus: 1,
                    subtotalCents: 1,
                    currency: 1,
                    createdAt: 1,
                    items: 1,
                  },
                },
              ],
              productSalesAll: [
                {
                  $match: {
                    paymentStatus: 'paid',
                    createdAt: { $gte: thirtyDaysAgo },
                  },
                },
                { $unwind: '$items' },
                {
                  $group: {
                    _id: {
                      $ifNull: ['$items.productId', { $ifNull: ['$items.slug', '$items.name'] }],
                    },
                    productId: { $first: '$items.productId' },
                    slug: { $first: '$items.slug' },
                    name: { $first: '$items.name' },
                    category: { $first: '$items.category' },
                    units: {
                      $sum: {
                        $convert: {
                          input: '$items.quantity',
                          to: 'long',
                          onError: 0,
                          onNull: 0,
                        },
                      },
                    },
                    revenueCents: {
                      $sum: {
                        $multiply: [
                          {
                            $convert: {
                              input: '$items.priceCents',
                              to: 'long',
                              onError: 0,
                              onNull: 0,
                            },
                          },
                          {
                            $convert: {
                              input: '$items.quantity',
                              to: 'long',
                              onError: 0,
                              onNull: 0,
                            },
                          },
                        ],
                      },
                    },
                  },
                },
                { $sort: { units: -1, revenueCents: -1 } },
              ],
              hourlyOrders: [
                {
                  $match: {
                    createdAt: { $gte: todayStart, $lt: tomorrowStart },
                  },
                },
                {
                  $addFields: {
                    _createdAtDate: {
                      $dateFromString: {
                        dateString: '$createdAt',
                        onError: null,
                        onNull: null,
                      },
                    },
                  },
                },
                { $match: { _createdAtDate: { $ne: null } } },
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: '%H',
                        date: '$_createdAtDate',
                        timezone: LAGOS_TIME_ZONE,
                      },
                    },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
              weeklyRevenue: [
                {
                  $match: {
                    paymentStatus: 'paid',
                    createdAt: {
                      $gte: weekRanges.matchStart,
                      $lt: weekRanges.matchEnd,
                    },
                  },
                },
                {
                  $addFields: {
                    _createdAtDate: {
                      $dateFromString: {
                        dateString: '$createdAt',
                        onError: null,
                        onNull: null,
                      },
                    },
                  },
                },
                { $match: { _createdAtDate: { $ne: null } } },
                {
                  $group: {
                    _id: {
                      $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$_createdAtDate',
                        timezone: LAGOS_TIME_ZONE,
                      },
                    },
                    revenueCents: {
                      $sum: {
                        $convert: {
                          input: '$subtotalCents',
                          to: 'long',
                          onError: 0,
                          onNull: 0,
                        },
                      },
                    },
                    orderCount: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
            },
          },
        ],
        cursor: {},
      }),
    ]);

    const result = (aggregate as unknown as AggregateResult<DashboardAggregate>).cursor
      ?.firstBatch?.[0];

    const paid = result?.paid?.[0];
    const orderCount = result?.totals?.[0]?.count ?? 0;
    const paidOrderCount = paid?.count ?? 0;
    const revenueCents = asNumber(paid?.revenueCents);

    // Some older orders were created before category was copied into each order item.
    // Recover missing/invalid snapshots from the current Product records using productId.
    const rawProductSales = result?.productSalesAll ?? [];
    const productIds = [
      ...new Set(
        rawProductSales
          .map((item) => item.productId)
          .filter((id): id is string => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)),
      ),
    ];
    const productSlugs = [
      ...new Set(
        rawProductSales
          .map((item) => item.slug)
          .filter((slug): slug is string => typeof slug === 'string' && slug.trim().length > 0),
      ),
    ];
    const catalogConditions = [
      ...(productIds.length ? [{ id: { in: productIds } }] : []),
      ...(productSlugs.length ? [{ slug: { in: productSlugs } }] : []),
    ];

    const catalogProducts = catalogConditions.length
      ? await prisma.product.findMany({
          where: { OR: catalogConditions },
          select: { id: true, slug: true, name: true, category: true },
        })
      : [];
    const catalogById = new Map(catalogProducts.map((product) => [product.id, product]));
    const catalogBySlug = new Map(catalogProducts.map((product) => [product.slug, product]));

    const normalizedProductSales = rawProductSales.map((item) => {
      const catalogProduct =
        (item.productId ? catalogById.get(item.productId) : undefined) ??
        (item.slug ? catalogBySlug.get(item.slug) : undefined);
      return {
        productId: item.productId ?? item.slug ?? item._id,
        name: validName(item.name) ?? validName(catalogProduct?.name) ?? 'Unnamed product',
        category:
          validCategory(item.category) ??
          validCategory(catalogProduct?.category) ??
          'Uncategorized',
        units: asNumber(item.units),
        revenueCents: asNumber(item.revenueCents),
      };
    });

    const categoryTotals = new Map<string, { units: number; revenueCents: number }>();
    for (const item of normalizedProductSales) {
      const current = categoryTotals.get(item.category) ?? { units: 0, revenueCents: 0 };
      current.units += item.units;
      current.revenueCents += item.revenueCents;
      categoryTotals.set(item.category, current);
    }

    const categorySales = [...categoryTotals.entries()]
      .map(([category, totals]) => ({ category, ...totals }))
      .sort((a, b) => b.revenueCents - a.revenueCents);

    const topProducts = normalizedProductSales
      .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents)
      .slice(0, 5);

    const weeklyRows = new Map(
      (result?.weeklyRevenue ?? []).map((row) => [
        row._id,
        {
          revenueCents: asNumber(row.revenueCents),
          orderCount: asNumber(row.orderCount),
        },
      ]),
    );

    const weeklyDays = Array.from({ length: 7 }, (_, index) => {
      const thisDate = addDays(weekRanges.thisMonday, index);
      const lastDate = addDays(weekRanges.previousMonday, index);
      const thisDay = weeklyRows.get(thisDate);
      const lastDay = weeklyRows.get(lastDate);
      const date = new Date(`${thisDate}T12:00:00Z`);

      return {
        date: thisDate,
        label: new Intl.DateTimeFormat('en-NG', {
          weekday: 'short',
          timeZone: 'UTC',
        }).format(date),
        thisWeekCents: thisDay?.revenueCents ?? 0,
        lastWeekCents: lastDay?.revenueCents ?? 0,
        thisWeekOrders: thisDay?.orderCount ?? 0,
        lastWeekOrders: lastDay?.orderCount ?? 0,
      };
    });

    const thisWeekRevenueCents = weeklyDays.reduce((sum, day) => sum + day.thisWeekCents, 0);
    const lastWeekRevenueCents = weeklyDays.reduce((sum, day) => sum + day.lastWeekCents, 0);
    const thisWeekOrderCount = weeklyDays.reduce((sum, day) => sum + day.thisWeekOrders, 0);
    const lastWeekOrderCount = weeklyDays.reduce((sum, day) => sum + day.lastWeekOrders, 0);

    const hourlyCounts = new Map(
      (result?.hourlyOrders ?? []).map((row) => [Number(row._id), asNumber(row.count)]),
    );
    const hourlyOrders = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
      count: hourlyCounts.get(hour) ?? 0,
    }));

    return NextResponse.json(
      {
        overview: {
          revenueCents,
          orderCount,
          paidOrderCount,
          pendingOrderCount: Math.max(0, orderCount - paidOrderCount),
          customerCount: users,
          productCount: products,
          publishedProductCount: publishedProducts,
          couponCount: coupons,
        },
        ordersByStatus: (result?.statuses ?? []).map((item) => ({
          status: item._id,
          count: item.count,
        })),
        recentOrders: (result?.recent ?? []).map(({ _id, ...order }) => ({
          ...order,
          orderNumber: _id,
        })),
        productSales: topProducts,
        categorySales,
        hourlyOrders,
        weeklyRevenue: {
          days: weeklyDays,
          thisWeekRevenueCents,
          lastWeekRevenueCents,
          thisWeekOrderCount,
          lastWeekOrderCount,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch (error) {
    console.error('[admin/dashboard] Failed to load overview:', error);
    return NextResponse.json(
      { error: 'Unable to load dashboard overview' },
      { status: 500, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
