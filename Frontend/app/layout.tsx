// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth";

export const metadata: Metadata = {
  title: "EspressoPro - Coffee Shop POS",
  description: "Enterprise POS System for Modern Coffee Shops",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#f8f9ff]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
