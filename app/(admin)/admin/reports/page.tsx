'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetchWithAuth } from '@/lib/fetchClient';

interface ReportsResponse {
  range: { start: string; end: string; label: string };
  kpis: {
    revenue: number;
    revenueChangePct: number;
    target: number;
    grossMarginPct: number;
    marginChangePct: number;
    orders: number;
    ordersChangePct: number;
    aov: number;
    refundRatePct: number;
    refundRateChangePct: number;
    refundCount: number;
  };
  revenueVsTarget: Array<{ month: string; revenue: number; target: number }>;
  deliveryPerformance: Array<{ label: string; value: number; onTimeRate: number }>;
  zoneEconomics: Array<{
    zone: string;
    orders: number;
    onTimeRate: number;
    avgDurationMinutes: number;
  }>;
  reportCatalogue: Array<{
    name: string;
    description: string;
    period: string;
    rows: number;
  }>;
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildPresets() {
  const now = new Date();

  const thisWeekEnd = new Date(now);
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 6);

  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
  const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const label = (start: Date, end: Date) =>
    `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(
      'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' }
    )}`;

  return [
    { label: label(thisWeekStart, thisWeekEnd), start: thisWeekStart, end: thisWeekEnd },
    { label: label(lastMonthStart, lastMonthEnd), start: lastMonthStart, end: lastMonthEnd },
    { label: label(twoMonthsAgoStart, twoMonthsAgoEnd), start: twoMonthsAgoStart, end: twoMonthsAgoEnd },
  ];
}

const fetcher = (url: string) => fetchWithAuth(url).then((res) => res.json());

