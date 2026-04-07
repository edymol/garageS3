"use client";

import { useCallback, useState, DragEvent } from "react";

interface UploadZoneProps {
  bucket: string;
  prefix: string;
  onUploadComplete: () => void;
  onError: (msg: string) => void;
}

export function UploadZone({ bucket, prefix, onUploadComplete, onError }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("prefix", prefix);
        const res = await fetch(`/api/s3/${bucket}/upload`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.error) {
          onError(`Failed to upload ${file.name}: ${json.error}`);
          setUploading(false);
          return;
        }
      }
      setUploading(false);
      onUploadComplete();
    },
    [bucket, prefix, onUploadComplete, onError]
  );

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
        dragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      {uploading ? (
        <p className="text-sm text-gray-500">Uploading...</p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-2">
            Drag & drop files here, or
          </p>
          <label className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer">
            Choose Files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  uploadFiles(e.target.files);
                }
              }}
            />
          </label>
        </>
      )}
    </div>
  );
}
