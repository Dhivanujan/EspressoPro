// app/customer_loyalty/page.tsx

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { apiGet, apiPost } from "../../lib/api";
import {
  Users,
  Gift,
  Award,
  ChevronRight,
  Plus,
  Loader2,
  X,
  Search,
  Sparkles,
  History,
  AlertTriangle
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  loyalty_points: number;
  lifetime_spending: number;
  lifetime_points: number;
  tier: string;
  visit_count: number;
  last_visit_at?: string;
  points_expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Add Customer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newBirthdate, setNewBirthdate] = useState("");

  // Manual Adjustments Override Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [overrideUser, setOverrideUser] = useState("");
  const [overridePass, setOverridePass] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Loyalty transaction audit trails
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await apiGet<Customer[]>("/api/v1/customers");
      setCustomers(data);
      if (data.length > 0) {
        // If a customer was already selected, keep it selected, else pick first
        if (selectedCustomer) {
          const fresh = data.find((c) => c.id === selectedCustomer.id);
          if (fresh) setSelectedCustomer(fresh);
        } else {
          setSelectedCustomer(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load loyalty customers", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTransactions(customerId: string) {
    setTxLoading(true);
    try {
      const logs = await apiGet<any[]>(`/api/v1/customers/${customerId}/loyalty-transactions`);
      setTransactions(logs);
    } catch (err) {
      console.error("Failed to load transactions for customer", err);
    } finally {
      setTxLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchTransactions(selectedCustomer.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer?.id]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    setModalLoading(true);
    try {
      const added = await apiPost<Customer>("/api/v1/customers", {
        name: newName,
        phone: newPhone,
        birthdate: newBirthdate || null,
      });
      setShowAddModal(false);
      setNewName("");
      setNewPhone("");
      setNewBirthdate("");
      await loadData();
      setSelectedCustomer(added);
    } catch (err: any) {
      alert(err.message || "Failed to create customer profile.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !adjustPoints || !adjustReason) return;
    setAdjustLoading(true);
    try {
      const payload: Record<string, any> = {
        points: parseInt(adjustPoints),
        reason: adjustReason,
      };

      if (overrideUser && overridePass) {
        payload.approved_by_username = overrideUser;
        payload.approved_by_password = overridePass;
      }

      const updated = await apiPost<Customer>(
        `/api/v1/loyalty/customers/${selectedCustomer.id}/adjust-points`,
        payload
      );

      // Reset states
      setShowAdjustModal(false);
      setAdjustPoints("");
      setAdjustReason("");
      setOverrideUser("");
      setOverridePass("");
      
      // Update local states
      setSelectedCustomer(updated);
      setCustomers(customers.map((c) => (c.id === updated.id ? updated : c)));
      await fetchTransactions(updated.id);
      
      alert(`Loyalty points successfully adjusted! New Balance: ${updated.loyalty_points} points.`);
    } catch (err: any) {
      alert(err.message || "Manual point override failed. Verify supervisor credentials.");
    } finally {
      setAdjustLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  // VIP Milestone Progress bar computation
  const renderProgress = (pts: number) => {
    let nextTier = "Silver";
    let currentMin = 0;
    let nextMax = 200;
    let currentTier = "Bronze";

    if (pts >= 1000) {
      currentTier = "Platinum";
      nextTier = "MAX";
      currentMin = 1000;
      nextMax = 1000;
    } else if (pts >= 500) {
      currentTier = "Gold";
      nextTier = "Platinum";
      currentMin = 500;
      nextMax = 1000;
    } else if (pts >= 200) {
      currentTier = "Silver";
      nextTier = "Gold";
      currentMin = 200;
      nextMax = 500;
    } else {
      currentTier = "Bronze";
      nextTier = "Silver";
      currentMin = 0;
      nextMax = 200;
    }

    const range = nextMax - currentMin;
    const earnedInRange = pts - currentMin;
    const progress = range > 0 ? (earnedInRange / range) * 100 : 100;
    const remaining = nextMax - pts;

    return (
      <div className="space-y-2 mt-4 font-sans bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-inner">
        <div className="flex justify-between text-xs font-bold text-gray-500">
          <span>{currentTier}</span>
          <span className="text-[#82542a]">{pts} / {nextMax} pts</span>
          <span>{nextTier}</span>
        </div>
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-600 to-yellow-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {nextTier !== "MAX" ? (
          <p className="text-[10px] text-gray-400 font-semibold italic text-center mt-1">
            {remaining} points remaining to unlock {nextTier} status!
          </p>
        ) : (
          <p className="text-[10px] text-emerald-600 font-bold text-center mt-1">
            🎉 Maximum VIP Tier status reached!
          </p>
        )}
      </div>
    );
  };

  // Automated Personalized Promotion Generator based on VIP status
  const getPromoOffer = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return {
          title: "Espresso Connoisseur Deal",
          description: "Enjoy buy-2-get-1-free on single-origin pour overs and specialty cold brews!",
          code: "PLATINUMB2G1",
          benefit: "Buy 2 Get 1 Free"
        };
      case "Gold":
        return {
          title: "Matcha & Tea Lover's 15% Off",
          description: "Get 15% off any premium green tea matcha lattes or seasonal iced tea infusions!",
          code: "GOLDMATCHA15",
          benefit: "15% discount"
        };
      case "Silver":
        return {
          title: "Sweet Pastry Combo deal",
          description: "Add a fresh chocolate croissant or baked muffin to any hot latte order for only $1.00!",
          code: "SILVERCOMBO1",
          benefit: "$1.00 Pastry add-on"
        };
      default:
        return {
          title: "First-Step Coffee Boost",
          description: "Double loyalty points on all espresso double-shots and morning drip coffees!",
          code: "BRONZEACCEL",
          benefit: "2x multiplier"
        };
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-lg px-8 py-5 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-[#170f0a]">Loyalty Registry</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Customer Relationship CRM
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#170f0a] px-5 py-2.5 font-bold text-white transition hover:opacity-90 active:scale-[0.98] text-sm shadow-sm"
          >
            <Plus size={18} />
            Register Customer
          </button>
        </header>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<Users size={24} />}
              title="Registered Members"
              value={customers.length.toString()}
              subtitle="Live active membership database"
            />
            <StatCard
              icon={<Gift size={24} />}
              title="Average Engagement"
              value={`${customers.length > 0 ? (customers.filter(c => (c.visit_count || 0) > 0).length / customers.length * 100).toFixed(0) : 0}%`}
              subtitle="Active conversion ratio"
            />
            <StatCard
              icon={<Award size={24} />}
              title="Global Tier High"
              value={customers.some(c => c.tier === "Platinum") ? "Platinum Club" : customers.some(c => c.tier === "Gold") ? "Gold Club" : "Silver Club"}
              subtitle="Top membership class active"
            />
          </div>

          <div className="flex flex-col xl:flex-row gap-8">
            {/* Table */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="flex items-center justify-between p-5 border-b gap-4">
                <h3 className="text-lg font-bold text-gray-900">Member Directory</h3>
                
                <div className="relative w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 outline-none focus:border-[#82542a]"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-[#82542a]" size={36} />
                  <p className="text-gray-500 text-sm font-medium">Scanning loyalty ledger...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl p-8">
                  <p className="text-gray-500 font-semibold">No customers found.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50/70 border-b">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Customer Details</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Club Tier</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Lifetime Spent</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Points Balance</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`border-t hover:bg-gray-50/50 cursor-pointer transition ${
                          selectedCustomer?.id === customer.id ? "bg-[#febf8c]/10" : ""
                        }`}
                      >
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#febf8c]/30 flex items-center justify-center text-[#82542a] font-bold text-sm uppercase">
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-950">{customer.name}</p>
                              <p className="text-xs text-gray-400">{customer.phone}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4.5">
                          <TierBadge tier={customer.tier || "Bronze"} />
                        </td>

                        <td className="px-6 py-4.5 font-semibold text-gray-700">
                          ${Number(customer.lifetime_spending || 0).toFixed(2)}
                        </td>

                        <td className="px-6 py-4.5 font-bold text-gray-800">
                          {customer.loyalty_points || 0} pts
                        </td>

                        <td className="px-6 py-4.5 text-right">
                          <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Expanded VIP Sidebar */}
            {selectedCustomer && (
              <aside className="w-full xl:w-105 shrink-0 space-y-6">
                
                {/* Profile VIP card */}
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-md">
                  <div className="h-28 bg-[#170f0a] relative overflow-hidden flex items-center p-6 justify-between">
                    {/* Glowing design asset */}
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#82542a]/30 rounded-full blur-2xl" />
                    
                    <div className="flex items-center gap-3.5 z-10">
                      <div className="w-14 h-14 rounded-2xl border-2 border-amber-500 bg-[#febf8c] flex items-center justify-center text-[#82542a] font-black text-2xl uppercase shadow-md">
                        {selectedCustomer.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{selectedCustomer.name}</h3>
                        <p className="text-xs text-gray-400">{selectedCustomer.phone}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowAdjustModal(true)}
                      className="z-10 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 font-bold text-black text-xs transition active:scale-95 shadow-sm"
                    >
                      Adjust Points
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Points Total */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Loyalty Account</span>
                      <h4 className="text-4xl font-black text-[#170f0a] tracking-tight flex items-baseline gap-2">
                        {selectedCustomer.loyalty_points || 0}
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Spendable Points</span>
                      </h4>
                      {renderProgress(selectedCustomer.loyalty_points || 0)}
                    </div>

                    {/* Visited Analytics Metrics */}
                    <div className="grid grid-cols-2 gap-4.5 pt-4 border-t border-gray-100">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Lifetime Spent</span>
                        <p className="text-sm font-extrabold text-gray-950 mt-1">${Number(selectedCustomer.lifetime_spending || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Visit Frequency</span>
                        <p className="text-sm font-extrabold text-gray-950 mt-1">{selectedCustomer.visit_count || 0} visits</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Average Spend Size</span>
                        <p className="text-sm font-extrabold text-gray-950 mt-1">
                          ${Number(selectedCustomer.visit_count > 0 ? Number(selectedCustomer.lifetime_spending || 0) / selectedCustomer.visit_count : 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Points Expiry</span>
                        <p className="text-[10px] font-extrabold text-gray-600 mt-1.5 truncate">
                          {selectedCustomer.points_expiry_date 
                            ? new Date(selectedCustomer.points_expiry_date).toLocaleDateString()
                            : "No Expiry"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personalized Promotional Offer Card */}
                {(() => {
                  const offer = getPromoOffer(selectedCustomer.tier || "Bronze");
                  return (
                    <div className="bg-gradient-to-br from-[#82542a] to-[#2d241e] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg border border-amber-500/20">
                      <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/5 rounded-full" />
                      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/5 rounded-full" />
                      
                      <div className="flex justify-between items-start mb-4 z-10 relative">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                          <h4 className="uppercase tracking-widest text-[9px] font-black text-amber-400">
                            PERSONALIZED PROMO
                          </h4>
                        </div>
                        <span className="text-[9px] bg-amber-500 text-black rounded px-2 py-0.5 font-bold uppercase">{offer.benefit}</span>
                      </div>

                      <h3 className="text-base font-extrabold mb-1.5 z-10 relative">{offer.title}</h3>
                      <p className="text-xs text-gray-300 z-10 relative leading-relaxed mb-4">
                        {offer.description}
                      </p>

                      <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl border border-white/5 z-10 relative">
                        <span className="text-[10px] text-gray-400 font-mono">CODE: <span className="font-bold text-white">{offer.code}</span></span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(offer.code);
                            alert(`Promo code ${offer.code} copied!`);
                          }}
                          className="text-[9px] bg-white/10 hover:bg-white/20 text-white rounded px-2.5 py-1 font-bold transition"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Audited Ledger Transactions Timeline */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
                  <div className="flex items-center gap-2 mb-5 border-b pb-3">
                    <History className="w-4.5 h-4.5 text-gray-500" />
                    <h4 className="text-sm font-bold text-gray-900">Loyalty ledger transactions</h4>
                  </div>

                  {txLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2">
                      <Loader2 className="animate-spin text-gray-400" size={16} />
                      <span className="text-xs text-gray-400 font-medium">Fetching transaction trail...</span>
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">No point transactions found for this account.</p>
                  ) : (
                    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-start gap-3 text-xs border-l-2 border-gray-100 pl-4.5 relative pb-1">
                          <div className={`absolute -left-1.5 top-1.5 h-2.5 w-2.5 rounded-full ${
                            tx.type === "earned" ? "bg-emerald-500" :
                            tx.type === "redeemed" ? "bg-amber-500" : "bg-blue-500"
                          }`} />
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-gray-950 capitalize">{tx.type}</span>
                              <span className={`font-black shrink-0 ${
                                tx.type === "earned" ? "text-emerald-600" :
                                tx.type === "redeemed" ? "text-amber-600" : "text-blue-600"
                              }`}>
                                {tx.type === "earned" ? "+" : "-"}{tx.points} pts
                              </span>
                            </div>
                            <p className="text-gray-500 text-[10px] mt-0.5 leading-normal">{tx.reason}</p>
                            <p className="text-[9px] text-gray-400 mt-1 font-mono">
                              By: {tx.adjusted_by} {tx.approved_by ? `(Appr: ${tx.approved_by})` : ""} • {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-base font-bold text-gray-900">Register Loyalty Customer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4 font-sans">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none focus:border-[#82542a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +15550199"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none focus:border-[#82542a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Birthdate (Optional)</label>
                <input
                  type="date"
                  value={newBirthdate}
                  onChange={(e) => setNewBirthdate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none focus:border-[#82542a]"
                />
                <span className="text-[8px] text-amber-600 mt-1 block">Needed for Birthday Double Points overrides</span>
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
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cashier Override Points Adjustment Modal */}
      {showAdjustModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border animate-scale-up">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <h2 className="text-base font-bold text-gray-900">Manual Points Adjustment</h2>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Customer: {selectedCustomer.name}</p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4 font-sans">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Points Adjustment</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 or -30"
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none focus:border-[#82542a] font-bold"
                />
                <span className="text-[8px] text-gray-400 mt-1 block">Input positive number to add, or negative to deduct</span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Audit Reason</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Reason for override adjustment..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 outline-none focus:border-[#82542a] leading-relaxed"
                />
              </div>

              {/* Cashier/Supervisor Override Credentials Block */}
              <div className="bg-amber-50 border border-amber-200/60 p-4.5 rounded-2xl space-y-3 mt-4">
                <div className="flex items-center gap-2 text-amber-800 text-[10px] font-bold uppercase">
                  <AlertTriangle size={14} className="text-amber-600 animate-pulse shrink-0" />
                  <span>Supervisor Override Credentials</span>
                </div>
                
                <div>
                  <label className="text-[9px] font-bold text-amber-800 uppercase">Manager Username</label>
                  <input
                    type="text"
                    required
                    placeholder="Manager ID"
                    value={overrideUser}
                    onChange={(e) => setOverrideUser(e.target.value)}
                    className="w-full text-xs rounded-lg border border-amber-200/50 bg-white px-2.5 py-1.5 outline-none font-semibold focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-amber-800 uppercase">Override Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={overridePass}
                    onChange={(e) => setOverridePass(e.target.value)}
                    className="w-full text-xs rounded-lg border border-amber-200/50 bg-white px-2.5 py-1.5 outline-none font-semibold focus:border-amber-500"
                  />
                </div>
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
                  disabled={adjustLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2 text-xs font-bold text-black"
                >
                  {adjustLoading && <Loader2 className="animate-spin text-black" size={12} />}
                  Adjust points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex gap-4 shadow-xs items-center">
      <div className="w-12 h-12 rounded-full bg-[#ffdcc2] flex items-center justify-center text-[#82542a] shrink-0">
        {icon}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
          {title}
        </p>
        <h3 className="text-xl font-bold text-[#170f0a] mt-0.5">
          {value}
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    Platinum: "bg-purple-50 text-purple-700 border-purple-200",
    Gold: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Silver: "bg-gray-50 text-gray-600 border-gray-200",
    Bronze: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${styles[tier] || styles.Bronze}`}
    >
      {tier}
    </span>
  );
}