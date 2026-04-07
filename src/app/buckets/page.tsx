"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatBytes, formatDate } from "@/lib/utils";

interface Bucket {
  id: string;
  created: string;
  globalAliases: string[];
  objects: number;
  bytes: number;
}

interface ProvisionResult {
  bucket: { id: string; alias: string };
  key: { accessKeyId: string; secretAccessKey: string; name: string };
}

export default function BucketsPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createWithKey, setCreateWithKey] = useState(true);
  const [newAlias, setNewAlias] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bucket | null>(null);
  const { showToast } = useToast();

  const fetchBuckets = () => {
    setLoading(true);
    fetch("/api/admin/buckets")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setBuckets(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBuckets(); }, []);

  const handleCreate = async () => {
    if (!newAlias.trim()) return;
    setCreating(true);

    if (createWithKey) {
      const keyName = newKeyName.trim() || `${newAlias.trim()}-key`;
      const res = await fetch("/api/admin/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketAlias: newAlias.trim(), keyName }),
      });
      const json = await res.json();
      if (json.error) {
        showToast(json.error, "error");
      } else {
        setProvisionResult(json.data);
        setNewAlias("");
        setNewKeyName("");
        setShowCreate(false);
        fetchBuckets();
      }
    } else {
      const res = await fetch("/api/admin/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: newAlias.trim() }),
      });
      const json = await res.json();
      if (json.error) {
        showToast(json.error, "error");
      } else {
        showToast(`Bucket "${newAlias}" created`, "success");
        setNewAlias("");
        setShowCreate(false);
        fetchBuckets();
      }
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/buckets/${deleteTarget.id}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.error) {
      showToast(json.error, "error");
    } else {
      showToast("Bucket deleted", "success");
      setDeleteTarget(null);
      fetchBuckets();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Buckets</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Bucket
        </button>
      </div>

      {provisionResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-green-900 mb-2">
            Bucket &amp; Key Created Successfully
          </h3>
          <p className="text-xs text-green-700 mb-3">
            Save the credentials below. The secret key will not be shown again.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-green-200 p-3">
              <p className="text-xs text-green-600 font-medium mb-2">Bucket</p>
              <p className="text-sm font-mono text-gray-900">{provisionResult.bucket.alias}</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-3">
              <p className="text-xs text-green-600 font-medium mb-2">Key Name</p>
              <p className="text-sm font-mono text-gray-900">{provisionResult.key.name}</p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div>
              <span className="text-xs text-green-600">Access Key ID:</span>
              <code className="block text-sm font-mono bg-white p-2 rounded border border-green-200 mt-1">
                {provisionResult.key.accessKeyId}
              </code>
            </div>
            <div>
              <span className="text-xs text-green-600">Secret Access Key:</span>
              <code className="block text-sm font-mono bg-white p-2 rounded border border-green-200 mt-1">
                {provisionResult.key.secretAccessKey}
              </code>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-green-200 p-3 mb-4">
            <p className="text-xs text-green-600 font-medium mb-2">Ready-to-use .env</p>
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">{`AWS_ACCESS_KEY_ID=${provisionResult.key.accessKeyId}
AWS_SECRET_ACCESS_KEY=${provisionResult.key.secretAccessKey}
AWS_ENDPOINT_URL=http://<your-garage-host>:3900
AWS_REGION=garage
S3_BUCKET=${provisionResult.bucket.alias}`}</pre>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
`AWS_ACCESS_KEY_ID=${provisionResult.key.accessKeyId}
AWS_SECRET_ACCESS_KEY=${provisionResult.key.secretAccessKey}
AWS_ENDPOINT_URL=http://<your-garage-host>:3900
AWS_REGION=garage
S3_BUCKET=${provisionResult.bucket.alias}`
                );
                showToast("Copied .env to clipboard", "success");
              }}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
            >
              Copy .env
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Access Key ID: ${provisionResult.key.accessKeyId}\nSecret Access Key: ${provisionResult.key.secretAccessKey}`
                );
                showToast("Copied keys to clipboard", "success");
              }}
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
            >
              Copy Keys Only
            </button>
            <button
              onClick={() => setProvisionResult(null)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">New Bucket</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bucket Name</label>
              <input
                type="text"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="my-app-storage"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createWithKey}
                onChange={(e) => setCreateWithKey(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Create an owner API key for this bucket</span>
            </label>

            {createWithKey && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Key Name <span className="text-gray-400">(optional, defaults to bucket-name-key)</span>
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder={newAlias ? `${newAlias}-key` : "my-app-key"}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newAlias.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating
                  ? "Creating..."
                  : createWithKey
                  ? "Create Bucket & Key"
                  : "Create Bucket"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewAlias(""); setNewKeyName(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Objects</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr key={bucket.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link
                      href={`/buckets/${bucket.globalAliases[0] || bucket.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {bucket.globalAliases[0] || bucket.id.slice(0, 16)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{bucket.objects}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{formatBytes(bucket.bytes)}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(bucket.created)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setDeleteTarget(bucket)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {buckets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                    No buckets yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Bucket"
        message={`Are you sure you want to delete "${deleteTarget?.globalAliases[0] || ""}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
