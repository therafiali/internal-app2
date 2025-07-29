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
} from "../components/ui/dialog";
import { useState, useEffect } from "react";
import { useFetchRedeemRequests, useFetchAllRedeemRequests } from "../hooks/api/queries/useFetchRedeemRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
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
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const limit = 10;

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
              refetchData();
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
              refetchData();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => {
      return {
        id: String(item.id ?? "-"),
        pendingSince: String(item.created_at ?? "-"),
        teamCode: (item.teams?.team_code || "-").toUpperCase(),
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

  // Function to update status from 'operation' to 'verification'
  async function updateRedeemStatus(id: string) {
    const { error: updateError } = await supabase
      .from("redeem_requests")
      .update({ process_status: RedeemProcessStatus.VERIFICATION })
      .eq("id", id);
    if (!updateError) {
      setOpen(false);
      setSelectedRow(null);
      refetchData();
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
            await resetProcessStatus(selectedRow.id);
            setSelectedRow(null);
          }
          setOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
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
                      N/A
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
                  setOpen(false);
                  refetchData();
                }
              }}
              className="flex-1 transition-all duration-200 font-semibold"
            >
              <span className="mr-2">❌</span>
              Reject
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                if (selectedRow) {
                  await updateRedeemStatus(selectedRow.id);
                  setSelectedRow(null);
                }
              }}
              className="flex-1 transition-all duration-200 font-semibold"
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
