"use client";

interface BreadcrumbProps {
  bucket: string;
  prefix: string;
  onNavigate: (prefix: string) => void;
}

export function Breadcrumb({ bucket, prefix, onNavigate }: BreadcrumbProps) {
  const parts = prefix.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-sm mb-4">
      <button
        onClick={() => onNavigate("")}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        {bucket}
      </button>
      {parts.map((part, i) => {
        const path = parts.slice(0, i + 1).join("/") + "/";
        return (
          <span key={path} className="flex items-center gap-1">
            <span className="text-gray-400">/</span>
            <button
              onClick={() => onNavigate(path)}
              className="text-blue-600 hover:text-blue-800"
            >
              {part}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
