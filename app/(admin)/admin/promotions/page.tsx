"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Gift,
  MoreHorizontal,
  Plus,
  Send,
  Ticket,
  Zap,
} from "lucide-react";

type CampaignStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "paused";

type Campaign = {
  code: string;
  campaign: string;
  type: string;
  value: string;
  usage: number;
  limit: number;
  revenue: string;
  window: string;
  status: CampaignStatus;
};

const campaigns: Campaign[] = [
  {
    code: "CHOP20",
    campaign: "20% off first order",
    type: "Coupon",
    value: "20% off",
    usage: 842,
    limit: 1000,
    revenue: "₦18.4M",
    window: "Jul 1 – Aug 31",
    status: "active",
  },
  {
    code: "BBQFRIDAY",
    campaign: "Friday BBQ flash sale",
    type: "Flash Sale",
    value: "₦8,000 off packs",
    usage: 214,
    limit: 300,
    revenue: "₦11.2M",
    window: "Every Friday, 12:00 – 20:00",
    status: "active",
  },
  {
    code: "RIBEYE10",
    campaign: "Ribeye lovers",
    type: "Coupon",
    value: "10% off beef",
    usage: 96,
    limit: 250,
    revenue: "₦4.1M",
    window: "Aug 1 – Aug 14",
    status: "active",
  },
  {
    code: "HERO-AUG",
    campaign: "Homepage hero — Cold Chain Promise",
    type: "Banner",
    value: "Hero slot 1",
    usage: 0,
    limit: 0,
    revenue: "—",
    window: "Aug 1 – Aug 31",
    status: "active",
  },
  {
    code: "REFER5K",
    campaign: "Refer a friend, get ₦5,000",
    type: "Referral",
    value: "₦5,000 credit",
    usage: 318,
    limit: 1000,
    revenue: "₦9.6M",
    window: "Always on",
    status: "active",
  },
  {
    code: "GOLDPERK",
    campaign: "Gold tier free delivery",
    type: "Loyalty",
    value: "Free delivery",
    usage: 1204,
    limit: 0,
    revenue: "—",
    window: "Always on",
    status: "active",
  },
  {
    code: "EIDBOX",
    campaign: "Eid ram & goat bundles",
    type: "Seasonal",
    value: "Bundle pricing",
    usage: 0,
    limit: 500,
    revenue: "—",
    window: "Sep 12 – Sep 20",
    status: "scheduled",
  },
  {
    code: "DETTY24",
    campaign: "Detty December mega pack",
    type: "Seasonal",
    value: "15% off bundles",
    usage: 1841,
    limit: 2000,
    revenue: "₦42.8M",
    window: "Dec 1 – Dec 31, 2025",
    status: "expired",
  },
  {
    code: "PRAWN15",
    campaign: "Seafood weekend",
    type: "Flash Sale",
    value: "15% off seafood",
    usage: 62,
    limit: 200,
    revenue: "₦2.4M",
    window: "Paused — stock out",
    status: "paused",
  },
];

const chartData = [
  { label: "Mon", value: 22 },
  { label: "Tue", value: 31 },
  { label: "Wed", value: 35 },
  { label: "Thu", value: 47 },
  { label: "Fri", value: 59 },
  { label: "Sat", value: 66 },
  { label: "Sun", value: 73 },
];

