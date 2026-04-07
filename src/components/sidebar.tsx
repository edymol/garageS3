"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/buckets", label: "Buckets", icon: "📁" },
  { href: "/keys", label: "API Keys", icon: "🔑" },
  { href: "/cluster", label: "Cluster", icon: "🖥️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Garage UI</h1>
        <p className="text-xs text-gray-500">Object Storage Admin</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Garage v2.2.0</p>
      </div>
    </aside>
  );
}
