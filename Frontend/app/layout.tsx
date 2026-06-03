// app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
import { Toaster } from "react-hot-toast";

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
      <body className="antialiased min-h-screen bg-coffee-50">
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '13px',
                fontWeight: '500',
              },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
