import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { useProcessLock } from "../../hooks/useProcessLock";

interface ProcessButtonProps {
  requestId: string;
  status: string;
  department: "operation" | "verification" | "finance";
  nextProcessStatus: string;
  userName?: string;
  onApproved: () => void;
  onRejected?: () => void;
  children?: React.ReactNode;
  details?: React.ReactNode;
}

export function ProcessButton({
  requestId,
  status,
  department,
  nextProcessStatus,
  userName,
  onApproved,
  onRejected,
  children,
  details,
}: ProcessButtonProps) {
  const [open, setOpen] = useState(false);
  const { isProcessing, lockRequest, unlockRequest, approveRequest, loading } =
    useProcessLock(requestId, department);

  // Open modal and try to lock
  const handleOpen = async () => {
    const locked = await lockRequest();
    if (locked) setOpen(true);
    // else show error or alert
  };

  // Close modal and unlock
  const handleClose = async () => {
    await unlockRequest();
    setOpen(false);
    if (onRejected) onRejected();
  };

  // Approve and close
  const handleApprove = async () => {
    await approveRequest(nextProcessStatus);
    setOpen(false);
    onApproved();
  };

  return (
    <>
      <Button
        disabled={status === "in_process" || isProcessing || loading}
        onClick={handleOpen}
      >
        {status === "in_process"
          ? `In Process${userName ? ` by '${userName}'` : ""}`
          : children || "Process"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redeem Details</DialogTitle>
            <DialogDescription>
              {details || "Dummy data for redeem process."}
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">{details}</div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleClose}
              >
                Reject
              </Button>
            </DialogClose>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={loading}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
