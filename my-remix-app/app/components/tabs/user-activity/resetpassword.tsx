import React, { useState, useEffect } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate, useLocation } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";
import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";
import { useFetchResetPasswordRequestsByStatus, useFetchAllResetPasswordRequestsByStatus } from "~/hooks/api/queries/useFetchResetPasswordRequests";
import { useFetchCounts } from "~/hooks/api/queries/useFetchCounts";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

type Row = {
  id: string;
  reset_id: string;
  player_id: string;
  game_platform: string;
  suggested_username: string;
  new_password: string;
  process_status: string;
  created_at: string;
  process_by: string;
};

const columns: ColumnDef<Row>[] = [
  { header: "RESET ID", accessorKey: "reset_id" },
  { header: "PLAYER", accessorKey: "player_id" },
  { header: "GAME PLATFORM", accessorKey: "game_platform" },
  { header: "SUGGESTED USERNAME", accessorKey: "suggested_username" },
  { header: "STATUS", accessorKey: "process_status" },
  { header: "CREATED AT", accessorKey: "created_at" },
];

const ResetPasswordTab: React.FC<{ activeTab: string, type: string }> = ({ 
  activeTab = "resetpassword", 
  type = "pending" 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine the active tab and status based on the current URL
  const getActiveTabAndStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes('/recharge/')) {
      return { activeTab: 'recharge', status: pathname.includes('/pending') ? 'pending' : pathname.includes('/live') ? 'live' : 'completed' };
    } else if (pathname.includes('/redeem/')) {
      return { activeTab: 'redeem', status: pathname.includes('/pending') ? 'pending' : pathname.includes('/live') ? 'live' : 'completed' };
    } else if (pathname.includes('/transfer/')) {
      return { activeTab: 'transfer', status: pathname.includes('/pending') ? 'pending' : 'completed' };
    } else if (pathname.includes('/newaccount/')) {
      return { activeTab: 'newaccount', status: pathname.includes('/pending') ? 'pending'  : 'completed' };
    } else if (pathname.includes('/resetpassword/')) {
      return { activeTab: 'resetpassword', status: pathname.includes('/pending') ? 'pending' : 'completed' };
    } else {
      return { activeTab: 'resetpassword', status: 'pending' };
    }
  };

  const { activeTab: urlActiveTab, status: urlStatus } = getActiveTabAndStatus();

  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Update selectedStatus when URL changes
  useEffect(() => {
    setSelectedStatus(urlStatus);
    setPageIndex(0); // Reset to first page when status changes
  }, [urlStatus]);

  // Fetch counts for each status
  const { data: pendingCountData } = useFetchCounts("reset_password_requests", ["0"]);  
  const { data: completedCountData } = useFetchCounts("reset_password_requests", ["1"]); 
  const { data: cancelledCountData } = useFetchCounts("reset_password_requests", ["2"]);

  const pendingCount = pendingCountData ? pendingCountData.length : 0;
  const completedCount = completedCountData ? completedCountData.length : 0;
  const cancelledCount = cancelledCountData ? cancelledCountData.length : 0;

  // Get process status for the selected tab
  const getProcessStatusForTab = () => {
    if (selectedStatus === "cancelled") return "2"; // "2" for cancelled
    if (selectedStatus === "completed") return "1"; // "1" for completed
    return "0"; // "0" for pending
  };

  const processStatus = getProcessStatusForTab();

  // Fetch data - use status-filtered data when searching, paginated when not
  const { data: fetchedPaginatedData, isLoading: isPaginatedLoading, isError: isPaginatedError, error: paginatedError } = useFetchResetPasswordRequestsByStatus(
    processStatus,
    searchTerm ? undefined : limit,
    searchTerm ? undefined : pageIndex * limit
  );

  // Fetch all data for search with status filter
  const { data: allData, isLoading: isAllLoading, isError: isAllError, error: allError } = useFetchAllResetPasswordRequestsByStatus(processStatus);

  // Use appropriate data source
  const data = searchTerm ? allData : fetchedPaginatedData;
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;
  const error = searchTerm ? allError : paginatedError;

  // Map the data to match the table structure
  const tableData: Row[] = (Array.isArray(data) ? data : []).map((item: any) => {
    const gamePlatformName = item.game_platform_game?.game_name ?? item.game_platform;
    const suggestedUsername = item.suggested_username ?? "N/A";

    return {
      id: String(item.id ?? "-"),
      reset_id: item.reset_id ?? "-",
      player_id: (item.players?.fullname ?? (item.players?.firstname + " " + item.players?.lastname) ?? item.player_id) ?? "-",
      game_platform: gamePlatformName ?? "-",
      suggested_username: suggestedUsername,
      new_password: item.new_password ?? "-",
      process_status: getStatusName(item.process_status),
      created_at: item.created_at ? new Date(item.created_at).toLocaleString() : "-",
      process_by: item.process_by ?? "-",
    };
  });

  // Function to get readable status name
  function getStatusName(status: string) {
    switch (status) {
      case '0':
        return "Pending";
      case '1':
        return "Completed";
      case '2':
        return "Cancelled";
      default:
        return "Unknown";
    }
  }

  const filteredData = tableData; // Show all data without ENT filtering

  // Calculate page count
  const pageCount = Math.ceil(filteredData.length / limit);
  const slicedData = filteredData.slice(pageIndex * limit, (pageIndex + 1) * limit);

  // Use all data when searching, sliced when not
  const tableDataToShow = searchTerm ? filteredData : slicedData;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  
  if (isError) {
    return <div className="p-6 text-red-500">Error: {error?.message || 'Unknown error'}</div>;
  }

  return (
    <UserActivityLayout
      activeTab={activeTab}
      onTabChange={tab => navigate(`/support/useractivity/${tab}/${selectedStatus}`)}
      tabOptions={tabOptions}
      selectedTeam={selectedEnt}
      onTeamChange={setSelectedEnt}
    >
      <div className="mb-4">
        {/* Remove EntSelector - now handled by layout */}
        {/* <EntSelector
          options={entOptions}
          active={selectedEnt}
          onChange={ent => {
            setSelectedEnt(ent);
            setPageIndex(0); // Reset to first page on ENT change
          }}
          className="mb-2"
        /> */}
       
        <div className="border-b border-[hsl(var(--sidebar-border))] w-full" />
      </div>
      <DynamicTable
        columns={columns}
        data={tableDataToShow}
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
    </UserActivityLayout>
  );
};

export default ResetPasswordTab;
