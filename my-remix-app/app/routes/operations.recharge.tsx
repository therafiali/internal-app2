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
import { formatPendingSince } from "../lib/utils";

type RechargeRequest = {
  teams?: { page_name?: string; team_code?: string };
  team_code?: string;
  created_at?: string;
  id?: string;
  players?: { firstname?: string; lastname?: string };
  recharge_id?: string;
  games?: { game_name?: string; game_username?: string };
  amount?: number;
};

const columns = [
  {
    accessorKey: "pendingSince",
    header: "Pending Since",
    cell: ({ row }: { row: { original: any } }) => {
      const { relative, formattedDate, formattedTime } = formatPendingSince(
        row.original.pendingSince
      );
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{relative}</div>
          <div>{formattedDate}</div>
          <div>{formattedTime}</div>
        </div>
      );
    },
  },
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
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

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
    pendingSince: item.created_at || '-',
    teamCode: item.teams?.team_code
      ? `ENT-${String(item.teams.team_code).replace(/\D+/g, "")}`
      : "-",
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
      <DynamicTable
        columns={columns}
        data={tableData}
        pagination={true}
        pageIndex={pageIndex}
        limit={limit}
        onPageChange={setPageIndex}
      />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-black border border-gray-800 text-white shadow-2xl">
          <DialogHeader className="text-center pb-6 border-b border-gray-800">
            <DialogTitle className="text-2xl font-bold text-white">
              Recharge Request Details
            </DialogTitle>
            <div className="w-16 h-1 bg-gray-600 mx-auto rounded-full mt-2"></div>
          </DialogHeader>
          
          {selectedRow && (
            <div className="space-y-4 py-4">
              {/* User Info Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">👤</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">User Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Name</p>
                    <p className="text-white font-medium">
                      {selectedRow.players
                        ? `${selectedRow.players.firstname || ""} ${selectedRow.players.lastname || ""}`.trim()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Team</p>
                    <p className="text-white font-medium">
                      {selectedRow.teams?.team_code
                        ? `ENT-${String(selectedRow.teams.team_code).replace(/\D+/g, "")}`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">💳</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">Request Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Recharge ID</p>
                    <p className="text-white font-medium font-mono bg-gray-800 px-2 py-1 rounded text-sm">
                      {selectedRow.recharge_id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Platform</p>
                    <p className="text-white font-medium">{selectedRow.games?.game_name || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Amount & Time Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">⏰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">Transaction Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Amount</p>
                    <p className="text-2xl font-bold text-green-400">
                      {selectedRow.amount ? `$${selectedRow.amount}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Pending Since</p>
                    <p className="text-white font-medium text-sm">
                      {selectedRow.created_at
                        ? new Date(selectedRow.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-800">
            <Button 
              variant="destructive" 
              onClick={() => setModalOpen(false)}
              className="flex-1 bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-500 text-white transition-all duration-200 font-semibold"
            >
              <span className="mr-2">❌</span>
              Reject
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (!selectedRow || !selectedRow.id) return;
                await updateRechargeStatus(selectedRow.id, RechargeProcessStatus.COMPLETED)
              }}
              className="flex-1 bg-gray-700 hover:bg-green-600 border border-gray-600 hover:border-green-500 text-white transition-all duration-200 font-semibold"
            >
              <span className="mr-2">✅</span>
              Process Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
