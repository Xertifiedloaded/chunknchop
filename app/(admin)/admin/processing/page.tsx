'use client';

import { useState } from 'react';
import { Activity, ChevronDown, CircleAlert, Clock3, Gauge, MapPin, Package, Plus, Scissors, Snowflake, Thermometer, UserRound } from 'lucide-react';

type Order = {
  name: string;
  code: string;
  priority: 'express' | 'urgent' | 'standard';
  product: string;
  detail: string;
  weight: string;
  staff: string;
  eta: string;
  progress: number;
};

type Station = {
  name: string;
  staff: string;
  load: number;
  temperature: string;
  color: 'red' | 'orange' | 'green';
};

type Queue = {
  name: string;
  subtitle: string;
  orders: Order[];
};

const queues: Queue[] = [
  {
    name: 'New Orders',
    subtitle: 'Awaiting intake',
    orders: [
      {
        name: 'Adaeze Okonkwo',
        code: 'CNC-20481',
        priority: 'express',
        product: 'Ribeye Beef',
        detail: 'Steak portions · 3cm',
        weight: '2.0 kg',
        staff: 'Segun Ade',
        eta: '11:20',
        progress: 5,
      },
      {
        name: 'Halima Sanusi',
        code: 'CNC-20473',
        priority: 'standard',
        product: 'Mixed BBQ',
        detail: 'Plain skewers',
        weight: '5.0 kg',
        staff: 'Unassigned',
        eta: '13:05',
        progress: 0,
      },
    ],
  },
  {
    name: 'Cutting Station',
    subtitle: 'Primal breakdown',
    orders: [
      {
        name: 'Tunde Bakare',
        code: 'CNC-20480',
        priority: 'urgent',
        product: 'Goat + Beef',
        detail: 'Bone-in chunks',
        weight: '10.0 kg',
        staff: 'Musa Dalladi',
        eta: '10:45',
        progress: 38,
      },
      {
        name: 'Ngozi Eze',
        code: 'CNC-20482',
        priority: 'standard',
        product: 'Chicken',
        detail: 'Butterfly fillet',
        weight: '3.0 kg',
        staff: 'Grace Obi',
        eta: '12:10',
        progress: 52,
      },
    ],
  },
  {
    name: 'Preparation',
    subtitle: 'Trim & marinate',
    orders: [
      {
        name: 'Yemi Alade',
        code: 'CNC-20483',
        priority: 'express',
        product: 'Beef Sirloin',
        detail: 'Suya-spiced strips',
        weight: '4.5 kg',
        staff: 'Ibrahim Sule',
        eta: '11:55',
        progress: 61,
      },
      {
        name: 'Dapo Ogun',
        code: 'CNC-20484',
        priority: 'standard',
        product: 'Pork Loin',
        detail: 'Bone-in chops',
        weight: '2.4 kg',
        staff: 'Segun Ade',
        eta: '12:40',
        progress: 55,
      },
    ],
  },
  {
    name: 'Quality Check',
    subtitle: 'Weight & temp',
    orders: [
      {
        name: 'Zainab Yusuf',
        code: 'CNC-20479',
        priority: 'standard',
        product: 'Chicken Breast',
        detail: 'Butterfly fillet',
        weight: '4.0 kg',
        staff: 'QA · Amaka N.',
        eta: '11:05',
        progress: 74,
      },
      {
        name: 'Sola Ajayi',
        code: 'CNC-20485',
        priority: 'express',
        product: 'King Prawns',
        detail: 'Deveined',
        weight: '1.5 kg',
        staff: 'QA · Amaka N.',
        eta: '10:58',
        progress: 80,
      },
    ],
  },
  {
    name: 'Packaging',
    subtitle: 'Vacuum seal',
    orders: [
      {
        name: 'Chidi Nwosu',
        code: 'CNC-20478',
        priority: 'standard',
        product: 'Chicken + Sausage',
        detail: 'Diced & packed',
        weight: '3.2 kg',
        staff: 'Peter Ilo',
        eta: '10:50',
        progress: 86,
      },
    ],
  },
];

