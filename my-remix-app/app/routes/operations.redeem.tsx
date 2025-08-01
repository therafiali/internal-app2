import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import { SearchBar } from "../components/shared/SearchBar";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogProcessInput,
} from "../components/ui/dialog";
import { useState, useEffect } from "react";
import { useFetchRedeemRequests, useFetchAllRedeemRequests } from "../hooks/api/queries/useFetchRedeemRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { supabase, useAuth } from "../hooks/use-auth";
import { RedeemProcessStatus } from "../lib/constants";
import { useProcessLock } from "../hooks/useProcessLock";
import { useAutoReopenModal } from "../hooks/useAutoReopenModal";
import { PauseProcessButton } from "../components/shared/PauseProcessButton";

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
    game_id: string;
    user: string;
    user_employee_code: string;
    game_username: string;
    initBy: string;
    user_name: string;
    operation_redeem_process_status?: string;
    operation_redeem_process_by?: string;
    total_amount?: number;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const limit = 10;
  const [userType, setUserType] = useState("");
  const [processEnabled, setProcessEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user?.user_metadata as any)?.role as string | undefined;

  // Add process lock hook for the selected row
  const {
    lockRequest,
    unlockRequest,
    approveRequest,
  } = useProcessLock(selectedRow?.id || "", "operation");

  // Reset page to 0 when status changes
  useEffect(() => {
    setPage(0);
  }, [selectedStatus]);

  // Real-time search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Reset to first page when searching
      if (searchTerm) setPage(0);
    }, 300); // 300ms delay to avoid too many requests

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // handle locking and unlocking states through the user-action
  useEffect(() => {
    const tryLock = async () => {
      if (selectedRow && open === false) {
        console.log("Operation Redeem Modal Data:", selectedRow);
        const locked = await lockRequest(selectedRow.id);
        if (locked) {
          setUserType("process");
          setProcessEnabled(true);
          setOpen(true);
        } else {
          setSelectedRow(null);
          window.alert(
            "This request is already being processed by someone else."
          );
          refetchData();
        }
      }
    };
    tryLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRow]);

  // Fetch teams dynamically from database
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();

  // Replace "All Teams" with "ALL" for consistency
  const teams = rawTeams.map(team => team === "All Teams" ? "ALL" : team);

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

  const processStatus = getProcessStatusForTab();

  console.log("selectedStatus:", selectedStatus, "processStatus:", processStatus);

  // Fetch data - use all data when searching, paginated when not
  const { data: paginatedData, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError, refetch: refetchPaginated } = useFetchRedeemRequests(
    processStatus,
    searchTerm ? undefined : limit,
    searchTerm ? undefined : page * limit
  );

  // Fetch all data for search
  const { data: allDataResult, isLoading: isAllLoading, isError: isAllError, error: allError, refetch: refetchAll } = useFetchAllRedeemRequests(processStatus);
  const allData = allDataResult?.data || [];

  // Use appropriate data source
  const data = searchTerm ? allData : (paginatedData?.data || []);
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;

  // Function to refetch data after updates
  const refetchData = () => {
    refetchPaginated();
    refetchAll();
    queryClient.invalidateQueries({
      queryKey: ["redeem_requests", processStatus],
    });
  };

  console.log("Redeem Requests Data:", data, "processStatus:", processStatus, "selectedStatus:", selectedStatus);

  // Use auto-reopen modal hook
  useAutoReopenModal({
    tableName: "redeem_requests",
    processByColumn: "operation_redeem_process_by",
    processStatusColumn: "operation_redeem_process_status",
    data,
    open,
    setSelectedRow,
    setOpen
  });

  // Check every 2 seconds if modal should close
  useEffect(() => {
    if (open && selectedRow) {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from("redeem_requests")
          .select("operation_redeem_process_status")
          .eq("id", selectedRow.id)
          .single();
        
        if (data?.operation_redeem_process_status !== "in_process") {
          setOpen(false);
          setSelectedRow(null);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [open, selectedRow]);

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
        <div className="flex gap-2">
          <Button
            disabled={
              row.original.operation_redeem_process_status === "in_process"
            }
            onClick={async () => {
              setSelectedRow(row.original);
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
          <PauseProcessButton
            requestId={row.original.id}
            status={row.original.operation_redeem_process_status || "idle"}
            department="operation"
            requestType="redeem"
            userRole={userRole}
            onPaused={() => {
              queryClient.invalidateQueries({
                queryKey: ["redeem_requests", RedeemProcessStatus.OPERATION],
              });
            }}
          />
        </div>
      ),
    },
  ];

  // Map the fetched data to the table row format
  const tableData: RowType[] = (Array.isArray(data) ? data : []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      return {
        id: String(item.id ?? "-"),
        pendingSince: String(item.created_at ?? "-"),
        teamCode: (item.teams?.team_code || "-").toUpperCase(),
        redeemId: String(item.redeem_id ?? "-"),
        platform: item.games?.game_name ?? "-",
        game_id: item.games?.id ?? "-",
        user: item.players?.fullname ?? "-",
        user_employee_code: item.users?.employee_code ?? "-",
        game_username: item.player_platfrom_usernames?.game_username ?? "-",
        initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
        user_name: item.users?.name ?? "-",
        operation_redeem_process_status: item.operation_redeem_process_status,
        operation_redeem_process_by: item.operation_redeem_process_by,
        total_amount: item.total_amount ?? 0,
      };
    }
  );

  // Filter table data by selected team
  const filteredTableData = selectedTeam === "ALL"
    ? tableData
    : tableData.filter((row) => row.teamCode === selectedTeam);

  // Filter by search term (case-insensitive)
  const searchFilteredData = searchTerm
    ? filteredTableData.filter((row) => {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        row.user?.toLowerCase().includes(searchLower) ||
        row.redeemId?.toLowerCase().includes(searchLower) ||
        row.teamCode?.toLowerCase().includes(searchLower)
      );
    })
    : filteredTableData;

  // No need for rejected filter anymore, since data is fetched per status
  const finalTableData = searchFilteredData;

  // Calculate page count using total count
  const pageCount = searchTerm ? Math.ceil((finalTableData || []).length / limit) : Math.ceil((paginatedData?.total || 0) / limit);

  // Function to update redeem status
  async function updateRedeemStatus(id: string) {
    const { error: updateError } = await supabase
      .from("redeem_requests")
      .update({
        process_status: "1", // Move to verification
        operation_redeem_process_status: "idle",
        operation_redeem_process_by: null,
        operation_redeem_process_at: null,
      })
      .eq("id", id);

    if (!updateError) {
      await approveRequest("1"); // Use approveRequest instead
      setOpen(false);
      setSelectedRow(null);
      refetchData();
    }
  }

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus() {
    await unlockRequest(); // Use unlockRequest instead
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
      <DynamicHeading title="Operation Redeem Requests" />
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
      <SearchBar
        placeholder="Search by user, redeem ID, or team..."
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <DynamicTable
        columns={columns}
        data={finalTableData}
        pagination={true}
        pageIndex={page}
        pageCount={pageCount}
        limit={limit}
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
            await resetProcessStatus();
            setSelectedRow(null);
            setUserType("");
            setProcessEnabled(false);
          }
          setOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
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
                    <p className="text-white font-medium">
                      {selectedRow.redeemId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Amount</p>
                    <p className="text-xl font-bold">
                      {selectedRow.total_amount ? `${selectedRow.total_amount}` : "N/A"}
                    </p>
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
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Platform</p>
                    <p className="text-white font-medium">{selectedRow.platform || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Game Username</p>
                    <p className="text-white font-lg">
                      {selectedRow.game_username || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={async () => {
                if (selectedRow) {
                  await supabase
                    .from("redeem_requests")
                    .update({ process_status: "10" })
                    .eq("id", selectedRow.id);
                  setSelectedRow(null);
                  setUserType("");
                  setProcessEnabled(false);
                  setOpen(false);
                  refetchData();
                }
              }}
              className="flex-1 transition-all duration-200 font-semibold"
            >
              <span className="mr-2">❌</span>
              Reject
            </Button>
            <DialogProcessInput
              userType={userType}
              processEnabled={processEnabled}
              onProcess={async () => {
                if (selectedRow) {
                  await updateRedeemStatus(selectedRow.id);
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
