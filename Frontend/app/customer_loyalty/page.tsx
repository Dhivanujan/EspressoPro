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
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await apiGet<Customer[]>("/api/v1/customers");
      setCustomers(data);
      if (data.length > 0 && !selectedCustomer) {
        setSelectedCustomer(data[0]);
      }
    } catch (err) {
      console.error("Failed to load loyalty customers", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    setModalLoading(true);
    try {
      const added = await apiPost<Customer>("/api/v1/customers", {
        name: newName,
        phone: newPhone,
      });
      setShowAddModal(false);
      setNewName("");
      setNewPhone("");
      await loadData();
      setSelectedCustomer(added);
    } catch (err: any) {
      alert(err.message || "Failed to create customer profile.");
    } finally {
      setModalLoading(false);
    }
  };

  const getTier = (pts: number) => {
    if (pts >= 150) return "Gold";
    if (pts >= 50) return "Silver";
    return "Bronze";
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

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
        <div className="p-8 flex-1">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={<Users size={24} />}
              title="Registered Members"
              value={customers.length.toString()}
              subtitle="Live active membership"
            />
            <StatCard
              icon={<Gift size={24} />}
              title="Redemption Rate"
              value="10%"
              subtitle="Loyalty points reward multiplier"
            />
            <StatCard
              icon={<Award size={24} />}
              title="Top Customer Tier"
              value="Gold Club"
              subtitle="Awarded at 150+ points"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
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
                      <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Total Points</th>
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
                          <TierBadge tier={getTier(customer.loyalty_points)} />
                        </td>

                        <td className="px-6 py-4.5 font-bold text-gray-800">
                          {customer.loyalty_points}
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

            {/* Detail Sidebar */}
            {selectedCustomer && (
              <aside className="w-full lg:w-96 shrink-0 space-y-6">
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                  <div className="h-24 bg-[#2d241e] relative" />
                  
                  <div className="p-6 pt-10 relative">
                    <div className="w-16 h-16 rounded-2xl border-4 border-white bg-[#febf8c] flex items-center justify-center text-[#82542a] font-black text-2xl uppercase absolute left-6 -top-8 shadow-sm">
                      {selectedCustomer.name.charAt(0)}
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Active phone: {selectedCustomer.phone}
                      </p>
                    </div>

                    <div className="bg-[#f8f9ff] rounded-xl p-4 border border-gray-100">
                      <div className="flex justify-between items-center mb-3">
                        <p className="uppercase text-[10px] tracking-wider text-gray-400 font-bold">
                          Club Status
                        </p>
                        <TierBadge tier={getTier(selectedCustomer.loyalty_points)} />
                      </div>

                      <h4 className="text-3xl font-black text-gray-950 mb-4">
                        {selectedCustomer.loyalty_points}{" "}
                        <span className="text-sm text-gray-400 font-normal">
                          Balance Points
                        </span>
                      </h4>

                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="bg-[#82542a] h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              (selectedCustomer.loyalty_points / 150) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Perks */}
                <div className="bg-[#febf8c]/35 rounded-2xl p-5 border border-[#febf8c]/40 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-[#794c23]" />
                      <h4 className="uppercase tracking-wider text-xs font-bold text-[#794c23]">
                        Active Club Perks
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs">
                      <RewardItem
                        title="Free Latte reward"
                        status={selectedCustomer.loyalty_points >= 50 ? "ACTIVE" : "Locked (50 pts)"}
                        active={selectedCustomer.loyalty_points >= 50}
                      />
                      <RewardItem
                        title="Double points reward"
                        status={selectedCustomer.loyalty_points >= 150 ? "ACTIVE" : "Locked (150 pts)"}
                        active={selectedCustomer.loyalty_points >= 150}
                      />
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-up border">
            <div className="flex justify-between items-center pb-4 border-b">
              <h2 className="text-base font-bold text-gray-900">Register Loyalty Customer</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Smith"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-sm rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#82542a]"
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
                  Add Customer
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
    Gold: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Silver: "bg-gray-50 text-gray-600 border-gray-200",
    Bronze: "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${styles[tier]}`}
    >
      {tier}
    </span>
  );
}

function RewardItem({
  title,
  status,
  active,
}: {
  title: string;
  status: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/40">
      <p className="font-semibold text-[#2e1500]">{title}</p>
      <span className={`font-bold ${active ? "text-emerald-700" : "text-gray-400"}`}>
        {status}
      </span>
    </div>
  );
}