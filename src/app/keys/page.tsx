"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDate } from "@/lib/utils";

interface KeyDetail {
  accessKeyId: string;
  secretAccessKey?: string;
  name: string;
  created: string;
  expiration: string | null;
  expired: boolean;
  permissions: { createBucket: boolean };
  buckets: {
    id: string;
    globalAliases: string[];
    permissions: { read: boolean; write: boolean; owner: boolean };
  }[];
}

interface BucketOption {
  id: string;
  alias: string;
}

interface PermissionEdit {
  keyId: string;
  keyName: string;
  buckets: {
    id: string;
    alias: string;
    read: boolean;
    write: boolean;
    owner: boolean;
  }[];
}

export default function KeysPage() {
  const [keys, setKeys] = useState<KeyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newKey, setNewKey] = useState<{ id: string; secret: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KeyDetail | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [permEdit, setPermEdit] = useState<PermissionEdit | null>(null);
  const [allBuckets, setAllBuckets] = useState<BucketOption[]>([]);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const fetchKeys = () => {
    setLoading(true);
    fetch("/api/admin/keys")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setKeys(json.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/admin/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const json = await res.json();
    if (json.error) {
      showToast(json.error, "error");
    } else {
      setNewKey({ id: json.data.accessKeyId, secret: json.data.secretAccessKey });
      setNewName("");
      fetchKeys();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/keys/${deleteTarget.accessKeyId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (json.error) {
      showToast(json.error, "error");
    } else {
      showToast("Key deleted", "success");
      setDeleteTarget(null);
      fetchKeys();
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openPermissions = async (key: KeyDetail) => {
    // Fetch all buckets to show as options
    const res = await fetch("/api/admin/buckets");
    const json = await res.json();
    if (!json.data) return;

    const buckets = (json.data as { id: string; globalAliases: string[] }[]).map((b) => {
      const existing = key.buckets.find((kb) => kb.id === b.id);
      return {
        id: b.id,
        alias: b.globalAliases[0] || b.id.slice(0, 16),
        read: existing?.permissions.read ?? false,
        write: existing?.permissions.write ?? false,
        owner: existing?.permissions.owner ?? false,
      };
    });

    setAllBuckets(json.data.map((b: { id: string; globalAliases: string[] }) => ({
      id: b.id,
      alias: b.globalAliases[0] || b.id.slice(0, 16),
    })));
    setPermEdit({ keyId: key.accessKeyId, keyName: key.name, buckets });
  };

  const togglePerm = (bucketId: string, perm: "read" | "write" | "owner") => {
    if (!permEdit) return;
    setPermEdit({
      ...permEdit,
      buckets: permEdit.buckets.map((b) =>
        b.id === bucketId ? { ...b, [perm]: !b[perm] } : b
      ),
    });
  };

  const savePermissions = async () => {
    if (!permEdit) return;
    setSaving(true);

    const key = keys.find((k) => k.accessKeyId === permEdit.keyId);

    for (const bucket of permEdit.buckets) {
      const existing = key?.buckets.find((kb) => kb.id === bucket.id);
      const hasAny = bucket.read || bucket.write || bucket.owner;
      const hadAny = existing ? (existing.permissions.read || existing.permissions.write || existing.permissions.owner) : false;

      if (hasAny) {
        // Allow the permissions that are checked
        const res = await fetch(`/api/admin/keys/${permEdit.keyId}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucketId: bucket.id,
            permissions: { read: bucket.read, write: bucket.write, owner: bucket.owner },
            action: "allow",
          }),
        });
        const json = await res.json();
        if (json.error) {
          showToast(json.error, "error");
          setSaving(false);
          return;
        }

        // Deny permissions that are unchecked (if they were previously set)
        if (existing) {
          const toDeny = {
            read: existing.permissions.read && !bucket.read,
            write: existing.permissions.write && !bucket.write,
            owner: existing.permissions.owner && !bucket.owner,
          };
          if (toDeny.read || toDeny.write || toDeny.owner) {
            await fetch(`/api/admin/keys/${permEdit.keyId}/permissions`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bucketId: bucket.id,
                permissions: toDeny,
                action: "deny",
              }),
            });
          }
        }
      } else if (hadAny) {
        // Remove all permissions
        await fetch(`/api/admin/keys/${permEdit.keyId}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucketId: bucket.id,
            permissions: { read: true, write: true, owner: true },
            action: "deny",
          }),
        });
      }
    }

    setSaving(false);
    showToast("Permissions updated", "success");
    setPermEdit(null);
    fetchKeys();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Key
        </button>
      </div>

      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-green-900 mb-2">Key Created Successfully</h3>
          <p className="text-xs text-green-700 mb-3">
            Save the secret key now. It will not be shown again.
          </p>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-green-600">Access Key ID:</span>
              <code className="block text-sm font-mono bg-white p-2 rounded border border-green-200 mt-1">
                {newKey.id}
              </code>
            </div>
            <div>
              <span className="text-xs text-green-600">Secret Access Key:</span>
              <code className="block text-sm font-mono bg-white p-2 rounded border border-green-200 mt-1">
                {newKey.secret}
              </code>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `Access Key ID: ${newKey.id}\nSecret Access Key: ${newKey.secret}`
              );
              showToast("Copied to clipboard", "success");
            }}
            className="mt-3 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
          >
            Copy Both
          </button>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 ml-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {showCreate && !newKey && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New API Key</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="key-name"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(""); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
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
                <th className="px-5 py-3 font-medium">Key ID</th>
                <th className="px-5 py-3 font-medium">Buckets</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.accessKeyId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{key.name}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleReveal(key.accessKeyId)}
                      className="text-sm font-mono text-gray-600 hover:text-gray-900"
                    >
                      {revealedIds.has(key.accessKeyId)
                        ? key.accessKeyId
                        : key.accessKeyId.slice(0, 6) + "••••••"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {key.buckets.map((b) => (
                        <span
                          key={b.id}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {b.globalAliases[0] || b.id.slice(0, 8)}
                          {b.permissions.owner
                            ? " (owner)"
                            : b.permissions.write
                            ? " (rw)"
                            : " (r)"}
                        </span>
                      ))}
                      {key.buckets.length === 0 && (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(key.created)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openPermissions(key)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Permissions
                      </button>
                      <button
                        onClick={() => setDeleteTarget(key)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete API Key"
        message={`Are you sure you want to delete key "${deleteTarget?.name || ""}"? Any applications using this key will lose access.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {permEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setPermEdit(null)} />
          <div className="relative bg-white rounded-xl border border-gray-200 shadow-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Permissions for &ldquo;{permEdit.keyName}&rdquo;
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Grant this key access to buckets with read, write, or owner permissions.
            </p>

            <div className="space-y-3">
              {permEdit.buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">{bucket.alias}</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={bucket.read}
                        onChange={() => togglePerm(bucket.id, "read")}
                        className="rounded border-gray-300"
                      />
                      Read
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={bucket.write}
                        onChange={() => togglePerm(bucket.id, "write")}
                        className="rounded border-gray-300"
                      />
                      Write
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={bucket.owner}
                        onChange={() => togglePerm(bucket.id, "owner")}
                        className="rounded border-gray-300"
                      />
                      Owner
                    </label>
                  </div>
                </div>
              ))}
              {permEdit.buckets.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No buckets available. Create a bucket first.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPermEdit(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
