"use client";

import Image from "next/image";
import {
  Bell,
  Wallet,
  HelpCircle,
  Search,
  Users,
  Gift,
  Award,
  ChevronRight,
  ChevronLeft,
  Download,
  Filter,
  Edit,
  Plus,
  Coffee,
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Package,
  MenuSquare,
  Settings,
  Sparkles,
} from "lucide-react";

const customers = [
  {
    name: "Julian Thorne",
    phone: "+1 (555) 234-8902",
    tier: "Gold",
    points: "12,450",
    visit: "Today, 08:42 AM",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDOUSs-IZKWqeV9hn1E4Fqj13LpQmQpjoIO2SMMytKaEWCxDbXVK9crDsiP9JfyoY8yl9pyoLqq3N3fStUKM5XtUe1zeFt-s-Yt7Bp_bvv9LPEAIudc2isS_lReY4khE3Vs79IO2kC2G8fUH91XZAUZrmh7k9_25oYE2gDZppM6HFcql8Iedb6ZviUxCA0mi16aBp-A1HbyQKYliInQ3oSRmnplmzKy5Z0KtUXVs4mu62mUH3SikgUhg-fUdHsPmxVJRkRl90MDFp8",
  },
  {
    name: "Sarah Jenkins",
    phone: "+1 (555) 901-4432",
    tier: "Silver",
    points: "8,200",
    visit: "Yesterday",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDQh2vSinZMxprcAcrh3Im3oDhFNajWenxPhgawKz4M1wE4Z6mpvj14qX-4L5-vZCLVpttWgMR9QxFmLmKNVsS1d0Nysd0X4KhTFLIwLL9Sg8IdFldln8wE5Tj0E-oP9v1JwM1HpORuMlaxCzpehQsv6lRMDYF7y47sJV2JNrX9rp5PnlWKR40IND0cSn9C-5Awt3E1--KtkljVoCf1wsScd_GDV3OPcxOS6jQLGDNMv2jYwxUid4z9Zg1zpipU_O887ToPoIXCbYQ",
  },
  {
    name: "Michael Chen",
    phone: "+1 (555) 122-3984",
    tier: "Bronze",
    points: "3,150",
    visit: "3 days ago",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA5Ap2uvGuzrDfyczYu191Z3dBTJZh3gKj5CeJ1NieS56iQnf19ltEUd80YlmuXU95Xavp3cRiQ4AiQ1qdPXBRNKND0aXB5oWmMQ1ohtJx76O4kC7JLaH-QpcJgZw6NTo0jeB0G6MyU5eECMegFVAkpKTyHsRQAvhM8B4kExZlQUT2CQ2R0Cvk9rmZmOZLXTQr0kgChwHCOfzDM7Q2vjO-qN4aQqIyl99xT_91mVLwUsJjf9OI3PXV7gzAxbPhW7GMfqRYXbhjQWZ4",
  },
];

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: ShoppingCart, label: "Point of Sale" },
  { icon: ChefHat, label: "Kitchen" },
  { icon: Package, label: "Inventory" },
  { icon: MenuSquare, label: "Menu" },
  { icon: Users, label: "Customers", active: true },
  { icon: Settings, label: "Settings" },
];

