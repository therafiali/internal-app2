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
import { useFetchResetPasswordRequests, useFetchResetPasswordRequestsByStatus, useFetchAllResetPasswordRequestsByStatus } from "../hooks/api/queries/useFetchResetPasswordRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { supabase } from "../hooks/use-auth";
import { ResetPasswordRequestStatus } from "../lib/constants";

import { useQueryClient } from "@tanstack/react-query";
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import { useFetchCounts } from "../hooks/api/queries/useFetchCounts";
import { SearchBar } from "../components/shared/SearchBar";

export default function ResetPasswordRequestPage() {
  type RowType = {
    reset_id: string;
    id: string;
    player_id: string;
    game_platform: string;
    suggested_username: string;
    new_password: string;
    process_status: string;
    created_at: string;
    process_by: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  
  // Mock user type - replace with actual user type from your auth system
  const userType = "process"; // This should come from your auth context
  const processEnabled = true; // This should be based on your business logic

  // Fetch teams dynamically from database
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();

  // Replace "All Teams" with "ALL" for consistency
  const teams = rawTeams.map(team => team === "All Teams" ? "ALL" : team);

  // Fetch counts for each status
  const { data: pendingCountData } = useFetchCounts("reset_password_requests", ["0"]);
  const { data: completedCountData } = useFetchCounts("reset_password_requests", ["1"]);
  const { data: cancelledCountData } = useFetchCounts("reset_password_requests", ["2"]);

  const pendingCount = pendingCountData ? pendingCountData.length : 0;
  const completedCount = completedCountData ? completedCountData.length : 0;
  const cancelledCount = cancelledCountData ? cancelledCountData.length : 0;

  const statusOptions = [
    { label: `PENDING (${pendingCount})`, value: "pending" },
    { label: `COMPLETED (${completedCount})`, value: "completed" },
    { label: `CANCELLED (${cancelledCount})`, value: "cancelled" },
  ];

  // Fetch data based on selectedStatus
  const getProcessStatusForTab = () => {
    if (selectedStatus === "cancelled") return "2"; // "2" for cancelled
    if (selectedStatus === "completed") return "1"; // "1" for completed
    return "0"; // "0" for pending
  };

  const processStatus = getProcessStatusForTab();

  // Fetch all reset password requests data
  const { data: allData, isLoading, isError, error, refetch } = useFetchResetPasswordRequests();

  // Filter data based on status
  const filteredData = allData?.filter((item: any) => item.process_status === processStatus) || [];

  // Filter by search term with case-insensitive search and trim
  const searchFilteredData = searchTerm
    ? filteredData.filter((item: any) => {
      const searchValue = searchTerm.toLowerCase().trim();
      const playerName = item.players?.fullname?.toLowerCase().trim() || '';
      const playerFirstName = item.players?.firstname?.toLowerCase().trim() || '';
      const playerLastName = item.players?.lastname?.toLowerCase().trim() || '';
      const gamePlatform = item.game_platform_game?.game_name?.toLowerCase().trim() || item.game_platform?.toLowerCase().trim() || '';
      const suggestedUsername = item.suggested_username?.toLowerCase().trim() || '';
      const playerId = item.player_id?.toString().toLowerCase().trim() || '';

      return (
        playerName.includes(searchValue) ||
        playerFirstName.includes(searchValue) ||
        playerLastName.includes(searchValue) ||
        gamePlatform.includes(searchValue) ||
        suggestedUsername.includes(searchValue) ||
        playerId.includes(searchValue)
      );
    })
    : filteredData;

  // Paginate data
  const pageSize = 10;
  const startIndex = page * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = searchFilteredData.slice(startIndex, endIndex);

  // Use appropriate data source
  const data = searchTerm ? searchFilteredData : paginatedData;
  const isLoadingData = searchTerm ? false : isLoading;
  const isErrorData = searchTerm ? false : isError;
  const errorData = searchTerm ? null : error;

  // Function to refetch data after updates
  const refetchData = () => {
    refetch();
    queryClient.invalidateQueries({
      queryKey: ["reset_password_requests"],
    });
  };

  // Calculate page count
  const pageCount = Math.ceil(searchFilteredData.length / pageSize);

  console.log("Reset Password Requests Data:", data);

  // Define base columns without actions
  const baseColumns = [
    { accessorKey: "reset_id", header: "RESET ID" },
    { accessorKey: "player_id", header: "PLAYER" },
    { accessorKey: "game_platform", header: "GAME PLATFORM" },
    { accessorKey: "team", header: "TEAM" },
    { accessorKey: "suggested_username", header: "SUGGESTED USERNAME" },
    { accessorKey: "process_status", header: "STATUS" },
    { accessorKey: "created_at", header: "CREATED AT" },
  ];

  // Define actions column
  const actionsColumn = {
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
            .from("reset_password_requests")
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

          // update the process_by to the current_user id from userAuth
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const currentUserId = userData.user.id;
            // update the process_by to the current_user id from userAuth
            await supabase
              .from("reset_password_requests")
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
          ? `In Process${row.original.process_by
            ? ` by '${row.original.player_id}'`
            : ""
          }`
          : "Process"}
      </Button>
    ),
  };

  // Conditionally include actions column only for pending status
  const columns = selectedStatus === "pending"
    ? [...baseColumns, actionsColumn]
    : baseColumns;

  // Map the fetched data to the table row format
  const tableData: RowType[] = (Array.isArray(data) ? data : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      // Handle game platform display - use the raw game_platform value if no joined data
      const gamePlatformName = item.game_platform_game?.game_name || item.game_platform || "Unknown Platform";
      const suggestedUsername = item.suggested_username ?? "N/A";
      const playerName = item.players?.fullname ||
        (item.players?.firstname && item.players?.lastname ?
          `${item.players.firstname} ${item.players.lastname}` :
          item.player_id) || "Unknown Player";

      return {
        id: String(item.id ?? "-"),
        reset_id: item.reset_id ?? "-",
        player_id: playerName,
        game_platform: gamePlatformName,
        team: item.team ?? "N/A",
        suggested_username: suggestedUsername,
        new_password: item.new_password ?? "-",
        process_status: item.process_status ?? "Pending",
        created_at: item.created_at ? new Date(item.created_at).toLocaleString() : "-",
        process_by: item.process_by ?? "-",
      };
    }
  );

  // Filter table data by selected team
  const filteredTableData = selectedTeam === "ALL"
    ? tableData
    : tableData.filter((row) => row.game_platform === selectedTeam);

  // No need for rejected filter anymore, since data is fetched per status
  const finalTableData = filteredTableData;

  // Function to update status to 'completed' when approved
  async function updateResetPasswordStatus(id: string) {
    console.log("Updating reset password request ID:", id);

    if (!newPassword.trim()) {
      alert("Please enter a new password");
      return;
    }

    setProcessing(true);

    try {
      // Try updating with process_status and new_password
      const { error: updateError } = await supabase
        .from("reset_password_requests")
        .update({
          process_status: "1",
          new_password: newPassword.trim()
        })
        .eq("id", id);

      if (updateError) {
        console.error("Update error:", updateError);
        // If that fails, try with just process_status as a number
        const { error: updateError2 } = await supabase
          .from("reset_password_requests")
          .update({
            process_status: 1,
            new_password: newPassword.trim()
          })
          .eq("id", id);

        if (updateError2) {
          console.error("Second update error:", updateError2);
          alert("Failed to update password request");
        } else {
          console.log("Update successful with number");
          setOpen(false);
          setSelectedRow(null);
          setNewPassword('');
          refetchData();
        }
      } else {
        console.log("Update successful with string");
        setOpen(false);
        setSelectedRow(null);
        setNewPassword('');
        refetchData();
      }
    } finally {
      setProcessing(false);
    }
  }

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus(id: string) {
    await supabase
      .from("reset_password_requests")
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
      <DynamicHeading title=" Reset Password Requests" />
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
      {/* Search Bar */}
      <SearchBar
        placeholder="Search by player name, game platform, or suggested username..."
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
            setNewPassword('');
          }
          setOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border border-gray-700">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-white">
              Approve Reset Password Request
            </DialogTitle>

          </DialogHeader>

          {selectedRow && (
            <div className="space-y-4">
              {/* Reset Password Details Section */}
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Reset ID</p>
                    <p className="text-white font-medium">{selectedRow.reset_id || "N/A"}</p>
                  </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Player</p>
                      <p className="text-white font-medium">{selectedRow.player_id || "N/A"}</p>
                    </div>

                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Game Platform</p>
                      <p className="text-white font-medium">{selectedRow.game_platform || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Suggested Username</p>
                      <p className="text-white font-medium">{selectedRow.suggested_username || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Password Input Section */}
              <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-600">
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">New Password</label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password..."
                      className="w-full px-3 py-2 bg-[#18181b] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                  console.log("Rejecting reset password request ID:", selectedRow.id);

                  // Try updating just the process_status first
                  const { error } = await supabase
                    .from("reset_password_requests")
                    .update({ process_status: "2" })
                    .eq("id", selectedRow.id);

                  if (error) {
                    console.error("Reject error:", error);
                    // If that fails, try with just process_status as a number
                    const { error: error2 } = await supabase
                      .from("reset_password_requests")
                      .update({ process_status: 2 })
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
                  await updateResetPasswordStatus(selectedRow.id);
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
