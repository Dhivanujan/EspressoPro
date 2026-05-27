// app/kitchen_display_system/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { apiGet, apiPut } from "../../lib/api";
import { Loader2, Tv, AlertCircle, RefreshCw } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  order_type: string;
  order_status: string;
  created_at: string;
  items: OrderItem[];
}

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders() {
    setRefreshing(true);
    try {
      // Get all orders from the API
      const allOrders = await apiGet<Order[]>("/api/v1/orders");
      // Filter only pending and preparing orders
      const active = allOrders.filter(
        (o) => o.order_status === "pending" || o.order_status === "preparing"
      );
      // Sort oldest first for KDS
      active.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setOrders(active);
    } catch (err) {
      console.error("Failed to load kitchen orders", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // Auto-refresh every 5 seconds for live kitchen updates
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "preparing" : "completed";
    try {
      await apiPut(`/api/v1/orders/${orderId}/status`, {
        order_status: nextStatus,
      });
      // Update local state instantly for snappy UI
      if (nextStatus === "completed") {
        setOrders(orders.filter((o) => o.id !== orderId));
      } else {
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, order_status: "preparing" } : o
          )
        );
      }
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  };

  // Helper to calculate elapsed time in minutes
  const getElapsedTime = (createdAt: string) => {
    const elapsedMs = new Date().getTime() - new Date(createdAt).getTime();
    const mins = Math.floor(elapsedMs / 60000);
    const secs = Math.floor((elapsedMs % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper to check if order is overdue (e.g. > 5 minutes)
  const isOverdue = (createdAt: string) => {
    const elapsedMs = new Date().getTime() - new Date(createdAt).getTime();
    return elapsedMs > 300000; // 5 minutes
  };

  const overdueCount = orders.filter((o) => isOverdue(o.created_at)).length;
  const preparingCount = orders.filter((o) => o.order_status === "preparing").length;
  const pendingCount = orders.filter((o) => o.order_status === "pending").length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#170f0a] text-[#f0dfd6]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main KDS Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#2d241e]/90 px-8 backdrop-blur shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-xl bg-[#82542a] flex items-center justify-center text-white">
              <Tv size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider">KITCHEN MONITOR (KDS)</h2>
              <p className="text-[10px] text-[#988a82] uppercase tracking-widest mt-0.5">
                Active Order Expediter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadOrders}
              className={`p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition ${
                refreshing ? "opacity-50" : ""
              }`}
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
            <span className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 font-bold">
              Station 1
            </span>
          </div>
        </header>

        {/* Orders Grid */}
        <section className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center py-20">
              <Loader2 className="animate-spin text-[#febf8c]" size={36} />
              <p className="text-gray-400 font-semibold">Aligning with terminal tickets...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-3xl p-8 gap-4">
              <Tv size={48} className="text-[#988a82]" />
              <div>
                <p className="font-extrabold text-lg text-white">No active orders!</p>
                <p className="text-sm text-[#988a82] mt-1">Excellent job! All barista tickets are completed.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 lg:grid-cols-2">
              {orders.map((order) => {
                const late = isOverdue(order.created_at);
                const prep = order.order_status === "preparing";
                return (
                  <div
                    key={order.id}
                    className={`flex min-h-[420px] flex-col overflow-hidden rounded-2xl border backdrop-blur-xs transition ${
                      prep
                        ? "border-[#82542a] bg-white/10 shadow-lg"
                        : late
                        ? "border-red-500/30 bg-red-500/5 animate-pulse"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {/* Ticket Header */}
                    <div
                      className={`flex items-center justify-between border-b p-5 ${
                        late
                          ? "border-red-500/20 bg-red-500/20"
                          : prep
                          ? "border-[#82542a]/30 bg-[#82542a]/20"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div>
                        <span
                          className={`rounded px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest shadow-xs ${
                            late
                              ? "bg-red-500 text-white"
                              : prep
                              ? "bg-[#febf8c] text-[#2e1500]"
                              : "bg-white text-black"
                          }`}
                        >
                          {order.order_status}
                        </span>
                        <h3 className="text-xl font-black mt-2 text-white">
                          #{order.order_number.slice(-4)}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className={`text-xl font-black ${late ? "text-red-400" : "text-white"}`}>
                          {getElapsedTime(order.created_at)}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#988a82]">
                          {late ? "Overdue" : "Active"}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 space-y-4.5 p-6 overflow-y-auto">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="text-lg font-bold text-white leading-tight">
                              {item.quantity}x {item.product?.name || "Product"}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="p-5 border-t border-white/5">
                      <button
                        onClick={() => handleUpdateStatus(order.id, order.order_status)}
                        className={`w-full rounded-xl py-3 text-base font-bold transition active:scale-98 shadow-sm ${
                          order.order_status === "pending"
                            ? "bg-white text-black hover:opacity-90"
                            : "bg-[#82542a] text-white hover:bg-[#82542a]/95"
                        }`}
                      >
                        {order.order_status === "pending" ? "START TICKET" : "COMPLETE TICKET"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer Stats Bar */}
        <footer className="flex h-16 items-center justify-between border-t border-white/10 bg-[#2d241e] px-8 shrink-0 text-xs">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${overdueCount > 0 ? "bg-red-500 animate-ping" : "bg-red-500"}`} />
              <span className="font-semibold">{overdueCount} OVERDUE</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#febf8c]" />
              <span className="font-semibold">{preparingCount} IN PROGRESS</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              <span className="font-semibold">{pendingCount} QUEUED</span>
            </div>
          </div>

          <div>
            <span className="text-[#988a82] font-semibold">EspressoPro Live Monitor v1.0</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