export default function CustomerManagementPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white/80 backdrop-blur-xl p-6 flex flex-col z-50">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-[#2d241e] flex items-center justify-center">
            <Coffee className="text-white w-5 h-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#170f0a]">
              EspressoPro
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Enterprise Roastery
            </p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  item.active
                    ? "bg-[#febf8c] text-[#794c23] font-semibold"
                    : "hover:bg-[#eff4ff] text-gray-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="mt-auto bg-[#170f0a] text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:opacity-90">
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </aside>

      {/* Main Area */}
      <div className="ml-64 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-white/70 backdrop-blur-xl border-b border-gray-200 px-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-[#eff4ff] px-4 py-2 rounded-full w-[400px]">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              placeholder="Search by name or phone..."
              className="bg-transparent outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 cursor-pointer" />
              <Wallet className="w-5 h-5 cursor-pointer" />
              <HelpCircle className="w-5 h-5 cursor-pointer" />
            </div>

            <div className="flex items-center gap-3 border-l pl-5">
              <div className="text-right">
                <p className="font-semibold">Alex Rivera</p>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Manager
                </p>
              </div>

              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9j4_CT6BSBI484bsMP8IGAN2NIln9EdPQt5mcwZTGHqWCgraTt7jhdK6O8qqUDUSrZDHR6OXQgzul6y-2Kc3oFocD3_8AZ-biLtqsEWb-YTFdIkPWkE-C9HrVL06eK1AKnu9xApbP1ZV9KARHvY7o-zo2bpzOmakjUT0XcsjcnLQZ-SANwr5VTgYohVi4iCv0NxnKeKaxakI6Za44HA_j3J0vy2m4tleUE_Hb2yDT_sy9jWuN0bXX1zaNXBvHr7TshPdSoTpvE04"
                alt="Manager"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-10">
          {/* Heading */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="uppercase tracking-[0.2em] text-sm font-bold text-[#82542a] mb-2">
                CRM Dashboard
              </p>

              <h2 className="text-4xl font-bold text-[#170f0a]">
                Customer Management
              </h2>
            </div>

            <button className="bg-[#82542a] text-white px-6 py-4 rounded-2xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Register New Customer
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            <StatCard
              icon={<Users className="w-7 h-7" />}
              title="Total Members"
              value="2,842"
              subtitle="12% from last month"
            />

            <StatCard
              icon={<Gift className="w-7 h-7" />}
              title="Loyalty Redeemed Today"
              value="48,200 pts"
              subtitle="Approx. 124 free beverages"
            />

            <StatCard
              icon={<Award className="w-7 h-7" />}
              title="Top Customer This Month"
              value="Elena Rodriguez"
              subtitle="Highest engagement"
            />
          </div>

          <div className="flex gap-8">
            {/* Table */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-2xl font-bold">Active Members</h3>

                <div className="flex gap-3">
                  <button className="flex items-center gap-2 border rounded-xl px-4 py-2 hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>

                  <button className="flex items-center gap-2 border rounded-xl px-4 py-2 hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              <table className="w-full">
                <thead className="bg-[#eff4ff] text-left">
                  <tr>
                    <th className="px-6 py-4 text-sm uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-sm uppercase">Tier</th>
                    <th className="px-6 py-4 text-sm uppercase">Points</th>
                    <th className="px-6 py-4 text-sm uppercase">
                      Last Visit
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.name}
                      className="border-t hover:bg-[#f8f9ff] transition"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <Image
                            src={customer.image}
                            alt={customer.name}
                            width={42}
                            height={42}
                            className="rounded-full"
                          />

                          <div>
                            <p className="font-semibold">{customer.name}</p>
                            <p className="text-sm text-gray-500">
                              {customer.phone}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <TierBadge tier={customer.tier} />
                      </td>

                      <td className="px-6 py-5 font-semibold">
                        {customer.points}
                      </td>

                      <td className="px-6 py-5 text-gray-500">
                        {customer.visit}
                      </td>

                      <td className="px-6 py-5 text-right">
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between p-5 border-t">
                <p className="text-sm text-gray-500">
                  Showing 1–10 of 2,842 customers
                </p>

                <div className="flex gap-2">
                  <PaginationButton>
                    <ChevronLeft className="w-4 h-4" />
                  </PaginationButton>

                  <PaginationButton active>1</PaginationButton>
                  <PaginationButton>2</PaginationButton>
                  <PaginationButton>3</PaginationButton>

                  <PaginationButton>
                    <ChevronRight className="w-4 h-4" />
                  </PaginationButton>
                </div>
              </div>
            </div>

            {/* Sidebar Profile */}
            <aside className="w-[380px] space-y-6">
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="h-28 bg-[#2d241e] relative">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA68bKsOmLoJRH7-WwLscRq6dhS7UIUlFO6mkjUP6OdoKPCN4BRIMSyGGJIJnIE9TsjiAgxvMehub97NkylxOG-PhrCmClFJVTEdDoWCZBQfRs9evq50yvCt0RkNRzjGp_1Js7ZoBSYVHjHojv8tR3XZM9P0a9XkcTI26GsXqrLoy1gMh8L-Oep6JHrKS_JGA1-v3iF7nMw0R8P3KkHiyIJ76qMv1k9j9J9tN7qZiJpKnJuNJRnVMTBgID1cTZNzHyvqpjrL5jfuJw"
                    alt="Customer"
                    width={90}
                    height={90}
                    className="rounded-2xl border-4 border-white absolute left-6 -bottom-10"
                  />
                </div>

                <div className="pt-14 p-6">
                  <div className="flex justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">
                        Julian Thorne
                      </h3>
                      <p className="text-gray-500">
                        Customer since Oct 2022
                      </p>
                    </div>

                    <button className="p-2 rounded-lg hover:bg-gray-100">
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-[#f8f9ff] rounded-2xl p-5 border">
                    <div className="flex justify-between items-center mb-2">
                      <p className="uppercase text-xs tracking-widest text-gray-500">
                        Current Status
                      </p>

                      <TierBadge tier="Gold" />
                    </div>

                    <h4 className="text-4xl font-bold mb-4">
                      12,450{" "}
                      <span className="text-lg text-gray-500 font-normal">
                        Points
                      </span>
                    </h4>

                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-[75%] bg-[#82542a] h-full rounded-full" />
                    </div>

                    <p className="text-sm text-gray-500 mt-3">
                      2,550 points until Platinum Tier
                    </p>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="bg-[#febf8c] rounded-3xl p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-5">
                    <Sparkles className="w-5 h-5 text-[#794c23]" />
                    <h4 className="uppercase tracking-widest text-sm font-bold text-[#794c23]">
                      Available Rewards
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <RewardItem
                      title="Free Custom Pastry"
                      status="READY"
                    />

                    <RewardItem
                      title="15% Off Roasted Beans"
                      status="200 pts left"
                    />
                  </div>
                </div>

                <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
              </div>
            </aside>
          </div>
        </main>
      </div>
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
    <div className="bg-white border border-gray-200 rounded-3xl p-6 flex gap-5 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-[#ffdcc2] flex items-center justify-center text-[#82542a]">
        {icon}
      </div>

      <div>
        <p className="uppercase text-xs tracking-widest text-gray-500 mb-1">
          {title}
        </p>

        <h3 className="text-3xl font-bold text-[#170f0a]">
          {value}
        </h3>

        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    Gold: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Silver: "bg-gray-100 text-gray-600 border-gray-200",
    Bronze: "bg-orange-100 text-orange-700 border-orange-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[tier]}`}
    >
      {tier}
    </span>
  );
}

function PaginationButton({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
        active
          ? "bg-[#170f0a] text-white"
          : "border hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function RewardItem({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-3">
      <p className="font-medium text-[#2e1500]">{title}</p>

      <span className="text-xs font-bold text-[#82542a]">
        {status}
      </span>
    </div>
  );
}