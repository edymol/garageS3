"use client";

import { useEffect, useState } from "react";
import { StorageGauge } from "@/components/storage-gauge";
import { formatBytes } from "@/lib/utils";

interface ClusterData {
  status: {
    layoutVersion: number;
    nodes: {
      id: string;
      garageVersion: string;
      addr: string;
      hostname: string;
      isUp: boolean;
      lastSeenSecsAgo: number | null;
      role: { zone: string; tags: string[]; capacity: number } | null;
      draining: boolean;
      dataPartition: { available: number; total: number } | null;
    }[];
  };
  layout: {
    version: number;
    roles: { id: string; zone: string; capacity: number; tags: string[] }[];
    stagedRoleChanges: unknown[];
  };
}

export default function ClusterPage() {
  const [data, setData] = useState<ClusterData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/cluster")
      .then((r) => r.json())
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

  if (!data) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Cluster Health</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Layout Version</p>
          <p className="text-2xl font-bold text-gray-900">{data.status.layoutVersion}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Nodes</p>
          <p className="text-2xl font-bold text-gray-900">{data.status.nodes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Replication</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.layout.roles.length > 0 ? "1x" : "N/A"}
          </p>
        </div>
      </div>

      {data.status.nodes.map((node) => (
        <div key={node.id} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  node.isUp ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <h3 className="text-lg font-semibold text-gray-900">{node.hostname}</h3>
              <span className="text-xs text-gray-400 font-mono">{node.id.slice(0, 16)}</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                node.isUp
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {node.isUp ? "Healthy" : "Down"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-500">Version</p>
              <p className="font-medium text-gray-900">{node.garageVersion}</p>
            </div>
            <div>
              <p className="text-gray-500">Address</p>
              <p className="font-medium text-gray-900">{node.addr}</p>
            </div>
            <div>
              <p className="text-gray-500">Zone</p>
              <p className="font-medium text-gray-900">{node.role?.zone || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Capacity</p>
              <p className="font-medium text-gray-900">
                {node.role ? formatBytes(node.role.capacity) : "N/A"}
              </p>
            </div>
          </div>

          {node.dataPartition && (
            <StorageGauge
              used={node.dataPartition.total - node.dataPartition.available}
              total={node.dataPartition.total}
            />
          )}
        </div>
      ))}
    </div>
  );
}
