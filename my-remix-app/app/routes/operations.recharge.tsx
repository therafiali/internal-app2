import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "../lib/constants";
import { supabase } from "~/hooks/use-auth";

type RechargeRequest = {
  teams?: { page_name?: string };
  team_code?: string;
  created_at?: string;
  id?: string;
  players?: { firstname?: string; lastname?: string };
};

const columns = [
  { accessorKey: "pendingSince", header: "Pending Since" },
  { accessorKey: "teamCode", header: "Team Code" },
  { accessorKey: "rechargeId", header: "Recharge ID" },
  { accessorKey: "user", header: "USER" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function OperationRechargePage() {
  const { data, isLoading, isError, error } = useFetchRechargeRequests(
    RechargeProcessStatus.OPERATION
  );

  // State for modal
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function updateRechargeStatus(
    id: string,
    newStatus: RechargeProcessStatus
  ) {
    const { error } = await supabase
      .from("recharge_requests")
      .update({ process_status: newStatus })
      .eq("id", id);
    return error;
  }

  // Console log the raw data for debugging
  console.log("Operation Recharge Data:", data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = (data || []).map((item: RechargeRequest) => ({
    pendingSince: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "-",
    teamCode: item.teams?.page_name || item.team_code || "-",
    rechargeId: item.recharge_id || "-",
    user: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",
    actions: (
      <Button
        variant="default"
        onClick={async () => {
          await supabase.from("recharge_requests").update({
            operation_recharge_process_status: 'in_process',
          }).eq("id", item.id);

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
      <DynamicHeading title="Operation Recharge " />
      <DynamicTable columns={columns} data={tableData} />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              {selectedRow ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <b>Team Code:</b>{" "}
                    {selectedRow.teams?.page_name ||
                      selectedRow.team_code ||
                      "-"}
                  </div>
                  <div>
                    <b>Pending Since:</b>{" "}
                    {selectedRow.created_at
                      ? new Date(selectedRow.created_at).toLocaleString()
                      : "-"}
                  </div>
                  <div>
                    <b>Recharge ID:</b> {selectedRow.id || "-"}
                  </div>
                  <div>
                    <b>User:</b>{" "}
                    {selectedRow.players
                      ? `${selectedRow.players.firstname || ""} ${
                          selectedRow.players.lastname || ""
                        }`.trim()
                      : "-"}
                  </div>
                </div>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={() => setModalOpen(false)}>
              Reject
            </Button>
            <Button variant="default" onClick={async () => {
              if (!selectedRow) return;
              await updateRechargeStatus(selectedRow.id, RechargeProcessStatus.COMPLETED)
            }}>
              Process Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
