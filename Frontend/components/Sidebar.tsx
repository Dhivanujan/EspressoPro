// components/Sidebar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDefaultRoute, useAuth } from "../lib/auth";
import {
  Coffee,
  Tv,
  Package,
  BookOpen,
  Users,
  BarChart2,
  LogOut,
  HelpCircle,
  User as UserIcon,
  Menu,
  X,
  UserCog,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const homeHref = getDefaultRoute(user?.role ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDark = pathname === "/kitchen_display_system";

  const menuItems = [
    {
      href: "/dashboard",
      icon: <Coffee size={20} />,
      label: "POS Terminal",
      roles: ["admin", "cashier"],
    },
    {
      href: "/kitchen_display_system",
      icon: <Tv size={20} />,
      label: "Kitchen KDS",
      roles: ["admin", "cashier"],
    },
    {
      href: "/inventory_management",
      icon: <Package size={20} />,
      label: "Inventory",
      roles: ["admin", "cashier"],
    },
    {
      href: "/menu_management",
      icon: <BookOpen size={20} />,
      label: "Menu Editor",
      roles: ["admin"],
    },
    {
      href: "/customer_loyalty",
      icon: <Users size={20} />,
      label: "Loyalty Club",
      roles: ["admin", "cashier"],
    },
    {
      href: "/admin_dashboard",
      icon: <BarChart2 size={20} />,
      label: "Admin Insights",
      roles: ["admin"],
    },
    {
      href: "/cashier_management",
      icon: <UserCog size={20} />,
      label: "Staff Registry",
      roles: ["admin"],
    },
  ];

  // Filter items by role
  const visibleItems = menuItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  const sidebarContent = (
    <>
      {/* Close button for mobile */}
      <button
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
        }`}
      >
        <X size={18} className={isDark ? "text-gray-400" : "text-gray-500"} />
      </button>

      {/* Brand Header */}
      <div className="mb-8">
        <Link href={homeHref} className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 border ${
            isDark ? "bg-[#82542a] border-white/10 text-[#febf8c]" : "bg-[#2d241e] border-transparent text-white"
          }`}>
            <Coffee size={22} />
          </div>
          <div>
            <h1 className={`text-xl font-bold leading-none ${isDark ? "text-[#f0dfd6]" : "text-[#170f0a]"}`}>
              EspressoPro
            </h1>
            <p className={`text-[10px] mt-1 tracking-wider uppercase font-semibold ${isDark ? "text-[#988a82]" : "text-gray-400"}`}>
              Smart Coffee POS
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 transition-all duration-200 ${
                isActive
                  ? isDark
                    ? "bg-[#82542a]/30 text-[#febf8c] font-semibold border border-[#82542a]/20 shadow-sm"
                    : "bg-[#febf8c]/25 text-[#82542a] font-semibold shadow-sm shadow-[#febf8c]/10"
                  : isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-500 hover:text-[#170f0a] hover:bg-gray-50"
              }`}
            >
              <div className={isActive ? (isDark ? "text-[#febf8c]" : "text-[#82542a]") : (isDark ? "text-gray-500" : "text-gray-400")}>
                {item.icon}
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Profile & Actions */}
      <div className={`mt-auto border-t pt-5 space-y-4 ${isDark ? "border-white/10" : "border-gray-100"}`}>
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDark ? "bg-[#febf8c]/15 text-[#febf8c]" : "bg-[#febf8c]/35 text-[#82542a]"
            }`}>
              <UserIcon size={18} />
            </div>
            <div className="overflow-hidden">
              <p className={`font-semibold text-sm truncate leading-none mb-1 ${isDark ? "text-[#f0dfd6]" : "text-[#170f0a]"}`}>
                {user.full_name}
              </p>
              <p className={`text-xs capitalize ${isDark ? "text-[#988a82]" : "text-gray-400"}`}>
                {user.role} Account
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={() => alert("Help Center is currently under maintenance. Please contact support.")}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition ${
              isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-400 hover:text-[#170f0a] hover:bg-gray-50"
            }`}
          >
            <HelpCircle size={18} />
            <span>Support</span>
          </button>

          <button
            onClick={logout}
            className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm transition-all font-semibold ${
              isDark ? "text-red-400 hover:bg-red-950/20" : "text-red-500 hover:bg-red-50"
            }`}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
          isDark ? "bg-[#2d241e] border-white/10 text-[#f0dfd6]" : "bg-white border-gray-200 text-gray-700"
        }`}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen
            ? "fixed inset-y-0 left-0 z-50 flex"
            : "hidden lg:flex"
        } w-72 flex-col border-r p-5 h-screen sticky top-0 transition-colors duration-200 ${
          isDark ? "bg-[#170f0a] border-white/10" : "bg-white border-gray-200"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
