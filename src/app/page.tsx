"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { StorageGauge } from "@/components/storage-gauge";
import { formatBytes, formatDate } from "@/lib/utils";

interface DashboardData {
  bucketCount: number;
  keyCount: number;
  storageUsed: number;
  storageTotal: number;
  nodeStatus: "healthy" | "degraded";
  recentUploads: {
    key: string;
    bucket: string;
    size: number;
    lastModified: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json.data);
      })
      .catch(() => setError("Cannot reach Garage"));
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-400">Loading...</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Buckets" value={data.bucketCount} color="blue" />
        <StatCard title="API Keys" value={data.keyCount} color="purple" />
        <StatCard
          title="Storage Used"
          value={formatBytes(data.storageUsed)}
          color="green"
        />
        <StatCard
          title="Node Status"
          value={data.nodeStatus === "healthy" ? "Healthy" : "Degraded"}
          color={data.nodeStatus === "healthy" ? "green" : "red"}
        />
      </div>

      <StorageGauge used={data.storageUsed} total={data.storageTotal} />

      <div className="mt-6 bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Recent Uploads</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="px-5 py-3 font-medium">File</th>
              <th className="px-5 py-3 font-medium">Bucket</th>
              <th className="px-5 py-3 font-medium">Size</th>
              <th className="px-5 py-3 font-medium">Modified</th>
            </tr>
          </thead>
          <tbody>
            {data.recentUploads.map((upload) => (
              <tr
                key={`${upload.bucket}-${upload.key}`}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="px-5 py-3 text-sm text-gray-900 font-mono truncate max-w-xs">
                  {upload.key.split("/").pop()}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{upload.bucket}</td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {formatBytes(upload.size)}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {formatDate(upload.lastModified)}
                </td>
              </tr>
            ))}
            {data.recentUploads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                  No files uploaded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
