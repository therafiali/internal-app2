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
import { useFetchRedeemRequests } from "../hooks/api/queries/useFetchRedeemRequests";
import { supabase } from "../hooks/use-auth";
import { RedeemProcessStatus } from "../lib/constants";

import { useQueryClient } from "@tanstack/react-query";

export default function RedeemPage() {
  type RowType = {
    id: string;
    pendingSince: string;
    teamCode: string;
    redeemId: string;
    platform: string;
    user: string;
    user_employee_code: string;
    initBy: string;
    user_name: string;
    operation_redeem_process_status?: string;
    operation_redeem_process_by?: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const queryClient = useQueryClient();

  // Use the custom hook to fetch redeem requests with process_status 'operation'
  const { data, isLoading, isError, error, refetch } = useFetchRedeemRequests(
    RedeemProcessStatus.OPERATION
  );

  console.log("Redeem Requests Data:", data);

  function formatPendingSince(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const mins = diffMins % 60;
    const hours = diffHours % 24;
    const days = diffDays;

    // Format date as MM/DD/YYYY
    const formattedDate = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

    // Format time as 12-hour with AM/PM
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    let relative = "";
    if (days > 0) relative += `${days}d, `;
    if (hours > 0 || days > 0) relative += `${hours}h, `;
    relative += `${mins}m ago`;

    return { relative, formattedDate, formattedTime };
  }

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
    { accessorKey: "initBy", header: "INIT BY" },

    {
      accessorKey: "actions",
      header: "ACTIONS",
      cell: ({ row }: { row: { original: RowType } }) => (
        <Button
          disabled={
            row.original.operation_redeem_process_status === "in_process"
          }
          onClick={async () => {
            // fetch the row and check if it's in_process and show the alert
            const { data: rowData } = await supabase
              .from("redeem_requests")
              .select(
                "operation_redeem_process_status, operation_redeem_process_by, users:operation_redeem_process_by (name, employee_code)"
              )
              .eq("id", row.original.id);
            console.log(rowData, "rowData");
            if (
              rowData &&
              rowData[0].operation_redeem_process_status === "in_process"
            ) {
              window.alert(
                rowData[0].operation_redeem_process_status +
                  " already in process" +
                  " by " +
                  rowData[0].operation_redeem_process_by
              );
              refetch();
              return;
            }

            // update the operation_redeem_process_by to the current_user id from userAuth
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              const currentUserId = userData.user.id;
              // update the operation_redeem_process_by to the current_user id from userAuth
              await supabase
                .from("redeem_requests")
                .update({
                  operation_redeem_process_status: "in_process",
                  operation_redeem_process_by: currentUserId,
                  operation_redeem_process_at: new Date().toISOString(),
                })
                .eq("id", row.original.id);

              setSelectedRow(row.original);
              refetch();
              setOpen(true);
            }
          }}
        >
          {row.original.operation_redeem_process_status === "in_process"
            ? `In Process${
                row.original.operation_redeem_process_by
                  ? ` by '${row.original.user_name}'`
                  : ""
              }`
            : "Process"}
        </Button>
      ),
    },
  ];

  // Map the fetched data to the table row format
  const tableData: RowType[] = (Array.isArray(data) ? data : []).map(
    (item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        id: i.id,
        pendingSince: i.created_at || "-",
        teamCode: i.teams?.page_name || "-",
        redeemId: i.redeem_id || "-",
        platform: i.process_status || "-",
        user: i.players
          ? `${i.players.firstname || ""} ${i.players.lastname || ""}`.trim() ||
            "-"
          : "-",
        user_employee_code: i.users?.employee_code || "-",
        initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
        user_name: i.users?.name || "-",
        operation_redeem_process_status: i.operation_redeem_process_status,
        operation_redeem_process_by: i.operation_redeem_process_by,
      };
    }
  );

  // Function to update status from 'operation' to 'verification'
  async function updateRedeemStatus(id: string) {
    const { error: updateError } = await supabase
      .from("redeem_requests")
      .update({ process_status: RedeemProcessStatus.VERIFICATION })
      .eq("id", id);
    if (!updateError) {
      setOpen(false);
      setSelectedRow(null);
      // Invalidate the query to refetch data and update the UI
      queryClient.invalidateQueries({
        queryKey: ["redeem_requests", RedeemProcessStatus.OPERATION],
      });
      // Optionally, you can trigger a page reload or use a state to force refetch
    }
  }

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus(id: string) {
    await supabase
      .from("redeem_requests")
      .update({
        operation_redeem_process_status: "idle",
        operation_redeem_process_by: null,
        operation_redeem_process_at: null,
      })
      .eq("id", id);
    refetch();
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (isError) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <DynamicHeading title="Redeem Request" />
      <div className="mt-6">
        <DynamicTable columns={columns} data={tableData} />
      </div>
      <Dialog
        open={open}
        onOpenChange={async (isOpen) => {
          if (!isOpen && selectedRow) {
            await resetProcessStatus(selectedRow.id);
            setSelectedRow(null);
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
              >
                Reject
              </Button>
            </DialogClose>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={async () => {
                if (selectedRow) {
                  await updateRedeemStatus(selectedRow.id);
                  setSelectedRow(null);
                }
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
