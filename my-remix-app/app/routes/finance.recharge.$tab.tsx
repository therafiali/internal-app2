import { useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests, RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "~/lib/constants";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { supabase } from "../hooks/use-auth";

const columns = [
  { accessorKey: "pendingSince", header: "PENDING SINCE" },
  { accessorKey: "rechargeId", header: "RECHARGE ID" },
  { accessorKey: "user", header: "USER" },
  { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
  { accessorKey: "amount", header: "AMOUNT" },
  { accessorKey: "actions", header: "ACTIONS" },
];

// Function to update status
async function updateRechargeStatus(id: string, newStatus: RechargeProcessStatus) {
  const { error } = await supabase
    .from("recharge_requests")
    .update({ process_status: newStatus })
    .eq("id", id);
  return error;
}

export default function RechargeQueuePage() {
  const { data, isLoading, isError, error, refetch } = useFetchRechargeRequests(RechargeProcessStatus.FINANCE);

  // State for modal
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Map fetched data to table format
  const tableData = (data || []).map((item: RechargeRequest) => ({
    pendingSince: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
    rechargeId: item.recharge_id || '-',
    user: item.players ? `${item.players.firstname || ''} ${item.players.lastname || ''}`.trim() : '-',
    paymentMethod: item.payment_method || '-',
    amount: item.amount ? `$${item.amount}` : '-',
    actions: (
      <Button
        variant="default"
        onClick={() => {
          setSelectedRow(item);
          setModalOpen(true);
        }}
      >
        Process
      </Button>
    ),
  }));

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <DynamicHeading title="Recharge Queue" />
      <DynamicTable columns={columns} data={tableData} />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recharge Details</DialogTitle>
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
            <Button variant="destructive" onClick={() => setModalOpen(false)}>
              Reject
            </Button>
            <Button
              variant="default"
              disabled={loading}
              onClick={async () => {
                if (!selectedRow) return;
                setLoading(true);
                await updateRechargeStatus(selectedRow.id, RechargeProcessStatus.SUPPORT);
                setLoading(false);
                setModalOpen(false);
                refetch();
              }}
            >
              {loading ? "Processing..." : "Process Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
