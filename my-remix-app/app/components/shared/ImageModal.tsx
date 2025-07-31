import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
} from "../ui/dialog";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  altText?: string;
}

export default function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  altText = "Full size image" 
}: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" p-0">
        <div className="">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={altText}
              className="w-[1000px] h-[1000px] object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 