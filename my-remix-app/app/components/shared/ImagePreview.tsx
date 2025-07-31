import React, { useState, useCallback } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Eye,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
  showPreview?: boolean;
  onPreviewChange?: (show: boolean) => void;
  children?: React.ReactNode;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = "Image",
  className = "",
  showPreview = false,
  onPreviewChange,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(showPreview);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    onPreviewChange?.(true);
  }, [onPreviewChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setScale(1);
    setRotation(0);
    setIsFullscreen(false);
    onPreviewChange?.(false);
  }, [onPreviewChange]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.25));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "image";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, alt]);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "+") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "r") {
        handleRotate();
      }
    },
    [handleClose, handleZoomIn, handleZoomOut, handleRotate]
  );

  return (
    <>
      {children ? (
        <div onClick={handleOpen} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpen();
            }
          }}
          className={`p-0 border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded ${className}`}
          aria-label={`View ${alt} in full size`}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover border border-gray-600 rounded hover:border-blue-400 transition-colors"
          />
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className={`flex flex-col items-center bg-[#18181b] border border-gray-700 ${
            isFullscreen
              ? "w-screen h-screen max-w-none max-h-none"
              : "max-w-4xl max-h-[90vh]"
          }`}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-4">
            <h3 className="text-lg font-semibold text-white">{alt}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.25}
                className="text-white hover:bg-gray-700"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-white text-sm min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="text-white hover:bg-gray-700"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRotate}
                className="text-white hover:bg-gray-700"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-white hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-white hover:bg-gray-700"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button> */}
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 w-full flex items-center justify-center overflow-auto">
            <div
              className="relative"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease-in-out",
              }}
            >
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain rounded shadow-lg"
                draggable={false}
              />
            </div>
          </div>

          {/* Footer with controls info */}
          <div className="text-center mt-4 text-gray-400 text-sm">
            <p>Use + / - keys to zoom, R to rotate, ESC to close</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImagePreview;
