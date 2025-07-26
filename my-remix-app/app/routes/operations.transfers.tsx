import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useState } from "react";
// import { useFetchRedeemRequests, useFetchAllRedeemRequests } from "../hooks/api/queries/useFetchRedeemRequests";
import { useFetchTransferRequestsByStatus, useFetchAllTransferRequestsByStatus } from "../hooks/api/queries/useFetchTransferRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { supabase } from "../hooks/use-auth";
import { RechargeProcessStatus, TransferRequestStatus } from "../lib/constants";

import { useQueryClient } from "@tanstack/react-query";
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import { useFetchCounts } from "../hooks/api/queries/useFetchCounts";
import { formatPendingSince } from "../lib/utils";

export default function TransferRequestPage() {
  type RowType = {
    id: string;
    player_id: string;
    from_platform: string;
    to_platform: string;
    amount: string;
    process_status: string;
    created_at: string;
    process_by: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  
  // Fetch teams dynamically from database
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();
  
  // Replace "All Teams" with "ALL" for consistency
  const teams = rawTeams.map(team => team === "All Teams" ? "ALL" : team);
  
  // Fetch counts for each status
  const { data: pendingCountData } = useFetchCounts("transfer_requests", ["1"]);  
  const { data: failedCountData } = useFetchCounts("transfer_requests", ["2"]); 
  const { data: rejectedCountData } = useFetchCounts("transfer_requests", ["3"]);

  const pendingCount = pendingCountData ? pendingCountData.length : 0;
  const failedCount = failedCountData ? failedCountData.length : 0;
  const rejectedCount = rejectedCountData ? rejectedCountData.length : 0;

  const statusOptions = [
    { label: `PENDING (${pendingCount})`, value: "pending" },
    { label: `COMPLETED (${failedCount})`, value: "completed" },
    { label: `CANCELLED (${rejectedCount})`, value: "cancelled" },
  ];
  // Fetch data based on selectedStatus
  const getProcessStatusForTab = () => {
    if (selectedStatus === "cancelled") return "3"; // "3" for cancelled
    if (selectedStatus === "completed") return "2"; // "2" for completed
    return "1"; // "1" for pending
  };

  const processStatus = getProcessStatusForTab();

  // Fetch data - use status-filtered data when searching, paginated when not
  const { data: paginatedData, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError, refetch: refetchPaginated } = useFetchTransferRequestsByStatus(
    processStatus,
    searchTerm ? undefined : 10,
    searchTerm ? undefined : page * 10
  );

  // Fetch all data for search with status filter
  const { data: allData, isLoading: isAllLoading, isError: isAllError, error: allError, refetch: refetchAll } = useFetchAllTransferRequestsByStatus(processStatus);

  // Use appropriate data source
  const data = searchTerm ? allData : paginatedData;
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError; 
  
  // Function to refetch data after updates
  const refetchData = () => {
    refetchPaginated();
    refetchAll();
    queryClient.invalidateQueries({
      queryKey: ["transfer_requests", processStatus],
    });
    queryClient.invalidateQueries({
      queryKey: ["all_transfer_requests", processStatus],
    });
  };

  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm ? Math.ceil((data || []).length / 10) : Math.ceil((data || []).length / 10);

  console.log("Transfer Requests Data:", data);

  const columns = [
    { accessorKey: "player_id", header: "PLAYER" },
    { accessorKey: "from_platform", header: "FROM PLATFORM" },
    { accessorKey: "to_platform", header: "TO PLATFORM" },
    { accessorKey: "amount", header: "AMOUNT" },
    { accessorKey: "process_status", header: "STATUS" },
    { accessorKey: "created_at", header: "CREATED AT" },
    {
      accessorKey: "actions",
      header: "ACTIONS",
      cell: ({ row }: { row: { original: RowType } }) => (
        <Button
          disabled={
            row.original.process_status === "in_process"
          }
          onClick={async () => {
            // fetch the row and check if it's in_process and show the alert
            const { data: rowData } = await supabase
              .from("transfer_requests")
              .select(
                "process_status, process_by, users:process_by (name, employee_code)"
              )
              .eq("id", row.original.id);
            console.log(rowData, "rowData");
            if (
              rowData &&
              rowData[0].process_status === "in_process"
            ) {
              window.alert(
                rowData[0].process_status +
                  " already in process" +
                  " by " +
                  rowData[0].process_by
              );
              refetchData();
              return;
            }

            // update the operation_transfer_process_by to the current_user id from userAuth
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              const currentUserId = userData.user.id;
              // update the operation_transfer_process_by to the current_user id from userAuth
              await supabase
                .from("transfer_requests")
                .update({
                  process_status: "in_process",
                  process_by: currentUserId,
                  process_at: new Date().toISOString(),
                })
                .eq("id", row.original.id);

              setSelectedRow(row.original);
              refetchData();
              setOpen(true);
            }
          }}
        >
          {row.original.process_status === "in_process"
            ? `In Process${
                row.original.process_by
                  ? ` by '${row.original.player_id}'`
                  : ""
              }`
            : "Process"}
        </Button>
      ),
    },
  ];

  // Map the fetched data to the table row format
  const tableData: RowType[] = (Array.isArray(data) ? data : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      const fromPlatformName = item.from_platform_game?.game_name ?? item.from_platform;
      const toPlatformName = item.to_platform_game?.game_name ?? item.to_platform;
      
      const fromPlatformDisplay = item.from_platform_username 
        ? `${fromPlatformName} (${item.from_platform_username})`
        : fromPlatformName;
      
      const toPlatformDisplay = item.to_platform_username 
        ? `${toPlatformName} (${item.to_platform_username})`
        : toPlatformName;

      return {
        id: String(item.id ?? "-"),
        player_id: (item.players?.fullname ?? (item.players?.firstname + " " + item.players?.lastname) ?? item.player_id) ?? "-",
        from_platform: fromPlatformDisplay ?? "-",
        to_platform: toPlatformDisplay ?? "-",
        amount: item.amount ? `$${item.amount}` : "$0",
        process_status: item.process_status ?? "Pending",
        created_at: item.created_at ? new Date(item.created_at).toLocaleString() : "-",
        process_by: item.process_by ?? "-",
      };
    }
  );

  // Filter table data by selected team
  const filteredTableData = selectedTeam === "ALL"
    ? tableData
    : tableData.filter((row) => row.from_platform === selectedTeam);

  // No need for rejected filter anymore, since data is fetched per status
  const finalTableData = filteredTableData;

  // Function to update status to 'completed' when approved
  async function updateTransferStatus(id: string) {
    console.log("Updating transfer request ID:", id);
    
    // Try updating just the process_status first
    const { error: updateError } = await supabase
      .from("transfer_requests")
      .update({ process_status: "2" })
      .eq("id", id);
      
    if (updateError) {
      console.error("Update error:", updateError);
      // If that fails, try with just process_status as a number
      const { error: updateError2 } = await supabase
        .from("transfer_requests")
        .update({ process_status: 2 })
        .eq("id", id);
        
      if (updateError2) {
        console.error("Second update error:", updateError2);
      } else {
        console.log("Update successful with number");
        setOpen(false);
        setSelectedRow(null);
        refetchData();
      }
    } else {
      console.log("Update successful with string");
      setOpen(false);
      setSelectedRow(null);
      refetchData();
    }
  }

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus(id: string) {
    await supabase
        .from("transfer_requests")
      .update({
        process_status: "idle",
        process_by: null,
        process_at: null,
      })
      .eq("id", id);
    refetchData();
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (isError) {
    return <div className="p-6 text-red-500">Error: {error?.message || 'Unknown error'}</div>;
  }



  // Render table and pagination controls
  return (
    <div className="p-6">
      <DynamicHeading title=" Transfer Requests" />
      {/* Team Tabs */}
      <TeamTabsBar 
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={setSelectedTeam}
      />
      {/* Status Bar */}
      <DynamicButtonGroup
        options={statusOptions}
        active={selectedStatus}
        onChange={setSelectedStatus}
        className="mb-4"
      />
      <DynamicTable
        columns={columns}
        data={finalTableData}
        pagination={true}
        pageIndex={page}
        pageCount={pageCount}
        limit={10}
        onPageChange={(newPageIndex) => {
          setPage(newPageIndex);
          if (searchTerm) setPage(0);
        }}
        onSearchChange={(search) => {
          setSearchTerm(search);
          setPage(0);
        }}
      />
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
        <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border border-gray-700">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-white">
              Approve Transfer Request
            </DialogTitle>
            
          </DialogHeader>
          
          {selectedRow && (
            <div className="space-y-4">
              {/* Transfer Details Section */}
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                  <div>
                      <p className="text-gray-400 text-sm mb-1">Player</p>
                      <p className="text-white font-medium">{selectedRow.player_id || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">From</p>
                      <p className="text-white font-medium">{selectedRow.from_platform || "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Amount</p>
                      <p className="text-white font-medium">{selectedRow.amount || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">To</p>
                      <p className="text-white font-medium">{selectedRow.to_platform || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}

          <DialogFooter className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="ghost"
              onClick={async () => {
                if (selectedRow) {
                  console.log("Rejecting transfer request ID:", selectedRow.id);
                  
                  // Try updating just the process_status first
                  const { error } = await supabase
                    .from("transfer_requests")
                    .update({ process_status: "3" })
                    .eq("id", selectedRow.id);
                  
                  if (error) {
                    console.error("Reject error:", error);
                    // If that fails, try with just process_status as a number
                    const { error: error2 } = await supabase
                      .from("transfer_requests")
                      .update({ process_status: 3 })
                      .eq("id", selectedRow.id);
                      
                    if (error2) {
                      console.error("Second reject error:", error2);
                    } else {
                      console.log("Reject successful with number");
                      setSelectedRow(null);
                      setOpen(false);
                      refetchData();
                    }
                  } else {
                    console.log("Reject successful with string");
                    setSelectedRow(null);
                    setOpen(false);
                    refetchData();
                  }
                }
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              Reject
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (selectedRow) {
                  await updateTransferStatus(selectedRow.id);
                  setSelectedRow(null);
                  setOpen(false);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
