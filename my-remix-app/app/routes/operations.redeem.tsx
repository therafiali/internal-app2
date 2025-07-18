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
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import { useFetchCounts } from "../hooks/api/queries/useFetchCounts";
import { formatPendingSince } from "../lib/utils";

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
  const [page, setPage] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  // Fetch counts for each status
  const { data: pendingCountData } = useFetchCounts("redeem_requests", [RedeemProcessStatus.OPERATION]);
  const { data: failedCountData } = useFetchCounts("redeem_requests", ["7"]); // OPERATIONFAILED
  const { data: rejectedCountData } = useFetchCounts("redeem_requests", ["10"]); // OPERATIONREJECTED

  const pendingCount = pendingCountData ? pendingCountData.length : 0;
  const failedCount = failedCountData ? failedCountData.length : 0;
  const rejectedCount = rejectedCountData ? rejectedCountData.length : 0;

  const statusOptions = [
    { label: `PENDING (${pendingCount})`, value: "pending" },
    { label: `FAILED (${failedCount})`, value: "failed" },
    { label: `REJECTED (${rejectedCount})`, value: "rejected" },
  ];
  // Fetch data based on selectedStatus
  const getProcessStatusForTab = () => {
    if (selectedStatus === "rejected") return "10"; // OPERATIONREJECTED
    if (selectedStatus === "failed") return "7"; // OPERATIONFAILED
    return RedeemProcessStatus.OPERATION; // "0" for pending
  };

  const { data, isLoading, isError, error, refetch } = useFetchRedeemRequests(
    getProcessStatusForTab(),
    10,
    page * 10
  );

  console.log("Redeem Requests Data:", data);

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

  // Team codes for tabs
  const teamTabs = ["All", "ENT-1", "ENT-2", "ENT-3"];

  // Map the fetched data to the table row format
  const tableData: RowType[] = (Array.isArray(data) ? data : []).map(
    (item: any) => {
      return {
        id: String(item.id ?? "-"),
        pendingSince: String(item.created_at ?? "-"),
        teamCode: item.teams?.team_code
          ? `ENT-${String(item.teams.team_code).replace(/\D+/g, "")}`
          : "-",
        redeemId: String(item.redeem_id ?? "-"),
        platform: item.games?.game_name ?? "-",
        user: item.players
          ? `${item.players.firstname ?? ""} ${item.players.lastname ?? ""}`.trim() || "-"
          : "-",
        user_employee_code: item.users?.employee_code ?? "-",
        initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
        user_name: item.users?.name ?? "-",
        operation_redeem_process_status: item.operation_redeem_process_status,
        operation_redeem_process_by: item.operation_redeem_process_by,
      };
    }
  );

  // Filter table data by selected team
  const filteredTableData = selectedTeam === "All"
    ? tableData
    : tableData.filter((row) => row.teamCode === selectedTeam);

  // No need for rejected filter anymore, since data is fetched per status
  const finalTableData = filteredTableData;

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

  // Determine the total count for the selected status
  let totalCount = 0;
  if (selectedStatus === "pending") totalCount = pendingCount;
  else if (selectedStatus === "failed") totalCount = failedCount;
  else if (selectedStatus === "rejected") totalCount = rejectedCount;

  // Render table and pagination controls
  return (
    <div className="p-6">
      <DynamicHeading title="Operation Redeem Requests" />
      {/* Team Tabs */}
      <div style={{ display: "flex", gap: 24, background: "#222", borderRadius: 16, padding: 12, marginBottom: 24 }}>
        {teamTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTeam(tab)}
            style={{
              background: selectedTeam === tab ? "#232a3b" : "transparent",
              color: selectedTeam === tab ? "#3b82f6" : "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontWeight: selectedTeam === tab ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Status Bar */}
      <DynamicButtonGroup
        options={statusOptions}
        active={selectedStatus}
        onChange={setSelectedStatus}
        className="mb-4"
      />
      <DynamicTable columns={columns} data={filteredTableData} />
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <Button onClick={() => setPage(page - 1)} disabled={page === 0}>
          Prev
        </Button>
        <span style={{ margin: '0 12px', alignSelf: 'center', color: '#fff' }}>Page {page + 1}</span>
        <Button onClick={() => setPage(page + 1)} disabled={!data || data.length < 10}>
          Next
        </Button>
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
                onClick={async () => {
                  if (selectedRow) {
                    await supabase
                      .from("redeem_requests")
                      .update({ process_status: "10" })
                      .eq("id", selectedRow.id);
                    setSelectedRow(null);
                    setOpen(false);
                    refetch();
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
