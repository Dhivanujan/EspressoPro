"use client";

import Image from "next/image";

const orders = [
  {
    id: "#8241",
    status: "Priority",
    time: "12:45",
    late: true,
    button: "READY",
    items: [
      {
        name: "2x Latte",
        notes: ["Oat Milk", "Extra Hot"],
      },
      {
        name: "1x Almond Croissant",
        notes: ["Warmed"],
      },
      {
        name: "1x Avocado Toast",
        notes: ["Add Chili Flakes", "No Onions"],
      },
    ],
  },
  {
    id: "#8242",
    status: "Preparing",
    time: "06:20",
    button: "READY",
    items: [
      {
        name: "3x Flat White",
        notes: ["Regular Milk"],
      },
      {
        name: "2x Pain au Chocolat",
      },
    ],
  },
  {
    id: "#8243",
    status: "New",
    time: "00:45",
    button: "START",
    highlighted: true,
    items: [
      {
        name: "1x V60 Pour Over",
        notes: ["Ethiopia Single Origin"],
      },
      {
        name: "1x Granola Bowl",
        notes: ["Extra Berries"],
      },
    ],
  },
  {
    id: "#8244",
    status: "Preparing",
    time: "04:15",
    button: "READY",
    items: [
      { name: "4x Cappuccino" },
      { name: "4x Blueberry Muffin" },
    ],
  },
  {
    id: "#8245",
    status: "Preparing",
    time: "03:30",
    button: "READY",
    items: [
      { name: "1x Iced Americano" },
      { name: "1x Salmon Bagel" },
    ],
  },
  {
    id: "#8246",
    status: "Preparing",
    time: "02:10",
    button: "READY",
    items: [
      { name: "2x Espresso" },
      { name: "1x Lemon Cake" },
    ],
  },
];

export default function KitchenDisplayPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#170f0a] text-[#f0dfd6]">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#2d241e] lg:flex">
        <div className="p-6">
          <h1 className="text-2xl font-black">EspressoPro</h1>
          <p className="mt-1 text-sm text-[#988a82]">Downtown Branch</p>
        </div>

        <nav className="flex flex-1 flex-col gap-2 px-3">
          {[
            "Dashboard",
            "Point of Sale",
            "Kitchen",
            "Inventory",
            "Settings",
          ].map((item) => (
            <button
              key={item}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                item === "Kitchen"
                  ? "bg-[#febf8c] font-bold text-[#2e1500]"
                  : "text-[#988a82] hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined">
                {item === "Dashboard"
                  ? "dashboard"
                  : item === "Point of Sale"
                  ? "point_of_sale"
                  : item === "Kitchen"
                  ? "skillet"
                  : item === "Inventory"
                  ? "inventory_2"
                  : "settings"}
              </span>

              <span>{item}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-5">
          <button className="w-full rounded-xl bg-[#170f0a] py-3 font-bold text-white transition hover:opacity-90">
            New Order
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#2d241e]/90 px-8 backdrop-blur">
          <div className="flex items-center gap-10">
            <h2 className="text-3xl font-black tracking-tight">
              KITCHEN DISPLAY
            </h2>

            <div className="hidden gap-8 lg:flex">
              <button className="text-sm uppercase tracking-widest text-[#988a82] hover:text-white">
                Analytics
              </button>

              <button className="border-b-2 border-[#82542a] pb-1 text-sm font-bold uppercase tracking-widest text-[#82542a]">
                Orders
              </button>

              <button className="text-sm uppercase tracking-widest text-[#988a82] hover:text-white">
                Staff
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative">
              <span className="material-symbols-outlined">
                notifications
              </span>

              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
            </button>

            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj2AYogoPTDzooVFsJ0S-GCjhkkgdj7NDZT4UmimoE3zIvyTfWSKAVn4b522-8IwCFfdPGSsrs3AJYbpphAcz3PFtKzME77rUDDH-NQyoLn5jW3ozxD8HIIlktLTFB38_OvrQ4eMT8V2lpxeQSvTFHVx6mBcjycQ7Y6xjJSFMO38YdHWHx8f7-DN_cvRle1wFbJqaqJ_-PVmjQAWPtLVH0aa7Hra9rdk1kqd1_5bNw1AeBU5-pTku0dSN_Y0HMz_SzByN3SRqNu1w"
              alt="Manager"
              width={40}
              height={40}
              className="rounded-full border border-white/10 object-cover"
            />
          </div>
        </header>

        {/* Orders Grid */}
        <section className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 lg:grid-cols-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`flex min-h-[480px] flex-col overflow-hidden rounded-2xl border backdrop-blur-sm ${
                  order.highlighted
                    ? "border-[#82542a] bg-white/10 shadow-2xl"
                    : order.late
                    ? "border-red-500/30 bg-white/5"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {/* Header */}
                <div
                  className={`flex items-center justify-between border-b p-5 ${
                    order.late
                      ? "border-red-500/20 bg-red-500/10"
                      : order.highlighted
                      ? "border-[#82542a]/30 bg-[#82542a]/20"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                        order.late
                          ? "bg-red-500 text-white"
                          : order.highlighted
                          ? "bg-white text-[#82542a]"
                          : "bg-[#82542a] text-white"
                      }`}
                    >
                      {order.status}
                    </span>

                    <h3 className="text-3xl font-black">{order.id}</h3>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-3xl font-black ${
                        order.late ? "text-red-400" : "text-white"
                      }`}
                    >
                      {order.time}
                    </p>

                    <span className="text-xs font-bold uppercase tracking-widest text-[#988a82]">
                      {order.late ? "Late" : "In Progress"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6 p-6">
                  {order.items.map((item, index) => (
                    <div key={index}>
                      <h4 className="text-2xl font-bold text-white">
                        {item.name}
                      </h4>

                      {item.notes && (
                        <div className="mt-2 space-y-1 text-sm text-[#988a82]">
                          {item.notes.map((note, noteIndex) => (
                            <p key={noteIndex}>• {note}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-6">
                  <button
                    className={`w-full rounded-xl py-4 text-xl font-black transition active:scale-95 ${
                      order.button === "START"
                        ? "bg-white text-[#170f0a]"
                        : "bg-[#82542a] text-white"
                    }`}
                  >
                    {order.button}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Stats */}
        <footer className="flex h-16 items-center justify-between border-t border-white/10 bg-[#2d241e] px-8">
          <div className="flex gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>1 OVERDUE</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#82542a]" />
              <span>5 ACTIVE</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#988a82]" />
              <span>AVG TIME: 6:12</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-[#988a82]">
              Clear All
            </button>

            <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-widest text-[#988a82]">
              View History
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
