import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/request';
import prisma from '@/lib/db';

const ASSUMED_COST_RATIO = 0.616; // implies ~38.4% gross margin

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short' });
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;

    // Accept an explicit range (?start=YYYY-MM-DD&end=YYYY-MM-DD) which is
    // what the new report page sends for its date-range dropdown. Fall back
    // to the last 7 days if nothing is provided.
    const now = new Date();
    const defaultEnd = endOfDay(now);
    const defaultStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

    const startParam = params.get('start');
    const endParam = params.get('end');

    const rangeStart = startParam ? startOfDay(new Date(startParam)) : defaultStart;
    const rangeEnd = endParam ? endOfDay(new Date(endParam)) : defaultEnd;

    // Previous period of equal length, used for % change indicators.
    const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
    const prevEnd = new Date(rangeStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - rangeMs);

    const dateWhere = { createdAt: { gte: rangeStart, lte: rangeEnd } };
    const prevDateWhere = { createdAt: { gte: prevStart, lte: prevEnd } };

    // ---------- KPI CARDS ----------
    const [currentOrders, prevOrders, currentPaidAgg, prevPaidAgg, currentRefunds, prevRefunds] =
      await Promise.all([
        prisma.order.count({ where: dateWhere }),
        prisma.order.count({ where: prevDateWhere }),
        prisma.order.aggregate({
          where: { ...dateWhere, paymentStatus: 'PAID' },
          _sum: { total: true },
        }),
        prisma.order.aggregate({
          where: { ...prevDateWhere, paymentStatus: 'PAID' },
          _sum: { total: true },
        }),
        prisma.order.count({ where: { ...dateWhere, paymentStatus: 'REFUNDED' } }),
        prisma.order.count({ where: { ...prevDateWhere, paymentStatus: 'REFUNDED' } }),
      ]);

    const revenue = currentPaidAgg._sum.total || 0;
    const prevRevenue = prevPaidAgg._sum.total || 0;
    const revenueChangePct = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    const ordersChangePct = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;
    const aov = currentOrders > 0 ? revenue / currentOrders : 0;

    const refundRate = currentOrders > 0 ? (currentRefunds / currentOrders) * 100 : 0;
    const prevRefundRate = prevOrders > 0 ? (prevRefunds / prevOrders) * 100 : 0;
    const refundRateChangePct = refundRate - prevRefundRate;

    const grossMarginPct = (1 - ASSUMED_COST_RATIO) * 100;
    const prevGrossProfit = prevRevenue * (1 - ASSUMED_COST_RATIO);
    const currentGrossProfit = revenue * (1 - ASSUMED_COST_RATIO);
    const marginChangePct =
      prevRevenue > 0 && revenue > 0
        ? ((currentGrossProfit / revenue - prevGrossProfit / prevRevenue) * 100)
        : 0;

    // Simple target: current-period revenue vs. a 5% growth target on the
    // prior comparable period. Swap for a real target source when available.
    const target = prevRevenue > 0 ? prevRevenue * 1.05 : revenue;

    // ---------- REVENUE VS TARGET (trailing 6 months) ----------
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyOrders = await prisma.order.findMany({
      where: { paymentStatus: 'PAID', createdAt: { gte: sixMonthsAgo, lte: rangeEnd } },
      select: { total: true, createdAt: true },
    });

    const monthBuckets = new Map<string, { label: string; revenue: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthBuckets.set(monthKey(d), { label: monthLabel(d), revenue: 0 });
    }
    for (const o of monthlyOrders) {
      const key = monthKey(o.createdAt);
      const bucket = monthBuckets.get(key);
      if (bucket) bucket.revenue += o.total;
    }
    const revenueSeries = Array.from(monthBuckets.values());
    const firstMonthRevenue = revenueSeries[0]?.revenue || 1;
    const revenueVsTarget = revenueSeries.map((m, idx) => ({
      month: m.label,
      revenue: Math.round(m.revenue),
      // linear +5%/month growth projection off month 1, placeholder target
      target: Math.round(firstMonthRevenue * (1 + 0.05 * idx)),
    }));

    // ---------- DELIVERY / ZONE METRICS ----------
    const zones = await prisma.deliveryZone.findMany({ where: { isActive: true } });

    const ordersForZones = await prisma.order.findMany({
      where: dateWhere,
      select: {
        shippingZip: true,
        shippingCity: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
        estimatedDelivery: true,
      },
    });

    type ZoneAgg = {
      name: string;
      orders: number;
      delivered: number;
      onTime: number;
      totalDurationMs: number;
      durationSamples: number;
    };
    const zoneAggs = new Map<string, ZoneAgg>();

    const resolveZoneName = (zip: string, city: string) => {
      const match = zones.find((z) => z.zipCodes.includes(zip));
      return match ? match.name : city || 'Unassigned';
    };

    for (const o of ordersForZones) {
      const zoneName = resolveZoneName(o.shippingZip, o.shippingCity);
      if (!zoneAggs.has(zoneName)) {
        zoneAggs.set(zoneName, {
          name: zoneName,
          orders: 0,
          delivered: 0,
          onTime: 0,
          totalDurationMs: 0,
          durationSamples: 0,
        });
      }
      const agg = zoneAggs.get(zoneName)!;
      agg.orders += 1;
      if (o.deliveredAt) {
        agg.delivered += 1;
        agg.totalDurationMs += o.deliveredAt.getTime() - o.createdAt.getTime();
        agg.durationSamples += 1;
        if (o.estimatedDelivery && o.deliveredAt <= o.estimatedDelivery) {
          agg.onTime += 1;
        }
      }
    }

    const zoneEconomics = Array.from(zoneAggs.values())
      .map((z) => ({
        zone: z.name,
        orders: z.orders,
        onTimeRate: z.delivered > 0 ? Math.round((z.onTime / z.delivered) * 100) : 0,
        avgDurationMinutes:
          z.durationSamples > 0 ? Math.round(z.totalDurationMs / z.durationSamples / 60000) : 0,
      }))
      .sort((a, b) => b.orders - a.orders);

    const maxZoneOrders = Math.max(1, ...zoneEconomics.map((z) => z.orders));
    const deliveryPerformance = zoneEconomics.map((z) => ({
      label: z.zone,
      value: Math.max(8, Math.round((z.orders / maxZoneOrders) * 100)),
      onTimeRate: z.onTimeRate,
    }));

    // ---------- REPORT CATALOGUE ----------
    const periodLabel = `${rangeStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} – ${rangeEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const [
      paidOrderCount,
      orderItemCount,
      inventoryRecordCount,
      customerCount,
      deliveredWithRiderCount,
      activePromotionCount,
    ] = await Promise.all([
      prisma.order.count({ where: { ...dateWhere, paymentStatus: 'PAID' } }),
      prisma.orderItem.count({ where: { order: dateWhere } }),
      prisma.inventoryRecord.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { ...dateWhere, riderId: { not: null } } }),
      prisma.promotion.count({
        where: { isActive: true, startDate: { lte: rangeEnd }, endDate: { gte: rangeStart } },
      }),
    ]);

    const reportCatalogue = [
      {
        name: 'Revenue Report',
        description: 'Gross revenue, net of refunds, split by channel and zone.',
        period: periodLabel,
        rows: paidOrderCount,
      },
      {
        name: 'Sales Report',
        description: 'Units sold by product, category and preparation style.',
        period: periodLabel,
        rows: orderItemCount,
      },
      {
        name: 'Inventory Report',
        description: 'Opening stock, intake, wastage and closing balance in kg.',
        period: periodLabel,
        rows: inventoryRecordCount,
      },
      {
        name: 'Customer Report',
        description: 'Acquisition, retention cohorts and lifetime value.',
        period: 'All time',
        rows: customerCount,
      },
      {
        name: 'Order Report',
        description: 'Order lifecycle timings from placement to delivery.',
        period: periodLabel,
        rows: currentOrders,
      },
      {
        name: 'Delivery Report',
        description: 'Rider performance, on-time rate and cold-chain breaches.',
        period: periodLabel,
        rows: deliveredWithRiderCount,
      },
      {
        name: 'Marketing Report',
        description: 'Coupon redemption, campaign ROAS and referral velocity.',
        period: periodLabel,
        rows: activePromotionCount,
      },
    ];

    return NextResponse.json({
      range: { start: rangeStart.toISOString(), end: rangeEnd.toISOString(), label: periodLabel },
      kpis: {
        revenue: Math.round(revenue),
        revenueChangePct: Math.round(revenueChangePct * 10) / 10,
        target: Math.round(target),
        grossMarginPct: Math.round(grossMarginPct * 10) / 10,
        marginChangePct: Math.round(marginChangePct * 10) / 10,
        orders: currentOrders,
        ordersChangePct: Math.round(ordersChangePct * 10) / 10,
        aov: Math.round(aov),
        refundRatePct: Math.round(refundRate * 10) / 10,
        refundRateChangePct: Math.round(refundRateChangePct * 10) / 10,
        refundCount: currentRefunds,
      },
      revenueVsTarget,
      deliveryPerformance,
      zoneEconomics,
      reportCatalogue,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}