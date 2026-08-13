"use client";

import { useState } from "react";
import {
  ExternalLink,
  Plus,
  Circle,
} from "lucide-react";

type Tab = {
  label: string;
  count: number;
};

const tabs: Tab[] = [
  { label: "Homepage Hero", count: 3 },
  { label: "Banners", count: 4 },
  { label: "Recipes", count: 4 },
  { label: "Blog", count: 3 },
  { label: "FAQs", count: 4 },
  { label: "Pages", count: 4 },
];

const recipes = [
  {
    name: "Smoky Suya Ribeye Skewers",
    author: "Chef Ify",
    category: "Beef",
    reads: "12,840",
    status: "published",
  },
  {
    name: "Pepper Soup with Goat Stew Cuts",
    author: "Chef Ify",
    category: "Goat",
    reads: "9,612",
    status: "published",
  },
  {
    name: "Garlic Butter King Prawns",
    author: "Chef Tola",
    category: "Seafood",
    reads: "7,204",
    status: "published",
  },
  {
    name: "Weeknight Chicken Yassa",
    author: "Chef Tola",
    category: "Chicken",
    reads: "0",
    status: "draft",
  },
];

const heroItems = [
  {
    title: "Shop Fresh. Cook Better.",
    description:
      "Premium beef, chicken, seafood and more — expertly portioned.",
    button: "Shop Now",
    status: "live",
    date: "Updated Aug 7, 2026",
  },
  {
    title: "The Cold Chain Promise",
    description:
      "Every cut travels at -18°C from our cold room to your door.",
    button: "Learn More",
    status: "live",
    date: "Updated Aug 1, 2026",
  },
  {
    title: "Detty December Packs",
    description:
      "Pre-order party bundles for the festive rush.",
    button: "Pre-order",
    status: "draft",
    date: "Updated Jul 22, 2026",
  },
];

const deliveryLocations = [
  "Lekki Phase 1",
  "Victoria Island",
  "Ikoyi",
  "Ikeja GRA",
  "Yaba",
  "Ajah",
  "Abuja (Maitama)",
  "Ibadan",
];

function StatusBadge({
  status,
}: {
  status: "live" | "published" | "draft";
}) {
  const isDraft = status === "draft";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
        "text-[11px] font-semibold",
        isDraft
          ? "bg-[#fff8e7] text-[#c77b00]"
          : "bg-[#e9faf3] text-[#009765]",
      ].join(" ")}
    >
      <Circle
        className="h-[6px] w-[6px] fill-current stroke-0"
      />
      {status}
    </span>
  );
}

