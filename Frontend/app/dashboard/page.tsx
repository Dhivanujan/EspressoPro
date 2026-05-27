// app/dashboard/page.tsx

"use client";

import Image from "next/image";
import {
  Coffee,
  CupSoda,
  Croissant,
  ShoppingBag,
  Search,
  Bell,
  Plus,
  Minus,
  CreditCard,
  TicketPercent,
  QrCode,
  LogOut,
  HelpCircle,
} from "lucide-react";

const products = [
  {
    name: "Caffè Latte",
    price: "$4.50",
    description: "Standard 12oz • Whole Milk",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCe6aOpRLLgryBzG7fXBlJUtdNTOHSZBoq5nbLoZIX4Mc6bKdtLGJN4xpwGbDufF_5qLZKvDfuzZwP2E8qcwHVXG6tOLCQzZplXqneQWvsjtoqAbb-6Z7mEbtkAKDe1LEV7uKyTIRtQo58Ltpw_KjKVBrGoHhvAxs0cbvCxOa7OKQN_V2EcONHKuv9rLZUO8qq_VIWeX7SpPiFmqXa0gqyK4K8kxn3ft2LLT2GA7aI08Wts6akv7Zs3Jfinw9-Dpk5f0ptE-8ulFE0",
  },
  {
    name: "Cappuccino",
    price: "$4.25",
    description: "Traditional 6oz • Double Shot",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBrnhR2ky8TpL8ziFQHut5Vi8LTHaZ2VBlvnfS7At45HrJtsqM-Xo9Q8N4Yv5SdQMMaYEkG5mQt-GkZ6u04uQQ4kM5_6TVFtyi6kdP5br3jBJOGxNt23xvrxAMp0u0ei4z48R_gw9P3OA-8yejwPr8qhvZ1dY6xPAgSP5jGzkUWfEm7oyMVYJMQDtOi_XEipos_WRA5XoebjlzlLYxclgU_8YG4NNOLVPlIHvUnbP28F-QUvHwDQUFTpt5kr0eDNlVzMKMMhtvriDc",
  },
  {
    name: "Americano",
    price: "$3.50",
    description: "12oz • Signature Roast",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAvFLaUf5oWZJXHENnkJ4EcbSAFltDNi4n-r-KEWozjHcIAqxXzOjC_iBs-DLv82b5q5pxjtDjGvAErQtFv7RiCN3l-CUNUoE0Q6beq-UUms-AtNBpc6Y5UUuglcxkBMT1aE5Wy577hGiBFkMsbYTHMKUtfgCLsvP1VJJxOfhh8KDnE6Ai13TBuQrexsHR9EcfNdziS7HqiMwAdZdHSoUg6JQmtg44Ny5U71z2kvcYbHZ_SnirNqXiXY6yBLHlzKkQMe2c74YeAcdI",
  },
];

