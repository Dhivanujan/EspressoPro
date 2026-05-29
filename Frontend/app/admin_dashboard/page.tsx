// app/admin_dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { apiGet } from "../../lib/api";
import {
  Receipt,
  DollarSign,
  Users,
  Loader2,
  ShoppingBag,
} from "lucide-react";

interface RevenueSummary {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
}

interface SalesDataPoint {
  label: string;
  revenue: number;
  order_count: number;
}

interface TopSellingItem {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue_generated: number;
}

interface OrderStats {
  pending: number;
  preparing: number;
  completed: number;
  cancelled: number;
}

interface AnalyticsData {
  revenue_summary: RevenueSummary;
  sales_history: SalesDataPoint[];
  top_items: TopSellingItem[];
  order_stats: OrderStats;
}

interface LowStockAlert {
  item_type: string;
  item_id: string;
  name: string;
  current_stock: number;
  threshold: number;
  unit?: string;
}

export default function EspressoProDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const fetchedAnalytics = await apiGet<AnalyticsData>("/api/v1/analytics/dashboard");
      const formattedAnalytics: AnalyticsData = {
        ...fetchedAnalytics,
        revenue_summary: {
          ...fetchedAnalytics.revenue_summary,
          total_revenue: Number(fetchedAnalytics.revenue_summary.total_revenue),
          average_order_value: Number(fetchedAnalytics.revenue_summary.average_order_value),
        },
        sales_history: fetchedAnalytics.sales_history.map((item) => ({
          ...item,
          revenue: Number(item.revenue),
        })),
        top_items: fetchedAnalytics.top_items.map((item) => ({
          ...item,
          revenue_generated: Number(item.revenue_generated),
        })),
      };
      setData(formattedAnalytics);

      const fetchedAlerts = await apiGet<LowStockAlert[]>("/api/v1/inventory/alerts");
      setAlerts(fetchedAlerts);
    } catch (err) {
      console.error("Failed to load admin analytics", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#82542a]" size={36} />
          <p className="text-gray-500 font-semibold">Generating coffee shop analytics...</p>
        </main>
      </div>
    );
  }

  const stats = data?.revenue_summary;
  const history = data?.sales_history || [];
  const topProducts = data?.top_items || [];
  const ordersCount = data?.order_stats;

  // Find max sales value to normalize chart bar heights
  const maxRevenue = history.length > 0 
    ? Math.max(...history.map((h) => h.revenue)) 
    : 100;

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-slate-900 flex font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <div>
            <h1 className="text-xl font-black text-[#170f0a]">Admin Insights</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Real-time Business Performance
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 px-3.5 py-2 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Sync Active
            </div>
            
            <button
              onClick={loadData}
              className="px-4 py-2 border text-xs font-bold bg-white rounded-xl hover:bg-gray-50 transition"
            >
              Refresh Data
            </button>
          </div>
        </header>

        <div className="p-10 space-y-8 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#170f0a]">
                Branch Performance
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Historical order analytics, product counts, and supply health.
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <KPI_Card
                title="Gross Revenue"
                value={`$${stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                change="All-time gross"
                icon={<DollarSign size={24} />}
              />
              <KPI_Card
                title="Total Tickets"
                value={stats.total_orders.toString()}
                change="Completed orders"
                icon={<Receipt size={24} />}
              />
              <KPI_Card
                title="Ticket Average"
                value={`$${stats.average_order_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                change="Per customer average"
                icon={<ShoppingBag size={24} />}
              />
              <KPI_Card
                title="Pending Tickets"
                value={((ordersCount?.pending || 0) + (ordersCount?.preparing || 0)).toString()}
                change="In queue & prep"
                icon={<Users size={24} />}
              />
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Sales Trends Chart */}
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-6.5 shadow-xs">
              <div className="mb-8">
                <h3 className="text-lg font-bold">Historical Daily Revenue</h3>
                <p className="text-slate-400 text-xs mt-0.5">Last 7 days trend analysis</p>
              </div>

              <div className="h-64 flex items-end gap-5 border-b border-gray-100 pb-3">
                {history.map((dp, idx) => {
                  const pct = maxRevenue > 0 ? (dp.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="relative w-full h-full flex flex-col justify-end">
                        {/* Tooltip on hover */}
                        <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition shadow font-bold shrink-0 pointer-events-none z-10">
                          ${dp.revenue.toFixed(2)}
                        </div>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#82542a] to-[#febf8c] group-hover:opacity-85 transition-all duration-300 shadow-xs"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{dp.label.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kitchen stats / Peak density */}
            {ordersCount && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6.5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold">Active Station Status</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Kitchen workload statistics</p>
                </div>

                <div className="space-y-4 my-6">
                  <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 font-bold text-sm">
                    <span>Completed Tickets</span>
                    <span>{ordersCount.completed}</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 font-bold text-sm">
                    <span>Preparing Tickets</span>
                    <span>{ordersCount.preparing}</span>
                  </div>
                  <div className="flex justify-between items-center bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100 font-bold text-sm">
                    <span>Pending Tickets</span>
                    <span>{ordersCount.pending}</span>
                  </div>
                  <div className="flex justify-between items-center bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 font-bold text-sm">
                    <span>Cancelled Tickets</span>
                    <span>{ordersCount.cancelled}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#febf8c]/15 border border-[#febf8c]/20">
                  <p className="text-xs text-[#794c23] leading-relaxed">
                    <span className="font-bold">Barista Alert:</span> Daily coffee demand is highest on mornings and weekends. Ensure ingredients are well stocked.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Grid: Products & Inventory */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6.5 shadow-xs">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold">Top Selling Beverages</h3>
                <span className="text-xs font-bold text-slate-400">By quantity sold</span>
              </div>

              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">No products sold yet.</p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition border border-gray-50"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#82542a] flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-slate-900">{p.product_name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Barista product</p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-sm text-slate-900">{p.quantity_sold} units sold</p>
                        <p className="text-xs font-bold text-emerald-600 mt-0.5">
                          +${p.revenue_generated.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Inventory Alerts */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-6.5 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold">Critical Supply Alerts</h3>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  {alerts.length} Low
                </span>
              </div>

              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase border-b">
                    <tr>
                      <th className="px-6 py-4">Item Name</th>
                      <th className="px-6 py-4">Stock Level</th>
                      <th className="px-6 py-4">Threshold</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alerts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-10 text-sm text-gray-500">
                          All supply items have healthy stock levels!
                        </td>
                      </tr>
                    ) : (
                      alerts.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50 transition bg-red-50/10">
                          <td className="px-6 py-4.5 font-bold text-sm text-slate-900">{item.name}</td>
                          <td className="px-6 py-4.5 font-bold text-sm text-red-600">
                            {item.current_stock.toLocaleString()} {item.unit || "units"}
                          </td>
                          <td className="px-6 py-4.5 text-xs text-slate-400">
                            {item.threshold.toLocaleString()} {item.unit || "units"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPI_Card({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[#febf8c]/25 text-[#82542a] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">{title}</span>
      </div>

      <h3 className="text-2xl font-black tracking-tight text-[#170f0a]">{value}</h3>
      <p className="text-[10px] text-slate-400 font-bold mt-1.5">{change}</p>
    </div>
  );
}
