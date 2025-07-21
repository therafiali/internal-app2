import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useState } from "react";
import {
  useFetchRedeemRequests,
  RedeemRequest,
} from "../hooks/api/queries/useFetchRedeemRequests";
import { RedeemProcessStatus } from "../lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useProcessLock } from "../hooks/useProcessLock";
import { useEffect } from "react";
import { supabase } from "../hooks/use-auth";
import { formatPendingSince } from "../lib/utils";

export default function VerificationRedeemPage() {
  type RowType = {
    id: string;
    pendingSince: string;
    teamCode: string;
    redeemId: string;
    platform: string;
    user: string;
    initBy: string;
    verification_redeem_process_status: string;
    amount: number;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;
  // Add process lock hook for the selected row
  const {
    loading: lockLoading,
    lockRequest,
    unlockRequest,
    approveRequest,
  } = useProcessLock(selectedRow?.id || "", "verification");

  // Use the custom hook to fetch redeem requests with process_status 'verification'
  const { data, isLoading, isError, error } = useFetchRedeemRequests(
    RedeemProcessStatus.VERIFICATION
  );

  // handle locking and unlocking states through the user-action
  useEffect(() => {
    const tryLock = async () => {
      if (selectedRow && open === false) {
        console.log("Verification Redeem Modal Data:", selectedRow);
        const locked = await lockRequest(selectedRow.id);
        if (locked) {
          setOpen(true);
        } else {
          setSelectedRow(null);
          window.alert(
            "This request is already being processed by someone else."
          );
          queryClient.invalidateQueries({
            queryKey: ["redeem_requests", RedeemProcessStatus.VERIFICATION],
          });
        }
      }
    };
    tryLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow]);

  const columns = [
    {
      accessorKey: "pendingSince",
      header: "PENDING SINCE",
      cell: ({ row }: { row: { original: RowType } }) => {
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
    { accessorKey: "teamCode", header: "TEAM CODE" },
    { accessorKey: "redeemId", header: "REDEEM ID" },
    { accessorKey: "platform", header: "PLATFORM" },
    { accessorKey: "user", header: "USER" },
    // { accessorKey: "initBy", header: "INIT BY" },
    {
      accessorKey: "actions",
      header: "ACTIONS",
      cell: ({ row }: { row: { original: RowType } }) => (
        <Button
          disabled={
            row.original.verification_redeem_process_status === "in_process" ||
            lockLoading
          }
          onClick={async () => {
            setSelectedRow(row.original);
            // Wait for selectedRow to update, then call lockRequest in useEffect
          }}
        >
          {row.original.verification_redeem_process_status === "in_process"
            ? `In Process`
            : "Process"}
        </Button>
      ),
    },
  ];

  // Map the fetched data to the table row format
  const tableData: RowType[] = (data || []).map((item: RedeemRequest) => ({
    id: item.id,
    pendingSince: item.created_at || "-",
    teamCode: item.teams?.team_code
      ? `ENT-${String(item.teams.team_code).replace(/\D+/g, "")}`
      : "-",
    redeemId: item.redeem_id || "-",
    platform: item.games?.game_name || "-",
    user: item.players
      ? `${item.players.firstname || ""} ${
          item.players.lastname || ""
        }`.trim() || "-"
      : "-",
    initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
    verification_redeem_process_status:
      item.verification_redeem_process_status || "pending",
    amount: item.amount || 0,
  }));

  // Function to update status from 'verification' to 'finance'
  async function updateRedeemStatus() {
    await approveRequest(RedeemProcessStatus.FINANCE);
    setOpen(false);
    setSelectedRow(null);
    queryClient.invalidateQueries({
      queryKey: ["redeem_requests", RedeemProcessStatus.VERIFICATION],
    });
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (isError) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <DynamicHeading title="Verification Redeem Request" />
      <div className="mt-6">
                <DynamicTable
          columns={columns}
          data={tableData}
          pagination={true}
          pageIndex={pageIndex}
          limit={limit}
          onPageChange={setPageIndex}
        />
      </div>
      <Dialog
        open={open}
        onOpenChange={async (isOpen) => {
          if (!isOpen && selectedRow) {
            await unlockRequest();
            setSelectedRow(null);
            queryClient.invalidateQueries({
              queryKey: ["redeem_requests", RedeemProcessStatus.VERIFICATION],
            });
          }
          setOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-black border border-gray-800 text-white shadow-2xl">
          <DialogHeader className="text-center pb-6 border-b border-gray-800">
            <DialogTitle className="text-2xl font-bold text-white">
              Redeem Request Details
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
                  <h3 className="text-lg font-semibold text-gray-300">USER INFORMATION</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Name</p>
                    <p className="text-white font-medium">
                      {selectedRow.user || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Team</p>
                    <p className="text-white font-medium">
                      {selectedRow.teamCode || "N/A"}
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
                  <h3 className="text-lg font-semibold text-gray-300">REQUEST DETAILS</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Redeem ID</p>
                    <p className="text-white font-medium font-mono bg-gray-800 px-2 py-1 rounded text-sm">
                      {selectedRow.redeemId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Platform</p>
                    <p className="text-white font-medium">{selectedRow.platform || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Amount & Time Card */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-gray-300 text-sm font-bold">⏰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">TRANSACTION INFO</h3>
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
                      {selectedRow.pendingSince
                        ? new Date(selectedRow.pendingSince).toLocaleString()
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
              onClick={async () => {
                if (selectedRow) {
                  // Set process_status to '7' (OPERATIONFAILED) on reject
                  await supabase
                    .from("redeem_requests")
                    .update({ process_status: "7" })
                    .eq("id", selectedRow.id);
                  await unlockRequest();
                  setSelectedRow(null);
                  setOpen(false);
                  queryClient.invalidateQueries({
                    queryKey: [
                      "redeem_requests",
                      RedeemProcessStatus.VERIFICATION,
                    ],
                  });
                }
              }}
              className="flex-1 bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-500 text-white transition-all duration-200 font-semibold"
            >
              <span className="mr-2">❌</span>
              Reject
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (selectedRow) {
                  await updateRedeemStatus();
                }
              }}
              disabled={lockLoading}
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
