import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Garage UI",
  description: "Admin panel for Garage object storage",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <ToastProvider>
          <Sidebar />
          <main className="ml-60 min-h-screen p-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
