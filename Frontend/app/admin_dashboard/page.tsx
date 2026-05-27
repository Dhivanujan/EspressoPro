export default function EspressoProDashboard() {
  const stats = [
    {
      title: "Today's Revenue",
      value: "$4,282.50",
      change: "+12.5%",
      icon: "payments",
    },
    {
      title: "Total Orders",
      value: "184",
      change: "+8.2%",
      icon: "receipt_long",
    },
    {
      title: "Avg. Order Value",
      value: "$23.28",
      change: "-0.4%",
      icon: "shopping_bag",
    },
    {
      title: "Active Staff",
      value: "6",
      change: "On Duty",
      icon: "groups",
    },
  ];

  const products = [
    {
      name: "Signature Oat Milk Latte",
      category: "Beverage",
      price: "$5.50",
      sold: "142 units",
      revenue: "+$781.00",
      image:
        "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Avocado & Chili Toast",
      category: "Food",
      price: "$12.00",
      sold: "98 units",
      revenue: "+$1,176.00",
      image:
        "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=400&auto=format&fit=crop",
    },
    {
      name: "Nitro Cold Brew",
      category: "Beverage",
      price: "$6.25",
      sold: "86 units",
      revenue: "+$537.50",
      image:
        "https://images.unsplash.com/photo-1517701550927-30cf4ba1fdfd?q=80&w=400&auto=format&fit=crop",
    },
  ];

  const inventory = [
    {
      item: "Ethiopian Roast (Whole Bean)",
      category: "Roastery",
      stock: "2.4 kg",
      status: "Low",
      danger: true,
    },
    {
      item: "Oat Milk (Barista Edition)",
      category: "Dairy/Alt",
      stock: "12 L",
      status: "Low",
      danger: true,
    },
    {
      item: "Biodegradable Takeaway Cups",
      category: "Supplies",
      stock: "150 units",
      status: "Reorder Soon",
      danger: false,
    },
    {
      item: "Cinnamon Swirls",
      category: "Bakery",
      stock: "4 units",
      status: "Out Soon",
      danger: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-slate-200 flex flex-col z-50">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2d241e] text-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined">coffee</span>
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#170f0a]">
                EspressoPro
              </h1>
              <p className="text-sm text-slate-500">Downtown Branch</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            ["dashboard", "Dashboard", true],
            ["point_of_sale", "Point of Sale", false],
            ["skillet", "Kitchen", false],
            ["inventory_2", "Inventory", false],
            ["groups", "Staff", false],
            ["settings", "Settings", false],
          ].map(([icon, label, active]) => (
            <button
              key={label}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                active
                  ? "bg-[#febf8c] text-[#2e1500] shadow-md"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-semibold">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button className="w-full py-3 rounded-2xl bg-[#170f0a] text-white font-bold shadow-lg hover:opacity-90 transition">
            New Order
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-72 flex-1">
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                search
              </span>

              <input
                type="text"
                placeholder="Search analytics, products, staff..."
                className="w-96 pl-12 pr-4 py-3 rounded-2xl bg-slate-100 border border-slate-200 outline-none focus:border-[#82542a]"
              />
            </div>

            <div className="hidden lg:flex items-center gap-6 text-sm font-bold uppercase tracking-wider">
              <button className="text-[#82542a] border-b-2 border-[#82542a] pb-1">
                Analytics
              </button>
              <button className="text-slate-500 hover:text-slate-900">
                Orders
              </button>
              <button className="text-slate-500 hover:text-slate-900">
                Reports
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-green-600 text-sm font-semibold bg-green-50 px-3 py-2 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Sync
            </div>

            <button className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:shadow-md transition">
              <span className="material-symbols-outlined">
                notifications
              </span>
            </button>

            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
              alt="profile"
              className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-md"
            />
          </div>
        </header>

        <div className="p-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-black tracking-tight text-[#170f0a]">
                Performance Overview
              </h2>
              <p className="text-slate-500 mt-2 text-lg">
                Real-time insights for EspressoPro Downtown Branch.
              </p>
            </div>

            <button className="px-5 py-3 rounded-2xl bg-[#170f0a] text-white font-semibold shadow-lg hover:scale-[1.02] transition">
              Export Report
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#febf8c]/20 text-[#82542a] flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">
                      {stat.icon}
                    </span>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-green-50 text-green-600">
                    {stat.change}
                  </span>
                </div>

                <p className="uppercase tracking-widest text-xs font-bold text-slate-400 mb-2">
                  {stat.title}
                </p>

                <h3 className="text-4xl font-black tracking-tight text-[#170f0a]">
                  {stat.value}
                </h3>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white/80 border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold">Sales Trends</h3>
                  <p className="text-slate-500">
                    Revenue performance over 24 hours
                  </p>
                </div>

                <select className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50">
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                </select>
              </div>

              <div className="h-80 flex items-end gap-3">
                {[40, 55, 85, 95, 80, 60, 45, 70, 90, 100, 75, 50].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-2xl bg-gradient-to-t from-[#82542a] to-[#febf8c] hover:opacity-80 transition-all duration-300"
                      style={{ height: `${height}%` }}
                    />
                  )
                )}
              </div>

              <div className="flex justify-between mt-4 text-sm text-slate-400 font-semibold">
                <span>06:00</span>
                <span>10:00</span>
                <span>14:00</span>
                <span>18:00</span>
                <span>22:00</span>
              </div>
            </div>

            <div className="bg-white/80 border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Peak Hours</h3>
              <p className="text-slate-500 mb-8">
                Store traffic density analysis
              </p>

              <div className="space-y-6">
                {[
                  ["Morning Rush", "94%"],
                  ["Lunch Break", "72%"],
                  ["Afternoon Tea", "88%"],
                  ["Evening Calm", "35%"],
                ].map(([title, value]) => (
                  <div key={title}>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span>{title}</span>
                      <span>{value}</span>
                    </div>

                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#82542a] to-[#febf8c]"
                        style={{ width: value }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-[#febf8c]/20 border border-[#febf8c]/30">
                <p className="text-sm text-[#673d15] leading-relaxed">
                  <span className="font-bold">AI Suggestion:</span> Increase
                  staffing by 1 barista during afternoon tea hours.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Products */}
            <div className="bg-white/80 border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Top Selling Products</h3>

                <button className="text-[#82542a] font-semibold hover:underline">
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-16 h-16 rounded-2xl object-cover"
                    />

                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{product.name}</h4>
                      <p className="text-sm text-slate-500">
                        {product.category} • {product.price}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">{product.sold}</p>
                      <p className="text-sm font-semibold text-green-600">
                        {product.revenue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white/80 border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-2xl font-bold">Inventory Alerts</h3>

                <div className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                  3 Critical
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-6 py-4">Item</th>
                      <th className="text-left px-6 py-4">Category</th>
                      <th className="text-left px-6 py-4">Stock</th>
                      <th className="text-right px-6 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventory.map((item) => (
                      <tr
                        key={item.item}
                        className="border-t border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-5 font-semibold">
                          {item.item}
                        </td>

                        <td className="px-6 py-5 text-slate-500">
                          {item.category}
                        </td>

                        <td className="px-6 py-5 font-semibold">
                          {item.stock}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              item.danger
                                ? "bg-red-100 text-red-600"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center">
                <button className="px-5 py-3 rounded-2xl bg-[#170f0a] text-white font-semibold hover:opacity-90 transition">
                  Generate Purchase Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
