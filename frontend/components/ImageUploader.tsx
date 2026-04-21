"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

interface ImageUploaderProps {
  onGrade: (file: File) => void;
  isLoading: boolean;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageUploader({ onGrade, isLoading }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = "produce-image-input";

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndSetFile = (nextFile: File) => {
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("Only JPEG and PNG files are supported.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(nextFile);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (picked) {
      validateAndSetFile(picked);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  return (
    <section id="grade" className="mx-auto w-full max-w-3xl">
      <div
        className={`group rounded-2xl border-2 border-dashed bg-white/80 p-6 text-center shadow-sm transition hover:shadow-md ${
          isDragActive ? "border-agri-dark bg-agri-light/10" : "border-agri-mid/50 hover:border-agri-mid"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragActive(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={handleDrop}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleInputChange}
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative mx-auto h-72 w-full max-w-md overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              <Image src={previewUrl} alt="Produce preview" fill className="object-contain" unoptimized />
            </div>
            <p className="text-sm text-stone-700">
              {file?.name} • {file ? formatBytes(file.size) : ""}
            </p>
            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 transition hover:border-agri-mid hover:text-agri-mid"
            >
              Click to re-upload
            </label>
          </div>
        ) : (
          <div className="space-y-2 py-8">
            <p className="font-display text-2xl text-agri-dark">Drop produce image here</p>
            <p className="text-sm text-stone-600">or click to browse from your device</p>
            <p className="text-xs text-stone-500">Supported formats: JPEG, PNG</p>
            <div className="pt-2">
              <label
                htmlFor={inputId}
                className="inline-flex cursor-pointer rounded-full bg-agri-dark px-4 py-2 text-sm font-semibold text-white transition hover:bg-agri-mid"
              >
                Browse Files
              </label>
            </div>
          </div>
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {file ? (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => onGrade(file)}
            disabled={isLoading}
            className="inline-flex items-center rounded-full bg-agri-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-agri-mid disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Grading Produce..." : "Grade this Produce"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