export default function ReportsPage() {
  const presets = useMemo(buildPresets, []);
  const [presetIndex, setPresetIndex] = useState(0);
  const selected = presets[presetIndex];

  const queryKey = `/api/admin/reports?start=${fmtDate(selected.start)}&end=${fmtDate(selected.end)}`;
  const { data, error, isLoading } = useSWR<ReportsResponse>(queryKey, fetcher);

  const getStatusColor = (percentage: number) => {
    if (percentage <= 89) return 'text-red-500';
    if (percentage <= 94) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const downloadCsv = (filename: string, rows: (string | number)[][]) => {
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!data) return;
    downloadCsv('reports-analytics.csv', [
      ['Metric', 'Value'],
      ['Revenue', `₦${(data.kpis.revenue / 1_000_000).toFixed(1)}M`],
      ['Gross Margin', `${data.kpis.grossMarginPct}%`],
      ['Orders', String(data.kpis.orders)],
      ['Refund Rate', `${data.kpis.refundRatePct}%`],
    ]);
  };

  const exportReport = (report: { name: string; description: string; period: string; rows: number }, format: 'CSV' | 'PDF') => {
    if (format === 'PDF') {
      window.print();
      return;
    }
    downloadCsv(`${report.name.toLowerCase().replaceAll(' ', '-')}.csv`, [
      ['Report', report.name],
      ['Description', report.description],
      ['Period', report.period],
      ['Rows', String(report.rows)],
    ]);
  };

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f8f9] px-6 py-10 text-center text-[#292929]">
        Couldn&apos;t load reports. Please try again.
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="min-h-screen bg-[#f7f8f9] px-6 py-10 text-center text-[#292929]">
        Loading reports…
      </main>
    );
  }

  const { kpis, revenueVsTarget, deliveryPerformance, zoneEconomics, reportCatalogue } = data;

  const chartValues = revenueVsTarget.flatMap((m) => [m.revenue, m.target]);
  const maxVal = Math.max(1, ...chartValues);
  const minVal = Math.min(...chartValues, 0);
  const chartWidth = 1000;
  const chartHeight = 190;
  const topPad = 15;
  const bottomPad = 15;
  const usableHeight = chartHeight - topPad - bottomPad;

  const toY = (v: number) => {
    if (maxVal === minVal) return chartHeight / 2;
    return topPad + usableHeight - ((v - minVal) / (maxVal - minVal)) * usableHeight;
  };
  const toX = (i: number) =>
    revenueVsTarget.length > 1 ? (i / (revenueVsTarget.length - 1)) * chartWidth : 0;

  const revenuePoints = revenueVsTarget.map((m, i) => [toX(i), toY(m.revenue)] as const);
  const targetPoints = revenueVsTarget.map((m, i) => [toX(i), toY(m.target)] as const);

  return (
    <main className="min-h-screen bg-[#f7f8f9] px-3 py-5 text-[#292929] sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1540px]">
        {/* Header */}
        <header className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.4px]">Reports &amp; Analytics</h1>
            <p className="mt-1 text-[11px] text-[#929292]">
              Financial, operational and marketing reporting across the ChunkNChop business.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <select
              value={presetIndex}
              onChange={(e) => setPresetIndex(Number(e.target.value))}
              className="h-9.5 min-w-45 rounded-[9px] border border-[#dedede] bg-white px-3 text-[11px] font-semibold text-[#4b4b4b] outline-none"
            >
              {presets.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>

            <button
              onClick={exportCSV}
              className="flex h-9.5 shrink-0 items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-3.5 text-[11px] font-semibold text-[#4b4b4b] transition hover:bg-[#fafafa]"
            >
              <span>▤</span>
              Export CSV
            </button>

            <button
              onClick={() => window.print()}
              className="flex h-9.5 shrink-0 items-center gap-2 rounded-[9px] border border-[#f26322] bg-[#f26322] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#df5519]"
            >
              <span>▣</span>
              Export PDF
            </button>
          </div>
        </header>

        <section className="mb-5.5 grid grid-cols-2 gap-1 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative min-h-27 rounded-[15px] border border-[#e5e5e5] border-t-[3px] border-t-[#f26322] bg-white px-[17px] pb-[15px] pt-[15px] shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
            <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff4ee] text-[#f26322]">
              ↗
            </div>
            <p className="mb-1.75 text-[10px] text-[#8c8c8c]">Revenue</p>
            <p className="mb-[11px] text-[21px] font-bold tracking-[-0.5px]">
              ₦{(kpis.revenue / 1_000_000).toFixed(1)}M
            </p>
            <div className="flex items-center gap-2 text-[9px] text-[#999]">
              <span
                className={`rounded-[5px] px-[5px] py-[3px] font-bold ${
                  kpis.revenueChangePct >= 0 ? 'bg-[#eaf8f3] text-[#119b6b]' : 'bg-[#fff0ee] text-[#df3e34]'
                }`}
              >
                {kpis.revenueChangePct >= 0 ? '↗' : '↘'} {Math.abs(kpis.revenueChangePct)}%
              </span>
              <span>Target ₦{(kpis.target / 1_000_000).toFixed(1)}M</span>
            </div>
          </div>

          <div className="min-h-[108px] rounded-[15px] border border-[#e5e5e5] bg-white px-[17px] py-[17px] shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
            <p className="mb-[7px] text-[10px] text-[#8c8c8c]">Gross Margin</p>
            <p className="mb-[11px] text-[21px] font-bold tracking-[-0.5px]">{kpis.grossMarginPct}%</p>
            <div className="flex items-center gap-2 text-[9px] text-[#999]">
              <span
                className={`rounded-[5px] px-[5px] py-[3px] font-bold ${
                  kpis.marginChangePct >= 0 ? 'bg-[#eaf8f3] text-[#119b6b]' : 'bg-[#fff0ee] text-[#df3e34]'
                }`}
              >
                {kpis.marginChangePct >= 0 ? '↗' : '↘'} {Math.abs(kpis.marginChangePct)}%
              </span>
              <span>vs prior period</span>
            </div>
          </div>

          <div className="min-h-[108px] rounded-[15px] border border-[#e5e5e5] bg-white px-[17px] py-[17px] shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
            <p className="mb-[7px] text-[10px] text-[#8c8c8c]">Orders</p>
            <p className="mb-[11px] text-[21px] font-bold tracking-[-0.5px]">{kpis.orders.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-[9px] text-[#999]">
              <span
                className={`rounded-[5px] px-[5px] py-[3px] font-bold ${
                  kpis.ordersChangePct >= 0 ? 'bg-[#eaf8f3] text-[#119b6b]' : 'bg-[#fff0ee] text-[#df3e34]'
                }`}
              >
                {kpis.ordersChangePct >= 0 ? '↗' : '↘'} {Math.abs(kpis.ordersChangePct)}%
              </span>
              <span>AOV ₦{kpis.aov.toLocaleString()}</span>
            </div>
          </div>

          <div className="min-h-[108px] rounded-[15px] border border-[#e5e5e5] bg-white px-[17px] py-[17px] shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
            <p className="mb-[7px] text-[10px] text-[#8c8c8c]">Refund Rate</p>
            <p className="mb-[11px] text-[21px] font-bold tracking-[-0.5px]">{kpis.refundRatePct}%</p>
            <div className="flex items-center gap-2 text-[9px] text-[#999]">
              <span
                className={`rounded-[5px] px-[5px] py-[3px] font-bold ${
                  kpis.refundRateChangePct <= 0 ? 'bg-[#eaf8f3] text-[#119b6b]' : 'bg-[#fff0ee] text-[#df3e34]'
                }`}
              >
                {kpis.refundRateChangePct <= 0 ? '↘' : '↗'} {Math.abs(kpis.refundRateChangePct)}%
              </span>
              <span>{kpis.refundCount} refunds this period</span>
            </div>
          </div>
        </section>

        {/* Revenue vs Target */}
        <section className="relative mb-[22px] h-[350px] rounded-[15px] border border-[#e5e5e5] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
          <div className="px-5 pt-[17px]">
            <h2 className="text-[11.5px] font-bold">Revenue vs Target</h2>
            <p className="mt-1 text-[9.5px] text-[#969696]">Monthly gross revenue against the commercial plan</p>
          </div>

          <div className="absolute right-5 top-[67px] flex gap-3 text-[9px] text-[#555]">
            <span className="flex items-center gap-1">
              <span className="h-[7px] w-[7px] rounded-full bg-[#f26322]" />
              Revenue
            </span>
            <span className="flex items-center gap-1">
              <span className="h-[7px] w-[7px] rounded-full bg-[#292929]" />
              Target
            </span>
          </div>

          <div className="absolute bottom-[54px] left-[30px] right-[30px] top-[105px] sm:left-[70px] sm:right-[70px] lg:left-[100px] lg:right-[80px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="h-full w-full">
              <line x1="0" y1="30" x2={chartWidth} y2="30" stroke="#f0f0f0" />
              <line x1="0" y1="80" x2={chartWidth} y2="80" stroke="#f0f0f0" />
              <line x1="0" y1="130" x2={chartWidth} y2="130" stroke="#f0f0f0" />

              <polyline
                points={targetPoints.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="#292929"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              <polyline
                points={revenuePoints.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="#f26322"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />

              {revenuePoints.map(([x, y], index) => (
                <circle key={index} cx={x} cy={y} r="3" fill="#f26322" />
              ))}

              {revenueVsTarget.map((m, i) => (
                <text key={m.month} x={toX(i)} y="180" fill="#aaa" fontSize="9">
                  {m.month}
                </text>
              ))}
            </svg>
          </div>
        </section>

        {/* Delivery + Zone Economics */}
        <section className="mb-[22px] grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          <section className="h-[307px] overflow-hidden rounded-[15px] border border-[#e5e5e5] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
            <div className="px-5 pt-[17px]">
              <h2 className="text-[11.5px] font-bold">Delivery Performance by Zone</h2>
              <p className="mt-1 text-[9.5px] text-[#969696]">Order volume, selected period</p>
            </div>

            <div className="relative mx-[22px] mt-[17px] h-[220px]">
              {[20, 40, 60, 80].map((position) => (
                <div
                  key={position}
                  className="absolute left-0 right-0 border-t border-[#f1f1f1]"
                  style={{ top: `${position}%` }}
                />
              ))}

              <div className="relative z-10 flex h-full items-end justify-around overflow-x-auto border-b border-[#ededed] px-5 pb-6">
                {deliveryPerformance.length === 0 ? (
                  <p className="self-center text-[10px] text-[#999]">No delivery data for this period</p>
                ) : (
                  deliveryPerformance.map((bar) => (
                    <div
                      key={bar.label}
                      className="flex h-full w-[50px] flex-shrink-0 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-[25px] rounded-t-[5px] bg-[#f26322] opacity-90 transition hover:opacity-100"
                        style={{ height: `${bar.value}%` }}
                        title={`${bar.onTimeRate}% on-time`}
                      />
                      <span className="text-[9px] text-[#999]">{bar.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="h-[307px] overflow-hidden rounded-[15px] border border-[#e5e5e5] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
            <div className="px-5 pt-[17px]">
              <h2 className="text-[11.5px] font-bold">Zone Economics</h2>
              <p className="mt-1 text-[9.5px] text-[#969696]">On-time rate and average delivery duration</p>
            </div>

            <table className="mt-[14px] w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-[#fafafa]">
                  <th className="border-y border-[#eeeeee] px-5 py-[9px] text-left text-[9px] font-medium text-[#999]">
                    Zone
                  </th>
                  <th className="border-y border-[#eeeeee] px-5 py-[9px] text-right text-[9px] font-medium text-[#999]">
                    Orders
                  </th>
                  <th className="border-y border-[#eeeeee] px-5 py-[9px] text-right text-[9px] font-medium text-[#999]">
                    On-time
                  </th>
                  <th className="border-y border-[#eeeeee] px-5 py-[9px] text-right text-[9px] font-medium text-[#999]">
                    Avg duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {zoneEconomics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-center text-[10px] text-[#999]">
                      No zone data for this period
                    </td>
                  </tr>
                ) : (
                  zoneEconomics.map((zone) => (
                    <tr key={zone.zone}>
                      <td className="border-b border-[#ededed] px-5 py-[9.5px] font-semibold text-[#333]">
                        {zone.zone}
                      </td>
                      <td className="border-b border-[#ededed] px-5 py-[9.5px] text-right text-[#555]">
                        {zone.orders}
                      </td>
                      <td
                        className={`border-b border-[#ededed] px-5 py-[9.5px] text-right font-bold ${getStatusColor(
                          zone.onTimeRate
                        )}`}
                      >
                        {zone.onTimeRate}%
                      </td>
                      <td className="border-b border-[#ededed] px-5 py-[9.5px] text-right text-[#555]">
                        {zone.avgDurationMinutes}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </section>

        {/* Report Catalogue */}
        <section className="overflow-hidden rounded-[15px] border border-[#e5e5e5] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.045)]">
          <div className="px-5 pb-[15px] pt-[17px]">
            <h2 className="text-[11.5px] font-bold">Report Catalogue</h2>
            <p className="mt-1 text-[9.5px] text-[#969696]">Generate and export any standard report</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse">
              <thead>
                <tr className="bg-[#fafafa]">
                  <th className="w-[18%] border-y border-[#ededed] px-[18px] py-[9px] text-left text-[8.5px] font-semibold text-[#999]">
                    Report
                  </th>
                  <th className="w-[48%] border-y border-[#ededed] px-[18px] py-[9px] text-left text-[8.5px] font-semibold text-[#999]">
                    Description
                  </th>
                  <th className="w-[16%] border-y border-[#ededed] px-[18px] py-[9px] text-left text-[8.5px] font-semibold text-[#999]">
                    Period
                  </th>
                  <th className="w-[9%] border-y border-[#ededed] px-[18px] py-[9px] text-right text-[8.5px] font-semibold text-[#999]">
                    Rows
                  </th>
                  <th className="w-[9%] border-y border-[#ededed] px-[18px] py-[9px] text-right text-[8.5px] font-semibold text-[#999]">
                    Export
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportCatalogue.map((report) => (
                  <tr key={report.name}>
                    <td className="border-b border-[#ededed] px-[18px] py-[10px] text-[10px] font-bold text-[#333]">
                      {report.name}
                    </td>
                    <td className="border-b border-[#ededed] px-[18px] py-[10px] text-[10px] text-[#666]">
                      {report.description}
                    </td>
                    <td className="border-b border-[#ededed] px-[18px] py-[10px] text-[10px] text-[#666]">
                      {report.period}
                    </td>
                    <td className="border-b border-[#ededed] px-[18px] py-[10px] text-right text-[10px] text-[#666]">
                      {report.rows.toLocaleString()}
                    </td>
                    <td className="border-b border-[#ededed] px-[18px] py-[10px] text-right text-[10px] font-semibold text-[#f26322]">
                      <button onClick={() => exportReport(report, 'CSV')} className="hover:underline">
                        CSV
                      </button>
                      <span className="mx-1.5 text-[#d4d4d4]">·</span>
                      <button onClick={() => exportReport(report, 'PDF')} className="hover:underline">
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}