export default function ContentManagementPage() {
  const [activeTab, setActiveTab] = useState("Homepage Hero");

  return (
    <main className="min-h-screen bg-[#f7f8f9] px-5 py-8 text-[#302d29] md:px-8 lg:px-10">
      <div className="mx-auto max-w-[1260px]">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.5px]">
              Content Management
            </h1>

            <p className="mt-2 max-w-[700px] text-[14px] leading-6 text-[#8d8780]">
              Everything customers read on the storefront — hero slides,
              banners, recipes, blog, FAQs and static pages.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ddd8d2] bg-white px-4 text-[14px] font-medium text-[#38342f] shadow-sm transition hover:bg-[#faf9f8]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
              Preview Site
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl bg-[#f15b2a] px-4 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#df4e20]"
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
              New Content
            </button>
          </div>
        </header>

        {/* Main content card */}
        <section className="overflow-hidden rounded-[20px] border border-[#e8e4e0] bg-white shadow-[0_4px_18px_rgba(35,30,25,0.05)]">
          {/* Tabs */}
          <div className="flex min-h-[55px] items-center gap-1 overflow-x-auto border-b border-[#e8e4e0] px-4 py-2 md:px-4">
            {tabs.map((tab) => {
              const active = activeTab === tab.label;

              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setActiveTab(tab.label)}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-[13px] px-3.5 py-2.5",
                    "text-[13px] font-semibold transition",
                    active
                      ? "bg-[#2d2925] text-white"
                      : "text-[#655e57] hover:bg-[#f5f3f1]",
                  ].join(" ")}
                >
                  {tab.label}

                  <span
                    className={[
                      "flex h-[19px] min-w-[19px] items-center justify-center rounded-full px-1",
                      "text-[11px] font-semibold",
                      active
                        ? "bg-[#514c47] text-white"
                        : "bg-[#eeecea] text-[#6f6963]",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === "Recipes" ? (
            <RecipeTable />
          ) : activeTab === "Homepage Hero" ? (
            <HeroCards />
          ) : (
            <EmptyTab tab={activeTab} />
          )}
        </section>

        {/* Delivery locations */}
        <section className="mt-7 rounded-[20px] border border-[#e8e4e0] bg-white px-6 py-5 shadow-[0_7px_25px_rgba(35,30,25,0.07)]">
          <h2 className="text-[15px] font-semibold text-[#393530]">
            Delivery locations page
          </h2>

          <p className="mt-0.5 text-[12px] text-[#918a83]">
            Zones published to the storefront delivery checker
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {deliveryLocations.map((location) => (
              <span
                key={location}
                className="rounded-full bg-[#ebe9e7] px-3 py-1 text-[11px] font-semibold text-[#57514b]"
              >
                {location}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function HeroCards() {
  return (
    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
      {heroItems.map((item) => (
        <article
          key={item.title}
          className="overflow-hidden rounded-[16px] border border-[#e5e1dd] bg-white"
        >
          {/* Hero preview */}
          <div className="flex h-[136px] flex-col items-center justify-center bg-[#2d2925] px-5 text-center">
            <h3 className="text-[17px] font-bold text-white">
              {item.title}
            </h3>

            <button
              type="button"
              className="mt-3 rounded-[9px] bg-[#f15b2a] px-3.5 py-1.5 text-[11px] font-bold text-white"
            >
              {item.button}
            </button>
          </div>

          {/* Card details */}
          <div className="p-4">
            <p className="min-h-[42px] text-[13px] leading-5 text-[#665f58]">
              {item.description}
            </p>

            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={item.status as "live" | "draft"} />

              <span className="text-[11px] text-[#918a83]">
                {item.date}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function RecipeTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="border-b border-[#e7e3df] bg-[#fcfbfa] text-left">
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.02em] text-[#8a837c]">
              Recipe
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-[#8a837c]">
              Author
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-[#8a837c]">
              Category
            </th>
            <th className="px-5 py-3 text-right text-[11px] font-semibold text-[#8a837c]">
              Reads
            </th>
            <th className="px-5 py-3 text-[11px] font-semibold text-[#8a837c]">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {recipes.map((recipe) => (
            <tr
              key={recipe.name}
              className="border-b border-[#eeeae7] last:border-b-0"
            >
              <td className="px-5 py-[16px] text-[13px] font-semibold text-[#393530]">
                {recipe.name}
              </td>

              <td className="px-5 py-[16px] text-[13px] text-[#554f49]">
                {recipe.author}
              </td>

              <td className="px-5 py-[16px] text-[13px] text-[#554f49]">
                {recipe.category}
              </td>

              <td className="px-5 py-[16px] text-right text-[13px] text-[#554f49]">
                {recipe.reads}
              </td>

              <td className="px-5 py-[16px]">
                <StatusBadge
                  status={recipe.status as "published" | "draft"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyTab({ tab }: { tab: string }) {
  return (
    <div className="flex min-h-[270px] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f1efed]">
          <span className="text-lg">+</span>
        </div>

        <h3 className="mt-3 text-[15px] font-semibold">
          {tab}
        </h3>

        <p className="mt-1 text-[13px] text-[#918a83]">
          Manage your {tab.toLowerCase()} content here.
        </p>
      </div>
    </div>
  );
}