function StatusBadge({ status }: { status: CampaignStatus }) {
  const styles = {
    active: "bg-[#e9faf3] text-[#009c69]",
    scheduled: "bg-[#fff8e6] text-[#c57a00]",
    expired: "bg-[#fff0f0] text-[#df4545]",
    paused: "bg-[#eeecea] text-[#716b65]",
  };

  const labels = {
    active: "active",
    scheduled: "scheduled",
    expired: "expired",
    paused: "paused",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "active"
            ? "bg-[#14b87a]"
            : status === "scheduled"
              ? "bg-[#f1a000]"
              : status === "expired"
                ? "bg-[#ef4d4d]"
                : "bg-[#8b8580]"
        }`}
      />
      {labels[status]}
    </span>
  );
}

function UsageBar({
  usage,
  limit,
}: {
  usage: number;
  limit: number;
}) {
  if (!limit) {
    return (
      <span className="text-[11px] text-[#827b74]">
        {usage.toLocaleString()} uses
      </span>
    );
  }

  const percentage = Math.min((usage / limit) * 100, 100);

  return (
    <div className="flex min-w-[130px] items-center gap-2">
      <div className="h-[5px] w-[65px] overflow-hidden rounded-full bg-[#e9e7e5]">
        <div
          className="h-full rounded-full bg-[#f15b2a]"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span className="whitespace-nowrap text-[10px] text-[#77716b]">
        {usage.toLocaleString()}/{limit.toLocaleString()}
      </span>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  iconClass,
  trend,
  trendType,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  trend?: string;
  trendType?: "positive" | "negative";
  subtitle: string;
}) {
  return (
    <div className="relative min-h-[120px] overflow-hidden rounded-[16px] border border-[#e7e4e1] bg-white px-4 py-4 shadow-[0_3px_12px_rgba(40,35,30,0.05)]">
      {title === "Active Campaigns" && (
        <div className="absolute left-0 right-0 top-0 h-[3px] bg-[#f15b2a]" />
      )}

      <div className="flex items-start justify-between">
        <p className="text-[10px] font-medium text-[#837c75]">
          {title}
        </p>

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-[9px] ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-1 text-[22px] font-bold tracking-[-0.4px] text-[#302d29]">
        {value}
      </p>

      <div className="mt-1.5 flex items-center gap-2">
        {trend && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              trendType === "negative"
                ? "bg-[#fff0f0] text-[#df4545]"
                : "bg-[#e9faf3] text-[#009c69]"
            }`}
          >
            {trend}
          </span>
        )}

        <span className="text-[10px] text-[#958e87]">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function PerformanceChart() {
  const width = 1000;
  const height = 155;

  const points = chartData
    .map((item, index) => {
      const x =
        20 + (index / (chartData.length - 1)) * (width - 40);

      const min = 15;
      const max = 80;

      const y =
        height -
        20 -
        ((item.value - min) / (max - min)) *
          (height - 40);

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-3 h-[185px] w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <polyline
          points={points}
          fill="none"
          stroke="#f15b2a"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export default function PromotionsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All types");

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        campaign.code
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        campaign.campaign
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All types" || campaign.type === filter;

      return matchesSearch && matchesFilter;
    });
  }, [search, filter]);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
  };

  return (
    <main className="min-h-screen bg-[#f7f8f9] px-4 py-4 text-[#302d29] md:px-5 lg:px-6">
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[23px] font-bold tracking-[-0.4px]">
              Promotions
            </h1>

            <p className="mt-1 text-[12px] text-[#8d867f]">
              Coupons, flash sales, banners, referrals and loyalty
              rewards driving repeat orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="flex h-9 items-center gap-2 rounded-[11px] border border-[#ddd8d3] bg-white px-3.5 text-[12px] font-medium text-[#3d3833] shadow-sm transition hover:bg-[#faf9f8]"
              type="button"
            >
              <Send className="h-3.5 w-3.5" />
              Send Promotion
            </button>

            <button
              className="flex h-9 items-center gap-1.5 rounded-[11px] bg-[#f15b2a] px-3.5 text-[12px] font-semibold text-white transition hover:bg-[#df4e20]"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid grid-cols-2 gap-1 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Active Campaigns"
            value="6"
            icon={<Zap className="h-4 w-4 text-[#f15b2a]" />}
            iconClass="bg-[#fff2ed]"
            subtitle="2 scheduled this month"
          />

          <KpiCard
            title="Redemptions (30d)"
            value="1,365"
            icon={<Ticket className="h-4 w-4 text-[#b54467]" />}
            iconClass="bg-[#fff0f4]"
            trend="↗ 18.4%"
            trendType="positive"
            subtitle="Across all coupon types"
          />

          <KpiCard
            title="Promo Revenue"
            value="₦45.3M"
            icon={<Gift className="h-4 w-4 text-[#009c69]" />}
            iconClass="bg-[#eafaf3]"
            trend="↗ 12.1%"
            trendType="positive"
            subtitle="Attributed to campaigns"
          />

          <KpiCard
            title="Avg Discount"
            value="13.4%"
            icon={<Ticket className="h-4 w-4 text-[#726d67]" />}
            iconClass="bg-[#ebe9e7]"
            trend="↘ 1.2%"
            trendType="negative"
            subtitle="Margin holding at 38%"
          />
        </section>

        {/* Performance */}
        <section className="mt-5 rounded-[16px] border border-[#e7e4e1] bg-white px-5 py-4 shadow-[0_5px_18px_rgba(40,35,30,0.06)]">
          <h2 className="text-[13px] font-semibold">
            Campaign Performance
          </h2>

          <p className="text-[10px] text-[#918a83]">
            Weekly redemptions and attributed revenue
          </p>

          <PerformanceChart />
        </section>

        {/* Campaign table */}
        <section className="mt-5 overflow-hidden rounded-[16px] border border-[#e7e4e1] bg-white shadow-[0_5px_18px_rgba(40,35,30,0.06)]">
          {/* Search */}
          <div className="flex gap-2 border-b border-[#e7e4e1] p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or campaign..."
              className="h-8 flex-1 rounded-[9px] border border-[#ddd8d3] bg-white px-4 text-[11px] text-[#3c3732] outline-none placeholder:text-[#a1a9b8] focus:border-[#f15b2a]"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 w-[150px] rounded-[9px] border border-[#ddd8d3] bg-white px-3 text-[11px] text-[#756e67] outline-none"
            >
              <option>All types</option>
              <option>Coupon</option>
              <option>Flash Sale</option>
              <option>Banner</option>
              <option>Referral</option>
              <option>Loyalty</option>
              <option>Seasonal</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-[#ebe8e5] bg-[#fcfbfa] text-left">
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Code
                  </th>
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Campaign
                  </th>
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Value
                  </th>
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Usage
                  </th>
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Revenue
                  </th>
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Window
                  </th>
                  <th className="px-4 py-2.5 text-[9px] font-semibold text-[#807971]">
                    Status
                  </th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>

              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr
                    key={campaign.code}
                    className="border-b border-[#efedeb] last:border-0 hover:bg-[#fdfcfb]"
                  >
                    <td className="px-4 py-3">
                      <span className="rounded-[7px] bg-[#f2f1ef] px-2 py-1 text-[9px] font-bold text-[#514b46]">
                        {campaign.code}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[11px] font-medium text-[#36322e]">
                      {campaign.campaign}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#e9e7e5] px-2.5 py-1 text-[9px] font-semibold text-[#655f59]">
                        {campaign.type}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-[11px] text-[#5d5751]">
                      {campaign.value}
                    </td>

                    <td className="px-4 py-3">
                      <UsageBar
                        usage={campaign.usage}
                        limit={campaign.limit}
                      />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-[11px] font-semibold text-[#393530]">
                      {campaign.revenue}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-[10px] text-[#5f5953]">
                      {campaign.window}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={campaign.status} />
                    </td>

                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => copyCode(campaign.code)}
                        className="rounded-md p-1.5 text-[#8d8780] transition hover:bg-[#f1efed] hover:text-[#3c3732]"
                        title="Copy code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCampaigns.length === 0 && (
              <div className="py-12 text-center text-[12px] text-[#918a83]">
                No campaigns found.
              </div>
            )}
          </div>
        </section>

        {/* Bottom shortcuts */}
        <section className="mt-5 grid gap-3 md:grid-cols-3">
          <ShortcutCard
            title="Homepage Banners"
            description="4 slots live · 9,588 clicks this month"
            action="Manage banners →"
          />

          <ShortcutCard
            title="Referral Campaign"
            description="318 referrals converted · ₦5,000 credit each"
            action="View referrals →"
          />

          <ShortcutCard
            title="Loyalty Rewards"
            description="4 tiers · Gold and above get free delivery"
            action="Edit tiers →"
          />
        </section>
      </div>
    </main>
  );
}

function ShortcutCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="rounded-[16px] border border-[#e7e4e1] bg-white px-4 py-4 shadow-[0_5px_18px_rgba(40,35,30,0.06)]">
      <h3 className="text-[13px] font-semibold text-[#38342f]">
        {title}
      </h3>

      <p className="mt-1 text-[11px] text-[#746d66]">
        {description}
      </p>

      <button
        type="button"
        className="mt-3 text-[10px] font-semibold text-[#ed5929] hover:underline"
      >
        {action}
      </button>
    </div>
  );
}