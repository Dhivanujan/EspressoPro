"use client";

import React from "react";

const inventoryItems = [
  {
    name: "Dark Roast Espresso",
    supplier: "Highlands Signature",
    category: "Beans",
    stock: 12.5,
    unit: "kg",
    status: "In Stock",
    progress: 65,
    icon: "coffee",
    critical: false,
  },
  {
    name: "Organic Whole Milk",
    supplier: "Valley Dairy Co.",
    category: "Dairy",
    stock: 4,
    unit: "Liters",
    status: "Low Stock",
    progress: 15,
    icon: "water_drop",
    critical: true,
  },
  {
    name: "Barista Oat Milk",
    supplier: "Oatly Professional",
    category: "Alt Milk",
    stock: 24,
    unit: "Liters",
    status: "In Stock",
    progress: 80,
    icon: "eco",
    critical: false,
  },
  {
    name: "Vanilla Bean Syrup",
    supplier: "SweetSource Distro",
    category: "Syrups",
    stock: 2,
    unit: "Bottles",
    status: "Critical",
    progress: 10,
    icon: "liquor",
    critical: true,
  },
  {
    name: "Butter Croissants",
    supplier: "Local Bakery Hub",
    category: "Bakery",
    stock: 18,
    unit: "Units",
    status: "In Stock",
    progress: 45,
    icon: "cake",
    critical: false,
  },
];

const stats = [
  {
    title: "Total Items",
    value: "142",
    subtitle: "+12 from last week",
    icon: "inventory",
  },
  {
    title: "Low Stock",
    value: "08",
    subtitle: "Requires attention",
    icon: "warning",
  },
  {
    title: "In Transit",
    value: "04",
    subtitle: "Due by Thursday",
    icon: "local_shipping",
  },
  {
    title: "Monthly Spend",
    value: "$4,280",
    subtitle: "82% of budget used",
    icon: "payments",
  },
];

