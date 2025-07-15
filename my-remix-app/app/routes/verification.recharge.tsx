import { useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "../lib/constants";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const columns = [
  { accessorKey: "teamCode", header: "Team Code" },
  { accessorKey: "pendingSince", header: "Pending Since" },
  { accessorKey: "rechargeId", header: "Recharge ID" },
  { accessorKey: "user", header: "User" },
  { accessorKey: "platform", header: "Platform" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "initBy", header: "INIT BY" },
  { accessorKey: "assignedBy", header: "ASSIGNED BY" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function VerificationRechargePage() {
  const { data, isLoading, isError, error } = useFetchRechargeRequests(RechargeProcessStatus.VERIFICATION);

  // State for modal
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Console log the raw data for debugging
  console.log('Verification Recharge Data:', data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = (data || []).map((item: any) => ({
    teamCode: item.teams?.page_name || item.team_code || '-',
    pendingSince: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
    rechargeId: item.id || '-',
    user: item.players ? `${item.players.firstname || ''} ${item.players.lastname || ''}`.trim() : '-',
    platform: item.platform || '-',
    amount: item.amount ? `$${item.amount}` : '-',
    initBy: item.initBy || '-',
    assignedBy: item.assignedBy || '-',
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
      <DynamicHeading title="Verification Recharge" />
      <DynamicTable columns={columns} data={tableData} />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedRow ? (
                <div className="space-y-2 text-sm">
                  <div><b>Team Code:</b> {selectedRow.teams?.page_name || selectedRow.team_code || '-'}</div>
                  <div><b>Pending Since:</b> {selectedRow.created_at ? new Date(selectedRow.created_at).toLocaleString() : '-'}</div>
                  <div><b>Recharge ID:</b> {selectedRow.id || '-'}</div>
                  <div><b>User:</b> {selectedRow.players ? `${selectedRow.players.firstname || ''} ${selectedRow.players.lastname || ''}`.trim() : '-'}</div>
                  <div><b>Platform:</b> {selectedRow.platform || '-'}</div>
                  <div><b>Amount:</b> {selectedRow.amount ? `$${selectedRow.amount}` : '-'}</div>
                  <div><b>INIT BY:</b> {selectedRow.initBy || '-'}</div>
                  <div><b>ASSIGNED BY:</b> {selectedRow.assignedBy || '-'}</div>
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Process Request
            </Button>
            <Button variant="destructive" onClick={() => setModalOpen(false)}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
