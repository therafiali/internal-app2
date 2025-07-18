import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "../lib/constants";
import { supabase } from "../hooks/use-auth";

interface RechargeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRow: RechargeRequest | null;
  onSuccess?: () => void;
  nextStatus?: RechargeProcessStatus;
  rejectButtonText?: string;
  processButtonText?: string;
}

export default function RechargeDetailsDialog({
  open,
  onOpenChange,
  selectedRow,
  onSuccess,
  nextStatus = RechargeProcessStatus.SUPPORT,
  rejectButtonText = "Reject",
  processButtonText = "Process Request"
}: RechargeDetailsDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!selectedRow) return;
    setLoading(true);
    
    const { error } = await supabase
      .from("recharge_requests")
      .update({ process_status: nextStatus })
      .eq("id", selectedRow.id);
    
    setLoading(false);
    onOpenChange(false);
    
    if (!error && onSuccess) {
      onSuccess();
    }
  };

  const handleReject = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#23272f] border border-gray-700 text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-white">Recharge Details</DialogTitle>
          <DialogDescription>
            {selectedRow ? (
              <div className="space-y-2 text-sm">
                <div><b>Recharge ID:</b> {selectedRow.id || '-'}</div>
                <div><b>User:</b> {selectedRow.players ? `${selectedRow.players.firstname || ''} ${selectedRow.players.lastname || ''}`.trim() : '-'}</div>
                <div><b>Payment Method:</b> {selectedRow.payment_method || '-'}</div>
                <div><b>Amount:</b> {selectedRow.amount ? `$${selectedRow.amount}` : '-'}</div>
                <div><b>Pending Since:</b> {selectedRow.created_at ? new Date(selectedRow.created_at).toLocaleString() : '-'}</div>
              </div>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={handleReject}>
            {rejectButtonText}
          </Button>
          <Button
            variant="default"
            disabled={loading}
            onClick={handleProcess}
          >
            {loading ? "Processing..." : processButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 