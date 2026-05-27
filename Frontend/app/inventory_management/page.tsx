// app/inventory_management/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { apiGet, apiPost } from "../../lib/api";
import {
  Package,
  AlertTriangle,
  Plus,
  ArrowUpDown,
  History,
  TrendingDown,
  Loader2,
  X,
  Search,
} from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  stock_quantity: number;
  unit: string;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface LowStockAlert {
  item_type: string;
  item_id: string;
  name: string;
  current_stock: number;
  threshold: number;
  unit?: string;
}

interface InventoryLog {
  id: string;
  item_type: string;
  item_id: string;
  change_amount: number;
  reason: string;
  adjusted_by?: string;
  created_at: string;
}

export default function InventoryManagementPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form States
  const [adjustItemType, setAdjustItemType] = useState("ingredient");
  const [adjustItemId, setAdjustItemId] = useState("");
  const [adjustChange, setAdjustChange] = useState("");
  const [adjustReason, setAdjustReason] = useState("restock");

  const [addName, setAddName] = useState("");
  const [addStock, setAddStock] = useState("");
  const [addUnit, setAddUnit] = useState("g");
  const [addThreshold, setAddThreshold] = useState("100");

  async function loadData() {
    setLoading(true);
    try {
      const fetchedIngs = await apiGet<Ingredient[]>("/api/v1/ingredients");
      setIngredients(fetchedIngs);

      const fetchedProds = await apiGet<Product[]>("/api/v1/products");
      setProducts(fetchedProds);

      const fetchedAlerts = await apiGet<LowStockAlert[]>("/api/v1/inventory/alerts");
      setAlerts(fetchedAlerts);

      const fetchedLogs = await apiGet<InventoryLog[]>("/api/v1/inventory/logs");
      setLogs(fetchedLogs.slice(0, 15)); // Show latest 15 logs
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAdjust = (itemType: string, itemId: string) => {
    setAdjustItemType(itemType);
    setAdjustItemId(itemId);
    setAdjustChange("");
    setAdjustReason("restock");
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItemId || !adjustChange) return;
    setModalLoading(true);
    try {
      await apiPost("/api/v1/inventory/adjust", {
        item_type: adjustItemType,
        item_id: adjustItemId,
        change_amount: parseFloat(adjustChange),
        reason: adjustReason,
      });
      setShowAdjustModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to adjust stock level");
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addStock) return;
    setModalLoading(true);
    try {
      await apiPost("/api/v1/ingredients", {
        name: addName,
        stock_quantity: parseFloat(addStock),
        unit: addUnit,
        low_stock_threshold: parseFloat(addThreshold),
      });
      setShowAddModal(false);
      setAddName("");
      setAddStock("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create ingredient");
    } finally {
      setModalLoading(false);
    }
  };

  // Filter ingredients by search query
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-lg px-8 py-5">
          <div>
            <h1 className="text-xl font-bold text-[#170f0a]">Supply & Stock Room</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Inventory & Audits
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl bg-white border px-4 py-2.5 font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98] text-sm shadow-xs"
            >
              <Plus size={16} />
              Register Raw Material
            </button>
            <button
              onClick={() => handleOpenAdjust("ingredient", ingredients[0]?.id || "")}
              className="flex items-center gap-2 rounded-xl bg-[#170f0a] px-4 py-2.5 font-bold text-white transition hover:opacity-90 active:scale-[0.98] text-sm shadow-sm"
            >
              <ArrowUpDown size={16} />
              Quick Adjustment
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 flex-1">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Raw Ingredients</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1.5">{ingredients.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-800 shrink-0">
                <Package size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Low Supplies</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1.5">{alerts.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-800 shrink-0">
                <AlertTriangle size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Finished Products</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1.5">{products.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-800 shrink-0">
                <Package size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Automatic Alerts</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1.5">Active</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-800 shrink-0">
                <TrendingDown size={20} />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Table Column */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">Raw Ingredients & Supplies</h2>
                <div className="relative w-64 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search material..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 outline-none focus:border-[#82542a]"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white border rounded-2xl">
                  <Loader2 className="animate-spin text-[#82542a]" size={36} />
                  <p className="text-gray-500 text-sm font-medium">Scanning stock room...</p>
                </div>
              ) : filteredIngredients.length === 0 ? (
                <div className="text-center py-20 bg-white border border-dashed rounded-2xl p-8">
                  <p className="text-gray-500 font-semibold">No raw materials found.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/70 border-b">
                        <tr>
                          {["Material Name", "Stock Level", "Alert Threshold", "Unit", "Status", ""].map((h) => (
                            <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {filteredIngredients.map((item) => {
                          const isLow = item.stock_quantity <= item.low_stock_threshold;
                          return (
                            <tr key={item.id} className={`border-t hover:bg-gray-50/50 ${isLow ? "bg-red-50/20" : ""}`}>
                              <td className="px-6 py-4.5 font-bold text-gray-900">{item.name}</td>
                              <td className={`px-6 py-4.5 font-bold ${isLow ? "text-red-600" : "text-gray-800"}`}>
                                {item.stock_quantity.toLocaleString()}
                              </td>
                              <td className="px-6 py-4.5 text-sm text-gray-500">
                                {item.low_stock_threshold.toLocaleString()}
                              </td>
                              <td className="px-6 py-4.5 text-sm text-gray-500 uppercase">{item.unit}</td>
                              <td className="px-6 py-4.5">
                                <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${
                                  isLow ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {isLow ? "Low Stock" : "Healthy"}
                                </span>
                              </td>
                              <td className="px-6 py-4.5 text-right">
                                <button
                                  onClick={() => handleOpenAdjust("ingredient", item.id)}
                                  className="text-xs font-bold text-[#82542a] hover:underline"
                                >
                                  Adjust
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Audit Logs Sidebar */}
            <div className="w-full lg:w-96 shrink-0 space-y-6">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900">Live Inventory Audit Log</h2>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs h-[450px] overflow-y-auto space-y-4">
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#82542a]" size={24} />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-20">No stock logs generated yet.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border-b border-gray-50 pb-3 flex justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-gray-900 capitalize">
                          {log.item_type}: {log.reason}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${log.change_amount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {log.change_amount > 0 ? "+" : ""}
                          {log.change_amount}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-base font-bold text-gray-900">Adjust Supply Stock</h2>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Item Type</label>
                <select
                  value={adjustItemType}
                  onChange={(e) => {
                    setAdjustItemType(e.target.value);
                    setAdjustItemId(e.target.value === "ingredient" ? ingredients[0]?.id || "" : products[0]?.id || "");
                  }}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#82542a]"
                >
                  <option value="ingredient">Raw Ingredient</option>
                  <option value="product">Finished Product</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Select Item</label>
                <select
                  value={adjustItemId}
                  onChange={(e) => setAdjustItemId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#82542a]"
                >
                  {adjustItemType === "ingredient"
                    ? ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.stock_quantity} {ing.unit} left)
                        </option>
                      ))
                    : products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.stock_quantity} left)
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Change Amount</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 500 (use negative to reduce)"
                  value={adjustChange}
                  onChange={(e) => setAdjustChange(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#82542a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#82542a]"
                >
                  <option value="restock">Restock / Replenish</option>
                  <option value="wastage">Spillage / Waste</option>
                  <option value="adjustment">Manual Audit</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-[#170f0a] px-5 py-2 text-xs font-bold text-white hover:opacity-90"
                >
                  {modalLoading && <Loader2 className="animate-spin" size={12} />}
                  Save Adjust
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-base font-bold text-gray-900">Register Raw Supply</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Material Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Beans"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#82542a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Initial Stock</label>
                  <input
                    type="number"
                    required
                    placeholder="1000"
                    value={addStock}
                    onChange={(e) => setAddStock(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#82542a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Unit</label>
                  <select
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                    className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#82542a]"
                  >
                    <option value="g">grams (g)</option>
                    <option value="ml">milliliters (ml)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="kg">kilograms (kg)</option>
                    <option value="l">liters (l)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Safety Limit (Low Stock Alert)</label>
                <input
                  type="number"
                  required
                  value={addThreshold}
                  onChange={(e) => setAddThreshold(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#82542a]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-[#170f0a] px-5 py-2 text-xs font-bold text-white hover:opacity-90"
                >
                  {modalLoading && <Loader2 className="animate-spin" size={12} />}
                  Register Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}