export default function InventoryManagementPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 border-r border-[#d1c4bd]/30 bg-white flex flex-col z-50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#170f0a] flex items-center justify-center">
              <span className="material-symbols-outlined text-white">
                local_cafe
              </span>
            </div>

            <div>
              <h1 className="text-xl font-bold">EspressoPro</h1>
              <p className="text-xs uppercase tracking-widest text-[#4e4540]">
                Downtown Branch
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {[
            ["dashboard", "Dashboard"],
            ["point_of_sale", "Point of Sale"],
            ["skillet", "Kitchen"],
          ].map(([icon, label]) => (
            <button
              key={label}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#e5eeff] transition"
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}

          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-[#febf8c] text-[#794c23] font-bold">
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="text-sm">Inventory</span>
          </button>

          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#e5eeff] transition">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-3 border-t border-[#d1c4bd]/20">
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#e5eeff] transition">
            <span className="material-symbols-outlined text-red-500">
              logout
            </span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="fixed top-0 left-72 right-0 h-20 bg-white/80 backdrop-blur border-b border-[#d1c4bd]/20 z-40 flex items-center justify-between px-10">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4e4540]">
            search
          </span>

          <input
            type="text"
            placeholder="Search inventory items..."
            className="w-full rounded-xl bg-[#eff4ff] py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#82542a]/30"
          />
        </div>

        <div className="flex items-center gap-5">
          <button className="relative p-2 rounded-full hover:bg-[#eff4ff]">
            <span className="material-symbols-outlined">notifications</span>

            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src="https://i.pravatar.cc/100"
              alt="manager"
              className="w-10 h-10 rounded-full border"
            />

            <div>
              <p className="text-sm font-bold">Alex Rivera</p>
              <p className="text-[10px] uppercase tracking-widest text-[#4e4540]">
                Store Manager
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="ml-72 pt-24 px-10 pb-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-[#170f0a] mb-1">
              Inventory Management
            </h2>

            <p className="text-[#4e4540]">
              Track, manage and optimize your branch supplies.
            </p>
          </div>

          <button className="bg-[#170f0a] hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 transition">
            <span className="material-symbols-outlined">add</span>
            Add New Item
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-2xl border border-[#d1c4bd]/30 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#eff4ff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#82542a]">
                    {stat.icon}
                  </span>
                </div>

                <span className="text-[10px] uppercase tracking-widest text-[#4e4540] font-bold">
                  {stat.title}
                </span>
              </div>

              <h3 className="text-3xl font-bold text-[#170f0a]">
                {stat.value}
              </h3>

              <p className="text-xs text-[#4e4540] mt-1">{stat.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Filters */}
          <aside className="w-full xl:w-64 space-y-8">
            <div>
              <h3 className="text-xs uppercase tracking-widest font-bold text-[#4e4540] mb-4">
                Categories
              </h3>

              <div className="space-y-2">
                {[
                  ["Coffee Beans", "12"],
                  ["Dairy & Alt Milk", "42"],
                  ["Syrups & Sauces", "18"],
                  ["Bakery", "14"],
                ].map(([label, count]) => (
                  <label
                    key={label}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer"
                  >
                    <input type="checkbox" defaultChecked />

                    <span className="text-sm font-medium">{label}</span>

                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-[#eff4ff] text-[#4e4540]">
                      {count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-[#2d241e] rounded-2xl p-6 text-white">
              <h4 className="font-bold mb-2">Automated Ordering</h4>

              <p className="text-sm opacity-70 mb-4">
                Smart replenish is active for 12 items.
              </p>

              <button className="w-full py-3 rounded-xl bg-[#82542a] font-bold hover:opacity-90 transition">
                Manage Rule
              </button>
            </div>
          </aside>

          {/* Table */}
          <div className="flex-1 overflow-hidden rounded-2xl border border-[#d1c4bd]/30 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#eff4ff]/60">
                  <tr>
                    {[
                      "Item Name",
                      "Category",
                      "Stock Level",
                      "Unit",
                      "Status",
                      "",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-6 py-4 text-left text-xs uppercase tracking-widest text-[#4e4540]"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {inventoryItems.map((item) => (
                    <tr
                      key={item.name}
                      className={`border-t border-[#d1c4bd]/10 hover:bg-[#f8f9ff] transition ${
                        item.critical ? "bg-red-50/50" : ""
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#170f0a]">
                              {item.icon}
                            </span>
                          </div>

                          <div>
                            <p className="font-bold text-[#170f0a]">
                              {item.name}
                            </p>

                            <p className="text-xs text-[#4e4540]">
                              {item.supplier}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-[#4e4540]">
                        {item.category}
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <p
                            className={`font-bold ${
                              item.critical
                                ? "text-red-600"
                                : "text-[#170f0a]"
                            }`}
                          >
                            {item.stock}
                          </p>

                          <div className="w-24 h-2 rounded-full bg-[#eff4ff] overflow-hidden">
                            <div
                              className={`h-full ${
                                item.critical
                                  ? "bg-red-500"
                                  : "bg-[#82542a]"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-[#4e4540]">
                        {item.unit}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold ${
                            item.critical
                              ? "bg-red-100 text-red-700"
                              : "bg-[#febf8c]/20 text-[#794c23]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button className="hover:text-[#170f0a] text-[#4e4540]">
                          <span className="material-symbols-outlined">
                            more_vert
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#d1c4bd]/10 bg-[#eff4ff]/20">
              <p className="text-xs text-[#4e4540]">
                Showing 5 of 142 items
              </p>

              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-md hover:bg-[#eff4ff]">
                  ←
                </button>

                <button className="w-8 h-8 rounded-md bg-[#82542a] text-white text-sm font-bold">
                  1
                </button>

                <button className="w-8 h-8 rounded-md hover:bg-[#eff4ff]">
                  2
                </button>

                <button className="w-8 h-8 rounded-md hover:bg-[#eff4ff]">
                  3
                </button>

                <button className="w-8 h-8 rounded-md hover:bg-[#eff4ff]">
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}