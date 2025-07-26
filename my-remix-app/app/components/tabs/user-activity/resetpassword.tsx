import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate, useLocation } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";
import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";
import { formatPendingSince } from "~/lib/utils";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer Request", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

type Row = {
  team: string;
  initBy: string;
  player: string;
  platform: string;
  username: string;
  status: string;
  processedBy: string;
  duration: string;
};

const columns: ColumnDef<Row>[] = [
  { header: "TEAM", accessorKey: "team" },
  { header: "INIT BY", accessorKey: "initBy" },
  { header: "PLAYER", accessorKey: "player" },
  { header: "PLATFORM", accessorKey: "platform" },
  { header: "USERNAME", accessorKey: "username" },
  { header: "STATUS", accessorKey: "status" },
  { header: "PROCESSED BY", accessorKey: "processedBy" },
  { header: "DURATION", accessorKey: "duration" },
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
    } else if (pathname.includes('/resetpassword/')) {
      return { activeTab: 'resetpassword', status: pathname.includes('/pending') ? 'pending' : 'completed' };
    } else if (pathname.includes('/newaccount/')) {
      return { activeTab: 'newaccount', status: pathname.includes('/pending') ? 'pending' : 'completed' };
    } else {
      return { activeTab: 'transfer', status: 'pending' };
    }
  };

  const { activeTab: urlActiveTab, status: urlStatus } = getActiveTabAndStatus();

  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Mock data for transfer requests - replace with actual API call
  const mockTransferData = [
    {
      id: "1",
      team: "ENT-1",
      initBy: "Agent",
      player: "John Doe",
      platform: "Call of Duty",
      username: "johndoe123",
      status: "Pending",
      processedBy: "-",
      duration: "2 hours ago",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      team: "ENT-2",
      initBy: "Agent",
      player: "Jane Smith",
      platform: "Fortnite",
      username: "janesmith456",
      status: "Completed",
      processedBy: "Admin User",
      duration: "1 hour ago",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      team: "ENT-3",
      initBy: "Agent",
      player: "Mike Johnson",
      platform: "PUBG",
      username: "mikej789",
      status: "Completed",
      processedBy: "Support Team",
      duration: "30 minutes ago",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];

  // Filter data based on status
  const getFilteredData = () => {
    switch (selectedStatus) {
      case 'pending':
        return mockTransferData.filter(item => item.status === 'Pending');
      case 'completed':
        return mockTransferData.filter(item => item.status === 'Completed');
      default:
        return mockTransferData;
    }
  };

  const data = getFilteredData();
  const isLoading = false;
  const isError = false;

  // Map the data to match the table structure
  const tableData: Row[] = data.map((item) => ({
    team: item.team,
    initBy: item.initBy,
    player: item.player,
    platform: item.platform,
    username: item.username,
    status: item.status,
    processedBy: item.processedBy,
    duration: item.duration,
  }));

  const filteredData = selectedEnt === "ALL"
    ? tableData
    : tableData.filter(row => row.team === selectedEnt);

  // Calculate page count
  const pageCount = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice(pageIndex * limit, (pageIndex + 1) * limit);

  // Use all data when searching, sliced when not
  const tableDataToShow = searchTerm ? filteredData : paginatedData;

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