const cartItems = [
  {
    name: "Caffè Latte",
    price: "$9.00",
    quantity: 2,
    note: "12oz, Oat Milk (+ $0.50)",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHfiwxDNv9TYjENeFLfN9x1_vAnFX8tibq5v6Hpm_6shIWCBicM_wfpY0Ule6JJAm9N25imA_eq9RawZ50C_9QlJgh0ENb85jMSfaWluadc-N2k6bb-QZ9ksM-RSno2-meo5EGmubiw0Gwm16tE35Bq9AlUt0UM0pSIQhmO1Zy_jncSyJkSdmX95MaBgA3FuGAyZJzOv_WgykRxIEjlnBR1PLoaPVRab1PoGbiHojNV3KeqcTi8EDk54mOjOFozIXAD0Gw54Fvq9A",
  },
];

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9ff]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-gray-200 bg-white p-5">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#170f0a]">
            EspressoPro
          </h1>

          <p className="text-sm text-gray-500">
            Downtown Branch
          </p>
        </div>

        <nav className="space-y-2">
          <SidebarItem
            active
            icon={<Coffee size={18} />}
            label="Coffee"
          />

          <SidebarItem
            icon={<CupSoda size={18} />}
            label="Tea"
          />

          <SidebarItem
            icon={<Croissant size={18} />}
            label="Pastries"
          />

          <SidebarItem
            icon={<ShoppingBag size={18} />}
            label="Merchandise"
          />
        </nav>

        <div className="mt-auto space-y-2">
          <SidebarItem
            icon={<HelpCircle size={18} />}
            label="Support"
          />

          <SidebarItem
            icon={<LogOut size={18} />}
            label="Logout"
          />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-lg px-8 py-5">
          
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-[#82542a] focus:ring-4 focus:ring-[#82542a]/10"
            />
          </div>

          <div className="flex items-center gap-5">
            <button className="text-gray-500 hover:text-black">
              <Bell size={20} />
            </button>

            <div className="flex items-center gap-3">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAluN1BG-6PCt8vvsUlxJfClfSGG-GFi0yX5C3Xynh1FvxVSolnnZhx140SsHXuQH_PlF6DDChUDCtg3N5uZnl6kgIG_MUuBFVU3a9BL7erUrhy-4pNCVaFkFSN9CEKBMQsU847_zrIBjOokoNuYPFykpYL3yrS3PuxVbY1q1BcCti0und0rH8B5ob6rIz_toD3LAOmntSUSs0RpNDY4pvfrIpblZnkudU8tLPW_wdBYEmHWltQJ6TLeb3X1c5rATZXF1kntOPInzc"
                alt="Manager"
                width={42}
                height={42}
                className="rounded-full"
              />

              <div>
                <p className="font-semibold">
                  Alex Rivera
                </p>

                <p className="text-xs text-gray-500">
                  Store Manager
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Products */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[#170f0a]">
              Coffee Favorites
            </h2>

            <p className="text-gray-500 mt-1">
              Select items to add to the current order
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <button
                key={product.name}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                  />

                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-[#82542a] shadow">
                    {product.price}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-[#170f0a]">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {product.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Cart */}
      <aside className="hidden xl:flex w-[400px] flex-col border-l border-gray-200 bg-white/80 backdrop-blur-xl">
        
        <div className="border-b border-gray-200 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#170f0a]">
              Current Order
            </h2>

            <button className="text-sm font-semibold text-red-500">
              Clear All
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Order #POS-8842 • Dine-in
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {cartItems.map((item) => (
            <div
              key={item.name}
              className="flex gap-4"
            >
              <Image
                src={item.image}
                alt={item.name}
                width={70}
                height={70}
                className="rounded-xl object-cover"
              />

              <div className="flex-1">
                <div className="mb-1 flex justify-between">
                  <h3 className="font-semibold">
                    {item.name}
                  </h3>

                  <span className="font-bold">
                    {item.price}
                  </span>
                </div>

                <p className="mb-3 text-sm text-gray-500">
                  {item.note}
                </p>

                <div className="flex items-center gap-3">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border">
                    <Minus size={16} />
                  </button>

                  <span>{item.quantity}</span>

                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout */}
        <div className="border-t border-gray-200 p-6">
          
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>$12.75</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>Tax (8%)</span>
              <span>$1.02</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-xl font-bold">
                Total
              </span>

              <span className="text-2xl font-bold text-[#82542a]">
                $13.77
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <button className="flex h-14 items-center justify-center gap-2 rounded-xl border border-[#82542a] text-[#82542a]">
              <QrCode size={18} />
              Loyalty
            </button>

            <button className="flex h-14 items-center justify-center gap-2 rounded-xl border border-gray-300">
              <TicketPercent size={18} />
              Discount
            </button>
          </div>

          <button className="flex h-16 w-full items-center justify-center gap-3 rounded-xl bg-[#170f0a] text-lg font-bold text-white transition hover:opacity-90">
            <CreditCard size={20} />
            Pay $13.77
          </button>
        </div>
      </aside>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
        active
          ? "bg-[#febf8c] text-[#794c23] font-semibold"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}