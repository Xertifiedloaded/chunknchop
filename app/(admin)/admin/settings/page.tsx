"use client";

import { useState } from "react";
import {
  Building2,
  Percent,
  Truck,
  CreditCard,
  Mail,
  MessageSquare,
  Bell,
  Shield,
  Plug,
  Check,
  CircleAlert,
  PauseCircle,
} from "lucide-react";

type Tab =
  | "business"
  | "taxes"
  | "delivery"
  | "payment"
  | "email"
  | "sms"
  | "notifications"
  | "security"
  | "api";

const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "business", label: "Business Information", icon: Building2 },
  { id: "taxes", label: "Taxes", icon: Percent },
  { id: "delivery", label: "Delivery Charges", icon: Truck },
  { id: "payment", label: "Payment Gateway", icon: CreditCard },
  { id: "email", label: "Email Templates", icon: Mail },
  { id: "sms", label: "SMS Templates", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "api", label: "API Integrations", icon: Plug },
];

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        enabled ? "bg-[#f26422]" : "bg-[#d8d6d3]"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-[#383533]">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[42px] w-full rounded-[9px] border border-[#ddd9d5] bg-white px-3 text-[13px] text-[#292624] outline-none transition focus:border-[#f26422] focus:ring-2 focus:ring-[#f26422]/10"
      />
    </label>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[#ebe8e5] bg-white p-4 shadow-[0_5px_20px_rgba(31,27,24,0.06)] sm:p-6">
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-[#2d2926]">{title}</h2>
        <p className="mt-1 text-[12px] text-[#958d87]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function BusinessInformation() {
  const [form, setForm] = useState({
    legalName: "",
    tradingName: "",
    rcNumber: "",
    supportPhone: "",
    supportEmail: "",
    currency: "",
    address: "",
    tagline: "",
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Section
      title="Business Information"
      subtitle="Shown on invoices, receipts and the storefront footer"
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <Input
          label="Legal business name"
          value={form.legalName}
          onChange={(v) => update("legalName", v)}
        />
        <Input
          label="Trading name"
          value={form.tradingName}
          onChange={(v) => update("tradingName", v)}
        />
        <Input
          label="RC number"
          value={form.rcNumber}
          onChange={(v) => update("rcNumber", v)}
        />
        <Input
          label="Support phone"
          value={form.supportPhone}
          onChange={(v) => update("supportPhone", v)}
        />
        <Input
          label="Support email"
          value={form.supportEmail}
          onChange={(v) => update("supportEmail", v)}
        />
        <Input
          label="Currency"
          value={form.currency}
          onChange={(v) => update("currency", v)}
        />

        <div className="sm:col-span-2">
          <Input
            label="Registered address"
            value={form.address}
            onChange={(v) => update("address", v)}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Tagline"
            value={form.tagline}
            onChange={(v) => update("tagline", v)}
          />
        </div>
      </div>
    </Section>
  );
}

const deliveryZones = [
  ["Lekki Phase 1", "35–50 min", "active"],
  ["Victoria Island", "40–55 min", "active"],
  ["Ikoyi", "30–45 min", "active"],
  ["Ikeja GRA", "50–70 min", "active"],
  ["Yaba", "45–60 min", "active"],
  ["Ajah", "55–80 min", "limited"],
  ["Abuja (Maitama)", "Next day", "active"],
  ["Ibadan", "Next day", "paused"],
];

function DeliveryCharges() {
  const [zones, setZones] = useState(
    deliveryZones.map(([name, eta, status]) => ({
      name,
      eta,
      status,
      enabled: status !== "paused",
      charge: "",
    }))
  );

  const [freeDelivery, setFreeDelivery] = useState(true);

  const toggleZone = (index: number) => {
    setZones((current) =>
      current.map((zone, i) =>
        i === index ? { ...zone, enabled: !zone.enabled } : zone
      )
    );
  };

  const updateCharge = (index: number, charge: string) => {
    setZones((current) =>
      current.map((zone, i) => (i === index ? { ...zone, charge } : zone))
    );
  };

  return (
    <Section
      title="Delivery Charges"
      subtitle="Per-zone fees applied at checkout"
    >
      <div className="overflow-hidden">
        {zones.map((zone, index) => (
          <div
            key={zone.name}
            className="flex flex-col gap-3 border-b border-[#eeeae7] py-3 last:border-b-0 sm:min-h-[57px] sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:py-0"
          >
            <div className="flex items-center justify-between gap-3 sm:block">
              <div>
                <p className="text-[12px] font-semibold text-[#393532]">
                  {zone.name}
                </p>
                <p className="mt-0.5 text-[10px] text-[#9a928c]">{zone.eta}</p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold sm:hidden ${
                  zone.status === "active"
                    ? "bg-[#e9f9ef] text-[#23a95b]"
                    : zone.status === "limited"
                    ? "bg-[#fff5dc] text-[#dc9900]"
                    : "bg-[#eeeae7] text-[#817a75]"
                }`}
              >
                {zone.status}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span
                className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold sm:inline-block ${
                  zone.status === "active"
                    ? "bg-[#e9f9ef] text-[#23a95b]"
                    : zone.status === "limited"
                    ? "bg-[#fff5dc] text-[#dc9900]"
                    : "bg-[#eeeae7] text-[#817a75]"
                }`}
              >
                {zone.status}
              </span>

              <div className="flex items-center gap-4">
                <input
                  value={zone.charge}
                  onChange={(e) => updateCharge(index, e.target.value)}
                  placeholder="₦0"
                  className="h-[34px] w-[64px] shrink-0 rounded-[7px] border border-[#ddd9d5] px-2 text-center text-[11px] outline-none focus:border-[#f26422]"
                />

                <Toggle
                  enabled={zone.enabled}
                  onChange={() => toggleZone(index)}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="mt-4 flex flex-col gap-3 border-t border-[#eeeae7] pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div>
            <p className="text-[12px] font-semibold text-[#393532]">
              Free delivery threshold
            </p>
            <p className="mt-1 text-[10px] text-[#9a928c]">
              Waive delivery fees for orders above ₦75,000.
            </p>
          </div>

          <Toggle
            enabled={freeDelivery}
            onChange={() => setFreeDelivery(!freeDelivery)}
          />
        </div>
      </div>
    </Section>
  );
}

function PaymentGateway() {
  const [gateways, setGateways] = useState({
    paystack: true,
    flutterwave: true,
    bank: true,
    cod: false,
  });

  const toggle = (key: keyof typeof gateways) => {
    setGateways((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const options = [
    {
      key: "paystack" as const,
      title: "Paystack",
      description: "Cards, transfer, USSD · settlement T+1",
    },
    {
      key: "flutterwave" as const,
      title: "Flutterwave",
      description: "Cards and bank transfer · settlement T+1",
    },
    {
      key: "bank" as const,
      title: "Bank Transfer (manual)",
      description: "Verified by finance before release",
    },
    {
      key: "cod" as const,
      title: "Pay on Delivery",
      description: "Cash and POS at the door",
    },
  ];

  return (
    <Section
      title="Payment Gateway"
      subtitle="Providers accepting payment at checkout"
    >
      <div className="space-y-2.5">
        {options.map((option) => (
          <div
            key={option.key}
            className="flex min-h-[58px] items-center justify-between gap-3 rounded-[14px] border border-[#e4dfdb] px-3.5 py-3 sm:py-0"
          >
            <div>
              <p className="text-[12px] font-bold text-[#37322f]">
                {option.title}
              </p>
              <p className="mt-1 text-[10px] text-[#958d87]">
                {option.description}
              </p>
            </div>

            <Toggle
              enabled={gateways[option.key]}
              onChange={() => toggle(option.key)}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

function Security() {
  const [settings, setSettings] = useState({
    twoFactor: true,
    restrictIps: false,
    autoLogout: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <Section
      title="Security"
      subtitle="Account controls for operations console"
    >
      <div>
        {[
          {
            key: "twoFactor" as const,
            title: "Require two-factor authentication",
            description: "All staff must enrol an authenticator app.",
          },
          {
            key: "restrictIps" as const,
            title: "Restrict console to office IPs",
            description: "Block sign-ins outside approved networks.",
          },
          {
            key: "autoLogout" as const,
            title: "Auto sign-out after 30 min idle",
            description: "Applies to shared floor terminals.",
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex min-h-[54px] items-center justify-between gap-3 border-b border-[#eeeae7] py-3 last:border-b-0 sm:py-0"
          >
            <div>
              <p className="text-[12px] font-semibold text-[#393532]">
                {item.title}
              </p>
              <p className="mt-0.5 text-[10px] text-[#9a928c]">
                {item.description}
              </p>
            </div>

            <Toggle
              enabled={settings[item.key]}
              onChange={() => toggle(item.key)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Password minimum length" value="12" onChange={() => {}} />
        <Input label="Session lifetime (hours)" value="8" onChange={() => {}} />
      </div>
    </Section>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <Section title={title} subtitle={`Configure ${title.toLowerCase()}`}>
      <div className="flex min-h-[220px] items-center justify-center text-sm text-[#958d87]">
        Configuration options
      </div>
    </Section>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("business");

  const renderContent = () => {
    switch (activeTab) {
      case "business":
        return <BusinessInformation />;
      case "delivery":
        return <DeliveryCharges />;
      case "payment":
        return <PaymentGateway />;
      case "security":
        return <Security />;
      default:
        return (
          <Placeholder
            title={tabs.find((tab) => tab.id === activeTab)?.label || ""}
          />
        );
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-3 py-4 text-[#2d2926] sm:px-6 sm:py-5">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-0">
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.5px] sm:text-[24px]">
              Settings
            </h1>
            <p className="mt-1 text-[12.5px] text-[#8d8580] sm:text-[13px]">
              Configure the ChunkNChop business profile, fulfilment charges,
              messaging and integrations.
            </p>
          </div>

          <button className="w-full rounded-[9px] bg-[#f26422] px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#df5618] sm:w-auto">
            Save Changes
          </button>
        </header>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[205px_minmax(0,1fr)]">
          <aside className="rounded-[17px] border border-[#ebe8e5] bg-white p-1.5 shadow-[0_5px_20px_rgba(31,27,24,0.07)] lg:sticky lg:top-4">
            <div
              className="flex snap-x snap-mandatory gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] before:w-0.5 before:shrink-0 before:content-[''] after:w-0.5 after:shrink-0 after:content-[''] lg:flex-col lg:overflow-visible lg:pb-0 lg:before:hidden lg:after:hidden [&::-webkit-scrollbar]:hidden"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 snap-start items-center gap-2.5 rounded-[11px] px-3 py-2.5 text-left text-[12px] whitespace-nowrap transition sm:gap-3 lg:w-full lg:shrink ${
                      active
                        ? "bg-[#292522] font-semibold text-white"
                        : "text-[#514b47] hover:bg-[#f5f3f1]"
                    }`}
                  >
                    <Icon
                      size={15}
                      strokeWidth={1.8}
                      className={`shrink-0 ${
                        active ? "text-[#f26422]" : "text-[#827a74]"
                      }`}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0">{renderContent()}</div>
        </div>
      </div>
    </main>
  );
}