import { formatBytes } from "@/lib/utils";

interface StorageGaugeProps {
  used: number;
  total: number;
}

export function StorageGauge({ used, total }: StorageGaugeProps) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const barColor =
    percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-yellow-500" : "bg-blue-500";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">Storage Usage</p>
        <p className="text-sm font-medium text-gray-700">
          {formatBytes(used)} / {formatBytes(total)}
        </p>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}% used</p>
    </div>
  );
}
