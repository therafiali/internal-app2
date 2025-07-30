import { useEffect, useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { SearchBar } from "../components/shared/SearchBar";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import {
  useFetchRechargeRequests,
  useFetchAllRechargeRequests,
} from "../hooks/api/queries/useFetchRechargeRequests";
import { useFetchCounts } from "../hooks/api/queries/useFetchCounts";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { RechargeProcessStatus, RedeemProcessStatus } from "../lib/constants";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "../components/ui/dialog";
import { supabase } from "../hooks/use-auth";
import { formatPendingSince } from "../lib/utils";
import { useQueryClient } from "@tanstack/react-query";

type RechargeRequest = {
  teams?: { team_name?: string; team_code?: string };
  team_code?: string;
  created_at?: string;
  id?: string;
  players?: {
    fullname?: string;
    firstname?: string;
    lastname?: string;
  };
  recharge_id?: string;
  games?: { game_name?: string; game_username?: string };
  amount?: number;
  verification_recharge_process_status?: string;
  verification_recharge_process_by?: string;
  users?: { name?: string; employee_code?: string }[];
  target_id?: string;
};

const columns = [
  {
    accessorKey: "pendingSince",
    header: "Pending Since",
    cell: ({ row }: { row: { original: any } }) => {
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
  { accessorKey: "user", header: "User" },
  { accessorKey: "platform", header: "Platform" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function VerificationRechargePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const limit = 10;
  const queryClient = useQueryClient();

  // Reset page to 0 when status changes
  useEffect(() => {
    setPageIndex(0);
  }, [selectedStatus]);

  // Fetch counts for each status
  const { data: pendingCountData } = useFetchCounts("recharge_requests", [
    RechargeProcessStatus.VERIFICATION,
  ]);
  const { data: processedCountData } = useFetchCounts("recharge_requests", [
    RechargeProcessStatus.VERIFICATIONPROCESSED,
  ]);
  const { data: rejectedCountData } = useFetchCounts("recharge_requests", [
    RechargeProcessStatus.VERIFICATIONREJECTED,
  ]);

  const pendingCount = pendingCountData ? pendingCountData.length : 0;
  const processedCount = processedCountData ? processedCountData.length : 0;
  const rejectedCount = rejectedCountData ? rejectedCountData.length : 0;

  const statusOptions = [
    { label: `PENDING (${pendingCount})`, value: "pending" },
    { label: `PROCESSED (${processedCount})`, value: "processed" },
    { label: `REJECTED (${rejectedCount})`, value: "rejected" },
  ];

  // Get process status based on selected tab
  const getProcessStatusForTab = () => {
    if (selectedStatus === "rejected")
      return RechargeProcessStatus.VERIFICATIONREJECTED; // "16"
    if (selectedStatus === "processed")
      return RechargeProcessStatus.VERIFICATIONPROCESSED; // "17"
    return RechargeProcessStatus.VERIFICATION; // "2" for pending
  };

  const processStatus = getProcessStatusForTab();

  // Fetch teams dynamically from database
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();
  console.log(rawTeams, "rawTeams");
  // Replace "All Teams" with "ALL" for consistency
  const teams = rawTeams.map((team) => (team === "All Teams" ? "ALL" : team));

  // Fetch data - use all data when searching, paginated when not
  const {
    data: paginatedResult,
    isLoading: isPaginatedLoading,
    isError: isPaginatedError,
    error: paginatedError,
    refetch: refetchPaginated,
  } = useFetchRechargeRequests(
    processStatus,
    searchTerm ? undefined : limit,
    searchTerm ? undefined : pageIndex * limit
  );

  // Fetch all data for search
  const {
    data: allDataResult,
    isLoading: isAllLoading,
    isError: isAllError,
    error: allError,
    refetch: refetchAll,
  } = useFetchAllRechargeRequests(processStatus);
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
      queryKey: ["recharge_requests", processStatus],
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
  const data =
    selectedTeam === "ALL"
      ? searchFilteredData
      : searchFilteredData.filter((item: any) => {
          return item.teams?.team_code?.toUpperCase() === selectedTeam;
        });

  // Calculate page count - use filtered data length when searching
  const pageCount = searchTerm
    ? Math.ceil((data || []).length / limit)
    : Math.ceil((paginatedResult?.total || 0) / limit);

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus(id: string) {
    await supabase
      .from("recharge_requests")
      .update({
        verification_recharge_process_status: "idle",
        verification_recharge_process_by: null,
        verification_recharge_process_at: null,
      })
      .eq("id", id);
    refetchData();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = (data || []).map((item: RechargeRequest) => ({
    pendingSince: item.created_at || "-",
    teamCode: (item.teams?.team_code || item.team_code || "-").toUpperCase(),
    rechargeId: item.recharge_id || "-",
    user: item.players
      ? item.players.fullname ||
        `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",
    platform: item.games?.game_name|| "-",
    amount: item.amount ? `$${item.amount}` : "-",
    actions: (
      <Button
        disabled={item.verification_recharge_process_status === "in_process"}
        variant="default"
        onClick={async () => {
          // fetch the row and check if it's in_process and show the alert
          const { data: rowData } = await supabase
            .from("recharge_requests")
            .select(
              "verification_recharge_process_status, verification_recharge_process_by, users:verification_recharge_process_by (name, employee_code)"
            )
            .eq("id", item.id);
          console.log(rowData, "rowData");
          if (
            rowData &&
            rowData[0].verification_recharge_process_status === "in_process"
          ) {
            const userName = rowData[0].users?.[0]?.name || "Unknown User";
            window.alert(
              rowData[0].verification_recharge_process_status +
                " already in process" +
                " by " +
                userName
            );
            refetchData();
            return;
          }

          // update the verification_recharge_process_by to the current_user id from userAuth
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const currentUserId = userData.user.id;
            // update the verification_recharge_process_by to the current_user id from userAuth
            await supabase
              .from("recharge_requests")
              .update({
                verification_recharge_process_status: "in_process",
                verification_recharge_process_by: currentUserId,
                verification_recharge_process_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            setSelectedRow(item);
            refetchData();
            setModalOpen(true);
          }
        }}
      >
        {item.verification_recharge_process_status === "in_process"
          ? `In Process${
              item.verification_recharge_process_by
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
    return (
      <div className="p-8 text-red-500">
        Error: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="p-8">
      <DynamicHeading title="Verification Recharge" />
      <TeamTabsBar
        teams={teams}
        selectedTeam={selectedTeam}
        onTeamChange={(team) => {
          setSelectedTeam(team);
          setPageIndex(0); // Reset to first page when team changes
        }}
      />
      {/* Status Bar */}
      <DynamicButtonGroup
        options={statusOptions}
        active={selectedStatus}
        onChange={setSelectedStatus}
        className="mb-4"
      />
      <SearchBar
        placeholder="Search by recharge ID or user name..."
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
            await resetProcessStatus(selectedRow.id!);
            setSelectedRow(null);
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
                  <h3 className="text-lg font-semibold text-gray-300">
                    USER INFORMATION
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Name
                    </p>
                    <p className="text-white font-medium">
                      {selectedRow.players
                        ? selectedRow.players.fullname ||
                          `${selectedRow.players.firstname || ""} ${
                            selectedRow.players.lastname || ""
                          }`.trim()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Team
                    </p>
                    <p className="text-white font-medium">
                      {(
                        selectedRow.teams?.team_code ||
                        selectedRow.team_code ||
                        "N/A"
                      ).toUpperCase()}
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
                  <h3 className="text-lg font-semibold text-gray-300">
                    REQUEST DETAILS
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Recharge ID
                    </p>
                    <p className="text-white font-medium font-mono bg-gray-800 px-2 py-1 rounded text-sm">
                      {selectedRow.recharge_id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Platform
                    </p>
                    <p className="text-white font-medium">
                      {selectedRow.games?.game_name || "N/A"}
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
                  <h3 className="text-lg font-semibold text-gray-300">
                    TRANSACTION INFO
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Amount
                    </p>
                    <p className="text-2xl font-bold text-green-400">
                      {selectedRow.amount ? `$${selectedRow.amount}` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Pending Since
                    </p>
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
                  // Update status to VERIFICATIONREJECTED
                  await supabase
                    .from("recharge_requests")
                    .update({
                      process_status:
                        RechargeProcessStatus.VERIFICATIONREJECTED,
                    })
                    .eq("id", selectedRow.id);
                  refetchData();
                  setModalOpen(false);
                  setSelectedRow(null);
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
                if (!selectedRow || !selectedRow.id) return;
                console.log(selectedRow, "selectedRow333");

                const { data: redeemData } = await supabase
                  .from("redeem_requests")
                  .select("*")
                  .eq("redeem_id", selectedRow.target_id);
                console.log(redeemData, "redeemData");

                const prevRedeemPaidAmount = redeemData?.[0]?.amount_paid || 0;
                const prevRedeemHoldAmount = redeemData?.[0]?.amount_hold || 0;
                const newPaidAmount =
                  Number(selectedRow.amount || 0) +
                  Number(prevRedeemPaidAmount);
                const newHoldAmount =
                  Number(prevRedeemHoldAmount) -
                  Number(selectedRow.amount || 0);

                console.log(newPaidAmount, newHoldAmount, "newPaidAmount, newHoldAmount");
                
                // Update status to VERIFICATIONPROCESSED
                await supabase
                  .from("recharge_requests")
                  .update({ process_status: RechargeProcessStatus.OPERATION })
                  .eq("id", selectedRow.id);

                await supabase
                  .from("redeem_requests")
                  .update({
                    amount_paid: newPaidAmount,
                    amount_hold: newHoldAmount,
                    // process_status:
                    //   newPaidAmount === redeemData?.[0]?.total_amount
                    //     ? RedeemProcessStatus.COMPLETED
                    //     : RedeemProcessStatus.FINANCE_PARTIALLY_PAID,
                  })
                  .eq("redeem_id", selectedRow.target_id);

                refetchData();
                setModalOpen(false);
                setSelectedRow(null);
              }}
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
