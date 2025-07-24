import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate, useLocation } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";
import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer Request", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

type Row = {
  initBy: string;
  player: string;
  team: string;
  platform: string;
  vipCode: string;
  status: string;
  createdAt: string;
};

const columns: ColumnDef<Row>[] = [
  { header: "INIT BY", accessorKey: "initBy" },
  { header: "PLAYER", accessorKey: "player" },
  { header: "TEAM", accessorKey: "team" },
  { header: "PLATFORM", accessorKey: "platform" },
  { header: "VIP CODE", accessorKey: "vipCode" },
  { header: "STATUS", accessorKey: "status" },
  { header: "CREATED AT", accessorKey: "createdAt" },
];

const NewAccountTab: React.FC<{ activeTab: string, type: string }> = ({ 
  activeTab = "newaccount", 
  type = "pending" 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fetch teams dynamically from database
  const { data: teams = ["All Teams"] } = useFetchTeams();
  
  // Create dynamic entOptions from teams
  const entOptions = [
    { label: "ALL", value: "ALL" },
    ...teams.filter(team => team !== "All Teams").map(team => ({
      label: team,
      value: team
    }))
  ];
  
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
      return { activeTab: 'newaccount', status: pathname.includes('/pending') ? 'pending' : 'completed' };
    } else if (pathname.includes('/resetpassword/')) {
      return { activeTab: 'resetpassword', status: pathname.includes('/pending') ? 'pending' : 'completed' };
    } else {
      return { activeTab: 'newaccount', status: 'pending' };
    }
  };

  const { activeTab: urlActiveTab, status: urlStatus } = getActiveTabAndStatus();

  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Mock data for new account requests - replace with actual API call
  const mockNewAccountData = [
    {
      id: "1",
      initBy: "Agent",
      player: "John Doe",
      team: "ENT-1",
      platform: "Call of Duty",
      vipCode: "VIP001",
      status: "Pending",
      createdAt: "2024-01-15 10:30:00",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      initBy: "Agent",
      player: "Jane Smith",
      team: "ENT-2",
      platform: "Fortnite",
      vipCode: "VIP002",
      status: "Completed",
      createdAt: "2024-01-15 09:15:00",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      initBy: "Agent",
      player: "Mike Johnson",
      team: "ENT-3",
      platform: "PUBG",
      vipCode: "VIP003",
      status: "Live",
      createdAt: "2024-01-15 11:45:00",
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      initBy: "Agent",
      player: "Sarah Wilson",
      team: "ENT-4",
      platform: "Valorant",
      vipCode: "VIP004",
      status: "Pending",
      createdAt: "2024-01-15 12:20:00",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      initBy: "Agent",
      player: "David Brown",
      team: "ENT-5",
      platform: "CS:GO",
      vipCode: "VIP005",
      status: "Completed",
      createdAt: "2024-01-15 08:45:00",
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Filter data based on status
  const getFilteredData = () => {
    switch (selectedStatus) {
      case 'pending':
        return mockNewAccountData.filter(item => item.status === 'Pending');
      case 'live':
        return mockNewAccountData.filter(item => item.status === 'Live');
      case 'completed':
        return mockNewAccountData.filter(item => item.status === 'Completed');
      default:
        return mockNewAccountData;
    }
  };

  const data = getFilteredData();
  const isLoading = false;
  const isError = false;

  // Map the data to match the table structure
  const tableData: Row[] = data.map((item) => ({
    initBy: item.initBy,
    player: item.player,
    team: item.team,
    platform: item.platform,
    vipCode: item.vipCode,
    status: item.status,
    createdAt: item.createdAt,
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
    >
      <div className="mb-4">
        <EntSelector
          options={entOptions}
          active={selectedEnt}
          onChange={ent => {
            setSelectedEnt(ent);
            setPageIndex(0); // Reset to first page on ENT change
          }}
          className="mb-2"
        />
       
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

export default NewAccountTab;
