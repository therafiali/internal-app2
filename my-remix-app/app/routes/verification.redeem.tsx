import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import TeamTabsBar from "../components/shared/TeamTabsBar";
import DynamicButtonGroup from "../components/shared/DynamicButtonGroup";
import { SearchBar } from "../components/shared/SearchBar";
import ImageModal from "../components/shared/ImageModal";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { useState } from "react";
import {
  useFetchRedeemRequests,
  useFetchAllRedeemRequests,
  RedeemRequest,
} from "../hooks/api/queries/useFetchRedeemRequests";
import { useFetchTeams } from "../hooks/api/queries/useFetchTeams";
import { useFetchCounts } from "../hooks/api/queries/useFetchCounts";
import { RedeemProcessStatus } from "../lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { useProcessLock } from "../hooks/useProcessLock";
import { useEffect } from "react";
import { supabase } from "../hooks/use-auth";
import { formatPendingSince } from "../lib/utils";

export default function VerificationRedeemPage() {
  type RowType = {
    id: string;
    pendingSince: string;
    teamCode: string;
    paymentMethod: string;
    redeemId: string;
    platform: string;
    user: string;
    initBy: string;
    verification_redeem_process_status: string;
    amount: number;
    screenshot_url: string[];
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const limit = 10;

  // Reset page to 0 when status changes
  useEffect(() => {
    setPageIndex(0);
  }, [selectedStatus]);
  // Add process lock hook for the selected row
  const {
    loading: lockLoading,
    lockRequest,
    unlockRequest,
    approveRequest,
  } = useProcessLock(selectedRow?.id || "", "verification");

  // Fetch teams dynamically from database
  const { data: rawTeams = ["All Teams"] } = useFetchTeams();

  // Replace "All Teams" with "ALL" for consistency
  const teams = rawTeams.map(team => team === "All Teams" ? "ALL" : team);

  // Fetch counts for each status
  const { data: pendingCountData } = useFetchCounts("redeem_requests", [RedeemProcessStatus.VERIFICATION]);
  const { data: rejectedCountData } = useFetchCounts("redeem_requests", ["10"]); // OPERATIONREJECTED

  const pendingCount = pendingCountData ? pendingCountData.length : 0;
  const rejectedCount = rejectedCountData ? rejectedCountData.length : 0;

  const statusOptions = [
    { label: `PENDING (${pendingCount})`, value: "pending" },
    { label: `REJECTED (${rejectedCount})`, value: "rejected" },
  ];

  // Get process status based on selected tab
  const getProcessStatusForTab = () => {
    if (selectedStatus === "rejected") return "10"; // OPERATIONREJECTED
    return RedeemProcessStatus.VERIFICATION; // "1" for pending
  };

  const processStatus = getProcessStatusForTab();

  // Fetch data - use all data when searching, paginated when not
  const { data: paginatedData, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError, refetch: refetchPaginated } = useFetchRedeemRequests(
    processStatus,
    searchTerm ? undefined : limit,
    searchTerm ? undefined : pageIndex * limit
  );

  // Fetch all data for search
  const { data: allDataResult, isLoading: isAllLoading, isError: isAllError, error: allError, refetch: refetchAll } = useFetchAllRedeemRequests(processStatus);
  const allData = allDataResult?.data || [];

  // Use appropriate data source
  const rawData = searchTerm ? allData : (paginatedData?.data || []);
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

  // Filter data by selected team
  const data = selectedTeam === "ALL"
    ? rawData
    : (rawData || []).filter((item: RedeemRequest) => {
      return item.teams?.team_code?.toUpperCase() === selectedTeam;
    });



  // handle locking and unlocking states through the user-action
  useEffect(() => {
    const tryLock = async () => {
      if (selectedRow && open === false) {
        console.log("Verification Redeem Modal Data:", selectedRow);
        const locked = await lockRequest(selectedRow.id);
        if (locked) {
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

  // Check for user's locked requests after data is loaded
  useEffect(() => {
    const checkUserLocks = async () => {
      // Only run if data is loaded and not already processing
      if (!data || data.length === 0 || open) return;

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: lockedRequests } = await supabase
          .from("redeem_requests")
          .select(`
            *,
            teams:team_id(team_code),
            players:player_id(fullname),
            payment_methods:payment_methods_id(payment_method),
            games:game_id(game_name)
          `)
          .eq("verification_redeem_process_by", userData.user.id)
          .eq("verification_redeem_process_status", "in_process");

        if (lockedRequests && lockedRequests.length > 0) {
          console.log("Found locked request for user:", lockedRequests[0]);
          // Map the database result to RowType format
          const mappedRow: RowType = {
            id: lockedRequests[0].id,
            pendingSince: lockedRequests[0].created_at || "-",
            teamCode: (lockedRequests[0].teams?.team_code || "-").toUpperCase(),
            paymentMethod: lockedRequests[0].payment_methods?.payment_method || "-",
            redeemId: lockedRequests[0].redeem_id || "-",
            platform: lockedRequests[0].games?.game_name || "-",
            user: lockedRequests[0].players?.fullname || "-",
            initBy: "-",
            verification_redeem_process_status: lockedRequests[0].verification_redeem_process_status || "pending",
            amount: lockedRequests[0].total_amount || 0,
          };
          setSelectedRow(mappedRow);
          setOpen(true);
        }
      }
    };

    checkUserLocks();
  }, [data, open]); // Run when data is loaded and modal is not open

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
    { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
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
            row.original.verification_redeem_process_status === "in_process" ||
            lockLoading
          }
          onClick={async () => {
            setSelectedRow(row.original);
            // Wait for selectedRow to update, then call lockRequest in useEffect
          }}
        >
          {row.original.verification_redeem_process_status === "in_process"
            ? `In Process`
            : "Process"}
        </Button>
      ),
    },
  ];

  // Map the fetched data to the table row format
  const tableData: RowType[] = Array.isArray(data) ? data.map((item: RedeemRequest) => ({
    id: item.id,
    pendingSince: item.created_at || "-",
    teamCode: (item.teams?.team_code || "-").toUpperCase(),
    paymentMethod: item.payment_methods?.payment_method || "-",
    redeemId: item.redeem_id || "-",
    platform: item.games?.game_name || "-",
    user: item.players?.fullname || "-",
    initBy: "-", // No direct player_id in RedeemRequest, so fallback to '-'
    verification_redeem_process_status:
      item.verification_redeem_process_status || "pending",
    amount: item.total_amount || 0,
    screenshot_url: item.screenshots || [],
  })) : [];
  console.log(tableData);

  // Filter table data by search term (case-insensitive)
  const searchFilteredData = searchTerm
    ? tableData.filter((row) => {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        row.user?.toLowerCase().includes(searchLower) ||
        row.redeemId?.toLowerCase().includes(searchLower) ||
        row.teamCode?.toLowerCase().includes(searchLower)
      );
    })
    : tableData;

  // Calculate page count using filtered data
  const pageCount = searchTerm ? Math.ceil((searchFilteredData || []).length / limit) : Math.ceil((paginatedData?.total || 0) / limit);

  // Function to update status from 'verification' to 'finance'
  async function updateRedeemStatus() {
    await approveRequest(RedeemProcessStatus.FINANCE);
    setOpen(false);
    setSelectedRow(null);
    refetchData();
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (isError) {
    return <div className="p-6 text-red-500">Error: {error?.message || 'Unknown error'}</div>;
  }

  return (
    <div className="p-6">
      <DynamicHeading title="Verification Redeem Request" />
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
        placeholder="Search by user, redeem ID, or team..."
        value={searchTerm}
        onChange={setSearchTerm}
      />
      <div className="mt-6">
        <DynamicTable
          columns={columns}
          data={searchFilteredData}
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
      </div>
      <Dialog
        open={open}
        onOpenChange={async (isOpen) => {
          if (!isOpen && selectedRow) {
            await unlockRequest();
            setSelectedRow(null);
            refetchData();
          }
          setOpen(isOpen);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-black border border-gray-800 text-white shadow-2xl">
          <DialogHeader className="text-center pb-6 border-b border-gray-800">
            <DialogTitle className="text-2xl font-bold text-white">
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
                      {selectedRow.amount ? `$${selectedRow.amount}` : "N/A"}
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
                          className="w-full h-56 object-cover rounded-lg border border-gray-700 cursor-pointer transition-transform duration-200 hover:scale-105"
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
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="destructive"
              onClick={async () => {
                if (selectedRow) {
                  // Set process_status to '10' (OPERATIONREJECTED) on reject
                  await supabase
                    .from("redeem_requests")
                    .update({ process_status: "10" })
                    .eq("id", selectedRow.id);
                  await unlockRequest();
                  setSelectedRow(null);
                  setOpen(false);
                  refetchData();
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
                if (selectedRow) {
                  await updateRedeemStatus();
                }
              }}
              disabled={lockLoading}
              className="flex-1 bg-gray-700 hover:bg-green-600 border border-gray-600 hover:border-green-500 text-white transition-all duration-200 font-semibold"
            >
              <span className="mr-2">✅</span>
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
