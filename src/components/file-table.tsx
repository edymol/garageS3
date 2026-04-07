"use client";

import { useState } from "react";
import { formatBytes, formatDate, isImageFile } from "@/lib/utils";

interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  isFolder: boolean;
}

interface FileTableProps {
  files: FileItem[];
  bucket: string;
  prefix: string;
  onNavigateFolder: (prefix: string) => void;
  onPreviewImage: (src: string, filename: string) => void;
  onDelete: (keys: string[]) => void;
}

export function FileTable({
  files,
  bucket,
  prefix,
  onNavigateFolder,
  onPreviewImage,
  onDelete,
}: FileTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    const nonFolders = files.filter((f) => !f.isFolder);
    if (selected.size === nonFolders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(nonFolders.map((f) => f.key)));
    }
  };

  const getFilename = (key: string) => {
    const stripped = key.replace(prefix, "");
    return stripped.endsWith("/") ? stripped.slice(0, -1) : stripped;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {selected.size > 0 && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-sm text-blue-700">{selected.size} selected</span>
          <button
            onClick={() => onDelete(Array.from(selected))}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="px-5 py-3 w-8">
              <input
                type="checkbox"
                onChange={toggleAll}
                checked={
                  files.filter((f) => !f.isFolder).length > 0 &&
                  selected.size === files.filter((f) => !f.isFolder).length
                }
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Size</th>
            <th className="px-5 py-3 font-medium">Modified</th>
            <th className="px-5 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const name = getFilename(file.key);
            return (
              <tr
                key={file.key}
                className="border-b border-gray-50 hover:bg-gray-50"
              >
                <td className="px-5 py-3">
                  {!file.isFolder && (
                    <input
                      type="checkbox"
                      checked={selected.has(file.key)}
                      onChange={() => toggleSelect(file.key)}
                      className="rounded border-gray-300"
                    />
                  )}
                </td>
                <td className="px-5 py-3">
                  {file.isFolder ? (
                    <button
                      onClick={() => onNavigateFolder(file.key)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2"
                    >
                      <span>📁</span> {name}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-900 font-mono">{name}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {file.isFolder ? "—" : formatBytes(file.size)}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {file.lastModified ? formatDate(file.lastModified) : "—"}
                </td>
                <td className="px-5 py-3">
                  {!file.isFolder && (
                    <div className="flex gap-3">
                      {isImageFile(file.key) && (
                        <button
                          onClick={() =>
                            onPreviewImage(
                              `/api/s3/${bucket}/download/${file.key}`,
                              name
                            )
                          }
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Preview
                        </button>
                      )}
                      <a
                        href={`/api/s3/${bucket}/download/${file.key}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => onDelete([file.key])}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {files.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                This folder is empty
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