const stations: Station[] = [
  {
    name: 'Cutting Station 1',
    staff: 'Musa Dalladi',
    load: 82,
    temperature: '4.1°C',
    color: 'red',
  },
  {
    name: 'Cutting Station 2',
    staff: 'Segun Ade',
    load: 64,
    temperature: '4.4°C',
    color: 'orange',
  },
  {
    name: 'Prep Bench',
    staff: 'Ibrahim Sule',
    load: 47,
    temperature: '5.0°C',
    color: 'green',
  },
  {
    name: 'QA Bay',
    staff: 'Amaka Nwachukwu',
    load: 38,
    temperature: '3.8°C',
    color: 'green',
  },
  {
    name: 'Cold Room 2',
    staff: 'Automated',
    load: 71,
    temperature: '-18.2°C',
    color: 'orange',
  },
];

function PriorityBadge({ priority }: { priority: Order['priority'] }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${priority === 'express' ? 'bg-[#fff0eb] text-[#ef5b2a]' : priority === 'urgent' ? 'bg-[#fff0f0] text-[#ef4444]' : 'bg-[#ebe9e7] text-[#4b4743]'}`}>
      {priority !== 'standard' && <span className={`h-1.5 w-1.5 rounded-full ${priority === 'urgent' ? 'bg-[#ef4444]' : 'bg-[#ef5b2a]'}`} />}
      {priority}
    </span>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="rounded-[15px] border border-[#ebe8e5] bg-white p-3.5 shadow-[0_7px_18px_rgba(40,32,25,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-sora text-ink truncate text-sm font-bold">{order.name}</h3>
          <p className="font-worksans text-ink mt-0.5 text-[11px]">{order.code}</p>
        </div>

        <PriorityBadge priority={order.priority} />
      </div>

      <div className="font-worksans mt-3 space-y-2 text-[12px] text-[#625a53]">
        <div className="flex items-start gap-2">
          <Scissors className="mt-0.5 h-4 w-4 shrink-0 text-[#aaa39d]" />
          <div className="min-w-0">
            <span className="font-medium text-[#39342f]">{order.product}</span>
            <span className="mx-1 text-[#aaa39d]">·</span>
            <span>{order.detail}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 shrink-0 text-[#aaa39d]" />
          <span>{order.weight}</span>
        </div>

        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0 text-[#aaa39d]" />
          <span>{order.staff}</span>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#e8e6e4]">
          <div className="h-full rounded-full bg-[#f15b2a] transition-all" style={{ width: `${order.progress}%` }} />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 text-[#918981]">
          <Clock3 className="h-3.5 w-3.5" />
          ETA {order.eta}
        </div>

        <span className="font-semibold text-[#4d4742]">{order.progress}%</span>
      </div>
    </div>
  );
}

function QueueColumn({ queue }: { queue: Queue }) {
  return (
    <div className="w-[85vw] max-w-65 shrink-0 snap-start rounded-sm bg-[#f1f1f0] p-1 sm:w-[260px]">
      <div className="flex items-start justify-between px-1.5 pb-3">
        <div>
          <h2 className="font-sora text-ink text-sm font-bold">{queue.name}</h2>
          <p className="mt-0.5 text-[11px] text-[#938a83]">{queue.subtitle}</p>
        </div>

        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-[#514a44] shadow-sm">{queue.orders.length}</span>
      </div>

      <div className="space-y-3">
        {queue.orders.map((order) => (
          <OrderCard key={order.code} order={order} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, valueClassName = '' }: { icon: React.ReactNode; label: string; value: string; valueClassName?: string }) {
  return (
    <div className="w-full rounded-[16px] border border-[#ebe8e5] bg-white px-4 py-3 shadow-[0_7px_18px_rgba(40,32,25,0.08)]">
      <div className="flex items-center gap-2 text-[11px] font-medium text-[#8c847d]">
        {icon}
        {label}
      </div>

      <div className={`mt-1.5 text-sm font-bold tracking-tight ${valueClassName || 'text-[#312d29]'}`}>{value}</div>
    </div>
  );
}

function StationCard({ station }: { station: Station }) {
  const barColor = station.color === 'red' ? 'bg-[#ef4444]' : station.color === 'orange' ? 'bg-[#f59e0b]' : 'bg-[#22c55e]';

  return (
    <div className="w-full rounded-[15px] border border-[#e8e3df] bg-white p-4">
      <h3 className="text-sm font-bold text-[#37322e]">{station.name}</h3>

      <p className="mt-0.5 text-[11px] text-[#968d85]">{station.staff}</p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7e5e3]">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${station.load}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-[#8f8780]">{station.load}% load</span>

        <span className="font-semibold text-[#0788d8]">{station.temperature}</span>
      </div>
    </div>
  );
}

export default function ProcessingQueuePage() {
  const [station, setStation] = useState('All stations');

  return (
    <main className="text-ink min-h-screen bg-[#f7f8f9] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-375">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="font-sora text-ink text-sm font-bold tracking-[-0.5px] sm:text-[25px]">Processing Queue</h1>

            <p className="text-ink font-worksans mt-2 text-sm sm:text-sm">Every order moving through the ChunkNChop butchery floor — from intake to the dispatch bay.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select value={station} onChange={(e) => setStation(e.target.value)} className="h-[42px] w-[160px] appearance-none rounded-sm border border-[#ddd8d4] bg-white px-4 pr-10 text-sm text-[#514b45] outline-none focus:border-[#f15b2a]">
                <option>All stations</option>
                <option>Cutting</option>
                <option>Preparation</option>
                <option>Quality Check</option>
                <option>Packaging</option>
              </select>

              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#807871]" />
            </div>

            <button className="flex h-[42px] items-center gap-2 rounded-sm border border-[#ddd8d4] bg-white px-4 text-sm font-medium whitespace-nowrap text-[#413c37] transition hover:bg-[#faf8f6]">
              <Gauge className="h-4 w-4" />
              Station Load
            </button>

            <button className="flex h-[42px] items-center gap-2 rounded-sm bg-[#f15b2a] px-4 text-sm font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-[#df4f20]">
              <Plus className="h-4 w-4" />
              New Job
            </button>
          </div>
        </header>

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={<Scissors className="h-4 w-4 text-[#ef5b2a]" />} label="In queue" value="12" valueClassName="text-[#ef4d25]" />

          <StatCard icon={<CircleAlert className="h-4 w-4 text-[#ef3333]" />} label="Urgent jobs" value="1" valueClassName="text-[#ef3333]" />

          <StatCard icon={<Clock3 className="h-4 w-4 text-[#3d3834]" />} label="Avg cycle time" value="42 min" />

          <StatCard icon={<Thermometer className="h-4 w-4 text-[#00a878]" />} label="QA pass rate" value="98.4%" valueClassName="text-[#00a878]" />

          <StatCard icon={<Snowflake className="h-4 w-4 text-[#0089d5]" />} label="Cold room temp" value="-18.2°C" valueClassName="text-[#0089d5]" />
        </section>

        <section className="mt-6">
          <div className="snap-x snap-mandatory [scrollbar-width:thin] overflow-x-auto pb-4">
            <div className="flex w-max gap-4">
              {queues.map((queue) => (
                <QueueColumn key={queue.name} queue={queue} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-sm border border-[#ebe8e5] bg-white p-5 shadow-[0_10px_25px_rgba(40,32,25,0.07)] sm:p-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#342f2b]">Station Load</h2>

            <p className="mt-1 text-[12px] text-[#918880]">Live utilisation and holding temperature by station</p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stations.map((item) => (
              <StationCard key={item.name} station={item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
