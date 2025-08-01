import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import { Button } from "../components/ui/button";
import { PageLoader } from "../components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogProcessInput,
} from "../components/ui/dialog";
import { useState } from "react";
import { useFetchTransferRequests } from "../hooks/api/queries/useFetchTransferRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { supabase } from "../hooks/use-auth";

import { useQueryClient } from "@tanstack/react-query";
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import { useFetchCounts } from "../hooks/api/queries/useFetchCounts";
import { SearchBar } from "../components/shared/SearchBar";

export default function TransferRequestPage() {
  type RowType = {
    id: string;
    transfer_id: string;
    player_id: string;
    from_platform: string;
    to_platform: string;
    amount: string;
    process_status: string;
    created_at: string;
    process_by: string;
    team: string;
    from_username: string;
    to_username: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [userType, setUserType] = useState("");
  const [processEnabled, setProcessEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();
  const teams = rawTeams.map(team => team === "All Teams" ? "ALL" : team);
  
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
  const getProcessStatusForTab = () => {
    if (selectedStatus === "cancelled") return "3";
    if (selectedStatus === "completed") return "2";
    return "1";
  };

  const processStatus = getProcessStatusForTab();

  const { data: allData, isLoading, isError, error, refetch } = useFetchTransferRequests();

  const filteredData = allData?.filter((item: any) => item.process_status === processStatus) || [];
  
  const searchFilteredData = searchTerm
    ? filteredData.filter((item: any) => {
        const searchValue = searchTerm.toLowerCase().trim();
        const playerName = item.players?.fullname?.toLowerCase().trim() || '';
        const fromPlatform = item.from_platform_game?.game_name?.toLowerCase().trim() || item.from_platform?.toLowerCase().trim() || '';
        const toPlatform = item.to_platform_game?.game_name?.toLowerCase().trim() || item.to_platform?.toLowerCase().trim() || '';
        const amount = item.amount?.toString().toLowerCase().trim() || '';
        const playerId = item.player_id?.toString().toLowerCase().trim() || '';
        
        return (
          playerName.includes(searchValue) ||
          fromPlatform.includes(searchValue) ||
          toPlatform.includes(searchValue) ||
          amount.includes(searchValue) ||
          playerId.includes(searchValue)
        );
      })
    : filteredData;

  const pageSize = 10;
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = searchFilteredData.slice(startIndex, endIndex);
  
  const data = searchTerm ? searchFilteredData : paginatedData;
  const isLoadingData = searchTerm ? false : isLoading;
  const isErrorData = searchTerm ? false : isError;
  const errorData = searchTerm ? null : error;
  
  const refetchData = () => {
    refetch();
    queryClient.invalidateQueries({
      queryKey: ["transfer_requests"],
    });
  };

  const pageCount = Math.ceil(searchFilteredData.length / pageSize);

  console.log("Transfer Requests Data:", data);

  const baseColumns = [
    { accessorKey: "created_at", header: "PENDING SINCE" },
    { accessorKey: "transfer_id", header: "TRANSFER ID" },
    { accessorKey: "player_id", header: "USER" },
    { accessorKey: "team", header: "TEAM" },
    { accessorKey: "from_platform", header: "FROM PLATFORM" },
    // { accessorKey: "from_username", header: "FROM USERNAME" },
    { accessorKey: "to_platform", header: "TO PLATFORM" },
    // { accessorKey: "to_username", header: "TO USERNAME" },
    { accessorKey: "amount", header: "AMOUNT" },
    { accessorKey: "process_status", header: "STATUS" },
  ];

  const actionsColumn = {
    accessorKey: "actions",
    header: "ACTIONS",
    cell: ({ row }: { row: { original: RowType } }) => {
      const isPending = row.original.process_status === "1" || row.original.process_status === "in_process";
      const isCompleted = row.original.process_status === "2";
      const isCancelled = row.original.process_status === "3";
      
      if (isCompleted || isCancelled) {
        return null;
      }
      
      return (
        <Button
          disabled={row.original.process_status === "in_process"}
          onClick={async () => {
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

            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              const currentUserId = userData.user.id;
              await supabase
                .from("transfer_requests")
                .update({
                  process_status: "in_process",
                  process_by: currentUserId,
                  process_at: new Date().toISOString(),
                })
                .eq("id", row.original.id);

              setSelectedRow(row.original);
              setUserType("process");
              setProcessEnabled(true);
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
      );
    },
  };

  const columns = selectedStatus === "pending" 
    ? [...baseColumns, actionsColumn]
    : baseColumns;

  const tableData: RowType[] = (Array.isArray(data) ? data : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      const fromPlatformName = item.from_platform_game?.game_name || item.from_platform || "Unknown Platform";
      const toPlatformName = item.to_platform_game?.game_name || item.to_platform || "Unknown Platform";
      const playerName = item.players?.fullname || item.player_id || "Unknown Player";

      return {
        id: String(item.id ?? "-"),
        transfer_id: item.transfer_id ?? "-",
        player_id: playerName,
        from_platform: fromPlatformName,
        to_platform: toPlatformName,
        amount: item.amount ? `$${item.amount}` : "$0",
        process_status: item.process_status ?? "Pending",
        created_at: item.created_at ? new Date(item.created_at).toLocaleString() : "-",
        process_by: item.process_by ?? "-",
        team: (item.team ?? "-").toUpperCase(),
        from_username: item.from_username ?? "-",
        to_username: item.to_username ?? "-",
      };
    }
  );

  const filteredTableData = selectedTeam === "ALL"
    ? tableData
    : tableData.filter((row) => row.team === selectedTeam);

  const finalTableData = filteredTableData;

  async function updateTransferStatus(id: string) {
    console.log("Updating transfer request ID:", id);
    setProcessing(true);
    
    try {
      const { error: updateError } = await supabase
        .from("transfer_requests")
        .update({ process_status: "2" })
        .eq("id", id);
        
      if (updateError) {
        console.error("Update error:", updateError);
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
    } finally {
      setProcessing(false);
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

  if (isLoadingData) {
    return <PageLoader />;
  }
  if (isErrorData) {
    return <div className="p-6 text-red-500">Error: {errorData?.message || 'Unknown error'}</div>;
  }



  // Render table and pagination controls
  return (
    <div className="p-6">
      <DynamicHeading title=" Transfer Requests" />
      {/* Team Tabs */}
      <TeamTabsBar 
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={(team) => {
          setSelectedTeam(team);
          setPage(0); // Reset to first page when team changes
        }}
      />
      {/* Status Bar */}
      <DynamicButtonGroup
        options={statusOptions}
        active={selectedStatus}
        onChange={setSelectedStatus}
        className="mb-4"
      />
      {/* Search Bar */}
      <SearchBar
        placeholder="Search by player name, from platform, or to platform..."
        value={searchTerm}
        onChange={(value) => {
          setSearchTerm(value);
          setPage(0); // Reset to first page when searching
        }}
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
        }}
        onSearchChange={(search) => {
          setSearchTerm(search);
          setPage(0); // Reset to first page when searching
        }}
      />
      <Dialog
        open={open}
        onOpenChange={async (isOpen) => {
          if (!isOpen && selectedRow) {
            await resetProcessStatus(selectedRow.id);
            setSelectedRow(null);
            setProcessEnabled(false);
            setUserType("");
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
                      <p className="text-white font-medium">{selectedRow.from_platform + " (" + selectedRow.from_username + ")" || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Team</p>
                      <p className="text-white font-medium">{selectedRow.team || "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Amount</p>
                      <p className="text-white font-medium">{selectedRow.amount || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">To</p>
                      <p className="text-white font-medium">{selectedRow.to_platform + " (" + selectedRow.to_username + ")" || "N/A"}</p>
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
            <DialogProcessInput
              userType={userType}
              processEnabled={processEnabled}
              onProcess={async () => {
                if (selectedRow) {
                  await updateTransferStatus(selectedRow.id);
                }
              }}
              processing={processing}
              placeholder="Type 'process' to enable..."
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
