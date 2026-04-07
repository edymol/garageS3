"use client";

interface ImagePreviewProps {
  open: boolean;
  src: string;
  filename: string;
  onClose: () => void;
}

export function ImagePreview({ open, src, filename, onClose }: ImagePreviewProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg max-w-3xl max-h-[80vh] w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 flex items-center justify-center bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={filename}
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
