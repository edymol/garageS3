"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Breadcrumb } from "@/components/breadcrumb";
import { UploadZone } from "@/components/upload-zone";
import { FileTable } from "@/components/file-table";
import { ImagePreview } from "@/components/image-preview";

interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  isFolder: boolean;
}

export default function FileBrowserPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: bucket } = use(params);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [prefix, setPrefix] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteKeys, setDeleteKeys] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ src: string; name: string } | null>(null);
  const { showToast } = useToast();

  const fetchFiles = useCallback(() => {
    setLoading(true);
    fetch(`/api/s3/${bucket}/list?prefix=${encodeURIComponent(prefix)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setFiles(json.data);
      })
      .finally(() => setLoading(false));
  }, [bucket, prefix]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleDelete = async () => {
    const res = await fetch(`/api/s3/${bucket}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: deleteKeys }),
    });
    const json = await res.json();
    if (json.error) {
      showToast(json.error, "error");
    } else {
      showToast(`Deleted ${deleteKeys.length} item(s)`, "success");
      setDeleteKeys([]);
      fetchFiles();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{bucket}</h2>
      <Breadcrumb bucket={bucket} prefix={prefix} onNavigate={setPrefix} />

      <div className="mb-6">
        <UploadZone
          bucket={bucket}
          prefix={prefix}
          onUploadComplete={() => {
            showToast("Upload complete", "success");
            fetchFiles();
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <FileTable
          files={files}
          bucket={bucket}
          prefix={prefix}
          onNavigateFolder={setPrefix}
          onPreviewImage={(src, name) => setPreview({ src, name })}
          onDelete={setDeleteKeys}
        />
      )}

      <ConfirmDialog
        open={deleteKeys.length > 0}
        title="Delete Files"
        message={`Are you sure you want to delete ${deleteKeys.length} item(s)? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteKeys([])}
      />

      <ImagePreview
        open={!!preview}
        src={preview?.src || ""}
        filename={preview?.name || ""}
        onClose={() => setPreview(null)}
      />
    </div>
  );
}
