import { useEffect, useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { SearchBar } from "../components/shared/SearchBar";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import ImageModal from "../components/shared/ImageModal";
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
import { supabase, useAuth } from "../hooks/use-auth";
import { formatPendingSince } from "../lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useProcessLock } from "../hooks/useProcessLock";
import { useAutoReopenModal } from "../hooks/useAutoReopenModal";
import { Input } from "../components/ui/input";
import { PauseProcessButton } from "../components/shared/PauseProcessButton";

type RechargeRequest = {
  teams?: { team_name?: string; team_code?: string };
  team_code?: string;
  created_at?: string;
  id: string;
  players?: {
    fullname?: string;
    firstname?: string;
    lastname?: string;
  };
  recharge_id?: string;
  games?: { game_name?: string; };
  player_platfrom_usernames?: { game_username?: string };
  amount?: number;
  verification_recharge_process_status?: string;
  verification_recharge_process_by?: string;
  user?: { name?: string; employee_code?: string }[];
  target_id?: string;
  screenshot_url?: string[];
  users: {
    name: string;
  };
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
  { accessorKey: "game_username", header: "GAME USERNAME" },
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
  const [identifier, setIdentifier] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const limit = 10;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user?.user_metadata as any)?.role as string | undefined;

  // Add process lock hook for the selected row
  const {
    lockRequest,
    unlockRequest,
  } = useProcessLock(selectedRow?.id || "", "verification", "recharge");

  // handle locking and unlocking states through the user-action
  useEffect(() => {
    const tryLock = async () => {
      if (selectedRow && modalOpen === false) {
        console.log("Verification Recharge Modal Data:", selectedRow);
        const locked = await lockRequest(selectedRow.id);
        if (locked) {
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

  // Use auto-reopen modal hook
  useAutoReopenModal({
    tableName: "recharge_requests",
    processByColumn: "verification_recharge_process_by",
    processStatusColumn: "verification_recharge_process_status",
    data,
    open: modalOpen,
    setSelectedRow,
    setOpen: setModalOpen
  });

  // Check every 2 seconds if modal should close
  useEffect(() => {
    if (modalOpen && selectedRow) {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from("recharge_requests")
          .select("verification_recharge_process_status")
          .eq("id", selectedRow.id)
          .single();
        
        if (data?.verification_recharge_process_status !== "in_process") {
          setModalOpen(false);
          setSelectedRow(null);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [modalOpen, selectedRow]);

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus() {
    await unlockRequest();
    refetchData();
    setIdentifier(""); // Reset identifier when modal closes
    setSelectedImage(null); // Reset selected image
    setImageModalOpen(false); // Close image modal
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
    game_username: item.player_platfrom_usernames?.game_username || "-",
    platform: item.games?.game_name || "-",
    amount: item.amount ? `$${item.amount}` : "-",
    users: item.users,
    actions: (

      <div className="flex gap-2">
        <Button
          disabled={item.verification_recharge_process_status === "in_process"}
          variant="default"
          onClick={async () => {
            setSelectedRow(item);
          }}
        >
          {item.verification_recharge_process_status === "in_process"
            ? `In Process${
                item.verification_recharge_process_by
                  ? ` by '${item.users?.name || "Unknown"}'`
                  : ""
              }`
            : "Process"}
        </Button>
        <PauseProcessButton
          requestId={item.id}
          status={item.verification_recharge_process_status || "idle"}
          department="verification"
          requestType="recharge"
          userRole={userRole}
          onPaused={() => {
            queryClient.invalidateQueries({
              queryKey: ["recharge_requests", RechargeProcessStatus.VERIFICATION],
            });
          }}
        />
      </div>
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
            await resetProcessStatus();
            setSelectedRow(null);
          }
          setModalOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-black border border-gray-800 text-white shadow-2xl">
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
                      {selectedRow.players?.fullname
                        ? selectedRow.players.fullname.charAt(0).toUpperCase() + selectedRow.players.fullname.slice(1)
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
                    <p className="text-white font-medium ">
                      {selectedRow.recharge_id || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Amount
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedRow.amount ? `${selectedRow.amount}` : "N/A"}
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
                    GAME DETAILS
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Platform
                    </p>
                    <p className="text-white font-medium">
                      {selectedRow.games?.game_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                      Game Username
                    </p>
                    <p className="text-white font-lg">
                      {selectedRow.player_platfrom_usernames?.game_username || "N/A"}
                    </p>
                  </div>
                </div>
              </div>


              {/* Screenshots Card */}
              {selectedRow.screenshot_url && selectedRow.screenshot_url.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-gray-300 text-sm font-bold">📸</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300">
                      SCREENSHOTS
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRow.screenshot_url.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-700 cursor-pointer transition-transform duration-200 hover:scale-105"
                          onClick={() => {
                            setSelectedImage(url);
                            setImageModalOpen(true);
                          }}
                        />

                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Identifier Input Field */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className=" items-center mb-3">
                  <label className="text-lg font-semibold text-gray-300 mb-2">
                    Identifier <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      required

                    />
                  </div>
                  {identifier.trim() === "" && (
                    <p className="text-red-400 text-xs mt-1">
                      Identifier is required
                    </p>
                  )}
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
                      verification_recharge_process_status: "idle",
                      verification_recharge_process_by: null,
                      verification_recharge_process_at: null,
                    })
                    .eq("id", selectedRow.id);
                  await unlockRequest();
                  refetchData();
                  setModalOpen(false);
                  setSelectedRow(null);
                  setIdentifier("");
                }
              }}
              className="flex-1 bg-gray-800 hover:bg-red-600 border border-gray-700 hover:border-red-500 text-white transition-all duration-200 font-semibold"
            >
              <span className="mr-2">❌</span>
              Reject
            </Button>
            <Button
              variant="default"
              disabled={identifier.trim() === ""}
              onClick={async () => {
                if (!selectedRow || !selectedRow.id || identifier.trim() === "") {
                  return;
                }
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

                // Update status to VERIFICATIONPROCESSED and save identifier
                await supabase
                  .from("recharge_requests")
                  .update({
                    process_status: RechargeProcessStatus.OPERATION,
                    verification_recharge_process_status: "idle",
                    verification_recharge_process_by: null,
                    verification_recharge_process_at: null,
                    identifier: identifier.trim(), // Save the identifier
                  })
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

                await unlockRequest();
                refetchData();
                setModalOpen(false);
                setSelectedRow(null);
                setIdentifier("");
              }}
              className="flex-1 bg-gray-700 hover:bg-green-600 border border-gray-600 hover:border-green-500 text-white transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal Component */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => {
          setImageModalOpen(false);
          setSelectedImage(null);
        }}
        imageUrl={selectedImage}
        altText="Full size screenshot"
      />
    </div>
  );
}
