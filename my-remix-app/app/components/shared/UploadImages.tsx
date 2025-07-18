import React, { useState, useImperativeHandle, forwardRef } from "react";
import { supabase } from "../../hooks/use-auth";
import { Button } from "../ui/button";

interface UploadImagesProps {
  bucket: string;
  numberOfImages: number;
  onUpload: (urls: string[]) => void;
  showUploadButton?: boolean;
  onFilesSelected?: (files: File[]) => void;
}

export interface UploadImagesRef {
  uploadFiles: () => Promise<string[]>;
  selectedFiles: File[];
}

const UploadImages = forwardRef<UploadImagesRef, UploadImagesProps>(({
  bucket,
  numberOfImages,
  onUpload,
  showUploadButton = true,
  onFilesSelected,
}, ref) => {
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      let files = Array.from(e.target.files);
      if (files.length > numberOfImages) {
        files = files.slice(0, numberOfImages);
      }
      setSelectedFiles(files);
      onFilesSelected?.(files);
    }
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) {
      return [];
    }

    setUploading(true);
    setError(null);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const filePath = `${Date.now()}-${i}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
      setUrls(uploadedUrls);
      onUpload(uploadedUrls);
      return uploadedUrls;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as Error).message || "Upload failed");
      } else {
        setError("Upload failed");
      }
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Expose methods and state to parent component
  useImperativeHandle(ref, () => ({
    uploadFiles,
    selectedFiles,
  }));

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        multiple={numberOfImages > 1}
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
      />
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {selectedFiles.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={idx}
                className="border border-gray-700 rounded overflow-hidden"
              >
                <img
                  src={url}
                  alt={`preview-${idx}`}
                  className="object-cover w-full h-24"
                />
                <div className="text-xs text-gray-400 truncate px-1 pb-1">
                  {file.name}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Show upload button only if showUploadButton is true */}
      {showUploadButton && (
        <Button
          type="button"
          onClick={uploadFiles}
          disabled={uploading || selectedFiles.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {uploading
            ? "Uploading..."
            : `Upload${
                selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ""
              }`}
        </Button>
      )}
      
      {/* Show status message when upload button is hidden */}
      {!showUploadButton && selectedFiles.length > 0 && (
        <div className="text-green-400 text-xs">
          {selectedFiles.length} file(s) selected. Will be uploaded when you click Process.
        </div>
      )}
      
      {error && <div className="text-red-500 text-xs">{error}</div>}
      {urls.length > 0 && (
        <div className="space-y-1">
          <div className="text-green-400 text-xs">Uploaded URLs:</div>
          {urls.map((url, i) => (
            <div key={i} className="break-all text-xs text-gray-200">
              {url}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

UploadImages.displayName = "UploadImages";

export default UploadImages;
