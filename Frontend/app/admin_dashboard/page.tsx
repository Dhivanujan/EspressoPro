// app/admin_dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { apiGet } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import {
  Receipt,
  DollarSign,
  Users,
  Loader2,
  ShoppingBag,
  Award,
  TrendingUp,
  Sparkles
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

interface LoyaltySummary {
  total_members: number;
  new_registrations_30d: number;
  active_members: number;
  inactive_members: number;
  total_points_earned: number;
  total_points_redeemed: number;
  tier_distribution: Record<string, number>;
  revenue_loyalty_members: number;
  revenue_guest_sales: number;
}

interface LoyalCustomerLeaderboardItem {
  customer_id: string;
  name: string;
  phone: string;
  tier: string;
  loyalty_points: number;
  lifetime_spending: number;
  visit_count: number;
}

interface AnalyticsData {
  revenue_summary: RevenueSummary;
  sales_history: SalesDataPoint[];
  top_items: TopSellingItem[];
  order_stats: OrderStats;
  loyalty_summary?: LoyaltySummary;
  loyal_customers?: LoyalCustomerLeaderboardItem[];
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
  const { user } = useAuth();
  const router = useRouter();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

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
        loyalty_summary: fetchedAnalytics.loyalty_summary ? {
          ...fetchedAnalytics.loyalty_summary,
          revenue_loyalty_members: Number(fetchedAnalytics.loyalty_summary.revenue_loyalty_members),
          revenue_guest_sales: Number(fetchedAnalytics.loyalty_summary.revenue_guest_sales),
        } : undefined,
        loyal_customers: fetchedAnalytics.loyal_customers?.map((item) => ({
          ...item,
          lifetime_spending: Number(item.lifetime_spending),
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
          <p className="text-gray-500 font-semibold font-sans">Generating coffee shop analytics...</p>
        </main>
      </div>
    );
  }

  const stats = data?.revenue_summary;
  const history = data?.sales_history || [];
  const topProducts = data?.top_items || [];
  const ordersCount = data?.order_stats;
  const loyalty = data?.loyalty_summary;
  const leaderboard = data?.loyal_customers || [];

  // Find max sales value to normalize chart bar heights
  const maxRevenue = history.length > 0 
    ? Math.max(...history.map((h) => h.revenue)) 
    : 100;

  // Compute revenue shares
  const revLoyalty = loyalty?.revenue_loyalty_members || 0;
  const revGuest = loyalty?.revenue_guest_sales || 0;
  const totalCRMRev = revLoyalty + revGuest;
  const loyaltyRevPct = totalCRMRev > 0 ? (revLoyalty / totalCRMRev) * 100 : 0;

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
              className="px-4 py-2 border text-xs font-bold bg-white rounded-xl hover:bg-gray-50 transition active:scale-95 shadow-xs"
            >
              Refresh Data
            </button>
          </div>
        </header>

        <div className="p-10 space-y-8 flex-1 overflow-y-auto">
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
                change="All-time gross sales"
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
                change="Per checkout average"
                icon={<ShoppingBag size={24} />}
              />
              <KPI_Card
                title="Loyal Members"
                value={loyalty ? loyalty.total_members.toString() : "0"}
                change={loyalty ? `+${loyalty.new_registrations_30d} this month` : "Active program members"}
                icon={<Users size={24} />}
              />
            </div>
          )}

          {/* CRM Loyalty Overview Row */}
          {loyalty && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Membership VIP Distribution */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="text-amber-500 w-5 h-5 animate-pulse" />
                    <h3 className="text-base font-bold">Membership VIP Tier Distribution</h3>
                  </div>
                  <p className="text-slate-400 text-xs">Customer segmentation counts</p>
                </div>

                <div className="space-y-3.5 my-6">
                  {["Platinum", "Gold", "Silver", "Bronze"].map((tier) => {
                    const count = loyalty.tier_distribution[tier] || 0;
                    const maxCount = Math.max(...Object.values(loyalty.tier_distribution), 1);
                    const widthPct = (count / maxCount) * 100;
                    
                    const tierStyles: Record<string, { bg: string, bar: string }> = {
                      Platinum: { bg: "bg-purple-50 text-purple-700", bar: "from-purple-600 to-indigo-500" },
                      Gold: { bg: "bg-yellow-50 text-yellow-700", bar: "from-amber-500 to-yellow-400" },
                      Silver: { bg: "bg-gray-50 text-gray-600", bar: "from-gray-500 to-slate-400" },
                      Bronze: { bg: "bg-orange-50 text-orange-700", bar: "from-orange-500 to-red-400" }
                    };
                    const styles = tierStyles[tier];

                    return (
                      <div key={tier} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-700">{tier} Class</span>
                          <span className="font-mono text-gray-500 font-bold">{count} members</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${styles.bar}`}
                            style={{ width: `${Math.max(widthPct, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-slate-50 border rounded-xl flex justify-between text-xs font-bold text-slate-500">
                  <span>New Members (30d):</span>
                  <span className="text-[#82542a] font-black">+{loyalty.new_registrations_30d} registered</span>
                </div>
              </div>

              {/* Loyalty Revenue Share & Points Activity */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="text-emerald-500 w-5 h-5" />
                    <h3 className="text-base font-bold">POS Loyalty Revenue Share</h3>
                  </div>
                  <p className="text-slate-400 text-xs">Members checkouts vs guest client sales</p>
                </div>

                {/* Visual Ring progress bars */}
                <div className="my-6 space-y-4">
                  <div className="flex justify-center py-2">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* Simple visual HTML Circular ring using SVG */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="54" className="stroke-slate-100 fill-none stroke-[10]" />
                        <circle cx="64" cy="64" r="54" className="stroke-amber-600 fill-none stroke-[10] transition-all duration-500"
                                strokeDasharray={339}
                                strokeDashoffset={339 - (339 * loyaltyRevPct) / 100}
                                strokeLinecap="round" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-[#170f0a]">{loyaltyRevPct.toFixed(0)}%</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">CRM Share</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-600">
                        <span className="w-2.5 h-2.5 bg-amber-600 rounded-xs" />
                        Loyalty Members
                      </div>
                      <span className="font-extrabold text-gray-900">${revLoyalty.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-gray-600">
                        <span className="w-2.5 h-2.5 bg-slate-200 rounded-xs" />
                        Guest Sales
                      </div>
                      <span className="font-extrabold text-gray-500">${revGuest.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex justify-between text-xs text-amber-800 font-bold">
                  <span>Points Redeemed:</span>
                  <span className="font-black text-amber-700">{loyalty.total_points_redeemed.toLocaleString()} pts</span>
                </div>
              </div>

              {/* Kitchen Workload & Peak Station Stats */}
              {ordersCount && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold">Active Station Status</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Kitchen workload statistics</p>
                  </div>

                  <div className="space-y-3.5 my-6">
                    <div className="flex justify-between items-center bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-100 font-bold text-xs">
                      <span>Completed Tickets</span>
                      <span>{ordersCount.completed}</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-50 text-blue-800 p-2.5 rounded-xl border border-blue-100 font-bold text-xs">
                      <span>Preparing Tickets</span>
                      <span>{ordersCount.preparing}</span>
                    </div>
                    <div className="flex justify-between items-center bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-100 font-bold text-xs">
                      <span>Pending Tickets</span>
                      <span>{ordersCount.pending}</span>
                    </div>
                    <div className="flex justify-between items-center bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-100 font-bold text-xs">
                      <span>Cancelled Tickets</span>
                      <span>{ordersCount.cancelled}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#febf8c]/15 border border-[#febf8c]/20">
                    <p className="text-[10px] text-[#794c23] leading-relaxed">
                      <span className="font-bold">Barista Alert:</span> Daily coffee demand is highest on mornings and weekends. Ensure ingredients are well stocked.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sales Trends Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs">
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
                      <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition shadow font-bold shrink-0 pointer-events-none z-10 font-sans">
                        ${dp.revenue.toFixed(2)}
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-[#82542a] to-[#febf8c] group-hover:opacity-85 transition-all duration-300 shadow-xs"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold font-sans">{dp.label.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Grid: Leaderboards, Beverages & Critical Alerts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Top Loyalty Leaderboard */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs xl:col-span-2">
              <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
                  <h3 className="text-lg font-bold text-gray-900">Loyal Members Leaderboard</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">By gross spending contributions</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-extrabold uppercase border-b border-gray-100">
                      <th className="px-4 py-3">Rank</th>
                      <th className="px-4 py-3">Customer Profile</th>
                      <th className="px-4 py-3">VIP Class</th>
                      <th className="px-4 py-3">Points</th>
                      <th className="px-4 py-3">Lifetime Spent</th>
                      <th className="px-4 py-3 text-right">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-400">No member transactions recorded.</td>
                      </tr>
                    ) : (
                      leaderboard.map((item, idx) => (
                        <tr key={item.customer_id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-4 py-4 font-black text-slate-900">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-950">{item.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{item.phone}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              item.tier === "Platinum" ? "bg-purple-50 text-purple-700 border-purple-200" :
                              item.tier === "Gold" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                              item.tier === "Silver" ? "bg-gray-50 text-gray-600 border-gray-200" : "bg-orange-50 text-orange-700 border-orange-200"
                            }`}>
                              {item.tier}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-800">{item.loyalty_points} pts</td>
                          <td className="px-4 py-4 font-bold text-emerald-600">${item.lifetime_spending.toFixed(2)}</td>
                          <td className="px-4 py-4 text-right font-bold text-gray-600">{item.visit_count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Beverages List */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6.5 shadow-xs">
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold">Top Beverages</h3>
                <span className="text-xs font-bold text-slate-400">By quantity</span>
              </div>

              <div className="space-y-3.5">
                {topProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">No products sold yet.</p>
                ) : (
                  topProducts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition border border-gray-50 bg-[#faf8f5]/40"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#82542a] flex items-center justify-center font-black text-xs">
                        #{idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{p.product_name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Barista brew</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs text-slate-900">{p.quantity_sold} sold</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                          +${p.revenue_generated.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Supply Low Stock Alerts Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-6.5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold">Critical Supply Alerts</h3>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-red-100 text-red-700 animate-pulse">
                {alerts.length} Low Stock
              </span>
            </div>

            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase border-b border-gray-100">
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
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50 transition bg-red-50/5">
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
