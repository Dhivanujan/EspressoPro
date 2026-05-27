// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
