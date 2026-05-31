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
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const homeHref = getDefaultRoute(user?.role ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
      >
        <X size={18} className="text-gray-500" />
      </button>

      {/* Brand Header */}
      <div className="mb-8">
        <Link href={homeHref} className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-[#2d241e] flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <Coffee size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#170f0a] leading-none">
              EspressoPro
            </h1>
            <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase">
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
                  ? "bg-[#febf8c]/25 text-[#82542a] font-semibold shadow-sm shadow-[#febf8c]/10"
                  : "text-gray-500 hover:text-[#170f0a] hover:bg-gray-50"
              }`}
            >
              <div className={isActive ? "text-[#82542a]" : "text-gray-400"}>
                {item.icon}
              </div>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Profile & Actions */}
      <div className="mt-auto border-t border-gray-100 pt-5 space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#febf8c]/35 flex items-center justify-center text-[#82542a]">
              <UserIcon size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm text-[#170f0a] truncate leading-none mb-1">
                {user.full_name}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user.role} Account
              </p>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={() => alert("Help Center is currently under maintenance. Please contact support.")}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm text-gray-400 hover:text-[#170f0a] hover:bg-gray-50 transition"
          >
            <HelpCircle size={18} />
            <span>Support</span>
          </button>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-all font-medium"
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
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen
            ? "fixed inset-y-0 left-0 z-50 flex"
            : "hidden lg:flex"
        } w-72 flex-col border-r border-gray-200 bg-white p-5 h-screen sticky top-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
