import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const queryClient = useQueryClient();
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
    { accessorKey: "pendingSince", header: "PENDING SINCE" },
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
    teamCode: item.teams?.page_name || "-",
    redeemId: item.redeem_id || "-",
    platform: item.games.game_name || "-",
    user: item.players
      ? `${item.players.firstname || ""} ${
          item.players.lastname || ""
        }`.trim() || "-"
      : "-",
    initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
    verification_redeem_process_status:
      item.verification_redeem_process_status || "pending",
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
        <DynamicTable columns={columns} data={tableData} />
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redeem Details</DialogTitle>
            <DialogDescription>
              Dummy data for redeem process.
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="my-4">
              <div>
                <b>Redeem ID:</b> {selectedRow.redeemId}
              </div>
              <div>
                <b>User:</b> {selectedRow.user}
              </div>
              <div>
                <b>Team Code:</b> {selectedRow.teamCode}
              </div>
              <div>
                <b>Platform:</b> {selectedRow.platform}
              </div>
              <div>
                <b>Pending Since:</b> {selectedRow.pendingSince}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  if (selectedRow) {
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
              >
                Reject
              </Button>
            </DialogClose>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                if (selectedRow) {
                  await updateRedeemStatus();
                }
              }}
              disabled={lockLoading}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
