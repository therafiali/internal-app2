import { useState } from "react";
import { Button } from "../components/ui/button";
import { SearchBar } from "../components/shared/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogProcessInput,
} from "../components/ui/dialog";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import { useFetchRechargeRequests, useFetchAllRechargeRequests } from "../hooks/api/queries/useFetchRechargeRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { RechargeProcessStatus } from "../lib/constants";
import { supabase } from "../hooks/use-auth";
import { formatPendingSince } from "../lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useProcessLock } from "../hooks/useProcessLock";
import { useAutoReopenModal } from "../hooks/useAutoReopenModal";
import { useEffect } from "react";

type RechargeRequest = {
  teams?: { team_name?: string; team_code?: string };
  team_code?: string;
  created_at?: string;
  id?: string;
  players?: { fullname?: string };
  recharge_id?: string;
  games?: { game_name?: string; game_username?: string };
  amount?: number;
  operation_recharge_process_status?: string;
  operation_recharge_process_by?: string;
  users?: { name?: string; employee_code?: string }[];
};

const columns = [
  {
    accessorKey: "pendingSince",
    header: "Pending Since",
    cell: ({ row }: { row: { original: { pendingSince: string } } }) => {
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
  { accessorKey: "actions", header: "ACTIONS",
    
   },
];

export default function OperationRechargePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const limit = 10;
  const queryClient = useQueryClient();
  const [userType, setUserType] = useState("");
  const [processEnabled, setProcessEnabled] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Add process lock hook for the selected row
  const {
    lockRequest,
    unlockRequest,
  } = useProcessLock(selectedRow?.id || "", "operation", "recharge");

  // handle locking and unlocking states through the user-action
  useEffect(() => {
    const tryLock = async () => {
      if (selectedRow && modalOpen === false) {
        console.log("Operation Recharge Modal Data:", selectedRow);
        const locked = await lockRequest(selectedRow.id);
        if (locked) {
          setUserType("process");
          setProcessEnabled(true);
          setModalOpen(true);
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

  // Fetch data - use all data when searching, paginated when not
  const { data: paginatedResult, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError, refetch: refetchPaginated } = useFetchRechargeRequests(
    RechargeProcessStatus.OPERATION,
    searchTerm ? undefined : limit,
    searchTerm ? undefined : pageIndex * limit
  );

  // Fetch all data for search
  const { data: allDataResult, isLoading: isAllLoading, isError: isAllError, error: allError, refetch: refetchAll } = useFetchAllRechargeRequests(RechargeProcessStatus.OPERATION);
  const allData = allDataResult?.data || [];

  // Use appropriate data source
  const rawData = searchTerm ? allData : (paginatedResult?.data || []);
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;

  // Function to refetch data after updates
  const refetchData = () => {
    refetchPaginated();
    refetchAll();
    queryClient.invalidateQueries({
      queryKey: ["recharge_requests", RechargeProcessStatus.OPERATION],
    });
  };

  // Filter data by search term and team
  const searchFilteredData = searchTerm
    ? (rawData || []).filter((row) => {
        const searchLower = searchTerm.toLowerCase().trim();
        return (
          (row.recharge_id || "").toLowerCase().includes(searchLower) ||
          (row.players?.fullname || "").toLowerCase().includes(searchLower)
        );
      })
    : (rawData || []);

  // Filter data by selected team
  const data = selectedTeam === "ALL" 
    ? searchFilteredData 
    : searchFilteredData.filter((item: RechargeRequest) => {
        return item.teams?.team_code?.toUpperCase() === selectedTeam;
      });

  async function updateRechargeStatus(
    id: string,
    newStatus: RechargeProcessStatus
  ) {
    const { error } = await supabase
      .from("recharge_requests")
      .update({ 
        process_status: newStatus,
        operation_recharge_process_status: "idle",
        operation_recharge_process_by: null,
        operation_recharge_process_at: null,
      })
      .eq("id", id);
    
    if (!error) {
      await unlockRequest();
      setModalOpen(false);
      setSelectedRow(null);
      setUserType("");
      setProcessEnabled(false);
      refetchData();
    }
    return error;
  }

  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm ? Math.ceil((data || []).length / limit) : Math.ceil((paginatedResult?.total || 0) / limit);

  // Console log the raw data for debugging
  console.log("Operation Recharge Data:", data);
  console.log("rawData:", rawData);
  console.log("paginatedResult:", paginatedResult);
  console.log("allData:", allData);

  // Use auto-reopen modal hook
  useAutoReopenModal({
    tableName: "recharge_requests",
    processByColumn: "operation_recharge_process_by",
    processStatusColumn: "operation_recharge_process_status",
    data,
    open: modalOpen,
    setSelectedRow,
    setOpen: setModalOpen
  });

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus() {
    await unlockRequest();
    refetchData();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = (data || []).map((item: RechargeRequest) => ({
    pendingSince: item.created_at || '-',
    teamCode: (item.teams?.team_code || "-").toUpperCase(),
    rechargeId: item.recharge_id || "-",
    user: item.players
      ? item.players.fullname
      : "-",
    actions: (
      <Button
        disabled={
          item.operation_recharge_process_status === "in_process"
        }
        variant="default"
        onClick={async () => {
          setSelectedRow(item);
          setUserType("process");
          setProcessEnabled(true);
        }}
      >
        {item.operation_recharge_process_status === "in_process"
          ? `In Process${
              item.operation_recharge_process_by
                ? ` by '${item.users?.[0]?.name || "Unknown"}'`
                : ""
            }`
          : "Process"}
      </Button>
    ),
  }));

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Error: {error?.message || 'Unknown error'}</div>;
  }

  return (
    <div className="p-8">
      <DynamicHeading title="Operation Recharge" />
      <TeamTabsBar
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={(team) => {
          setSelectedTeam(team);
          setPageIndex(0); // Reset to first page when team changes
        }}
      />
      <SearchBar
        placeholder="Search by recharge ID, user name, or team..."
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <DynamicTable
        columns={columns}
        data={tableData}
        pagination={true}
        pageIndex={pageIndex}
        pageCount={pageCount}
        limit={limit}
        onPageChange={(newPageIndex) => {
          setPageIndex(newPageIndex);
          if (searchTerm) setPageIndex(0);
        }}
        onSearchChange={(search) => {
          setSearchTerm(search);
          setPageIndex(0);
        }}
      />
      <Dialog 
        open={modalOpen} 
        onOpenChange={async (isOpen) => {
          if (!isOpen && selectedRow) {
            await resetProcessStatus();
            setSelectedRow(null);
            setUserType("");
            setProcessEnabled(false);
          }
          setModalOpen(isOpen);
        }}
      >
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
                      // remove first name and lastname use only fullName
                      ? selectedRow.players.fullname
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Team</p>
                    <p className="text-white font-medium">
                      {(selectedRow.teams?.team_code || "N/A").toUpperCase()}
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
              onClick={async () => {
                if (selectedRow && selectedRow.id) {
                  await updateRechargeStatus(selectedRow.id, RechargeProcessStatus.CANCELLED);
                  refetchData();
                }
                setModalOpen(false);
                setSelectedRow(null);
                setUserType("");
                setProcessEnabled(false);
              }}
              className="flex-1 bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-500 text-white transition-all duration-200 font-semibold"
            >
              <span className="mr-2">❌</span>
              Reject
            </Button>
            
            <DialogProcessInput
              userType={userType}
              processEnabled={processEnabled}
              onProcess={async () => {
                if (selectedRow) {
                  await updateRedeemStatus();
                  setUserType("");
                  setProcessEnabled(false);
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
