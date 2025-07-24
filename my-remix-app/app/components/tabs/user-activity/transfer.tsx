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
  team: string;
  initBy: string;
  player: string;
  transferId: string;
  from: string;
  amount: string;
  to: string;
  status: string;
  processedBy: string;
  duration: string;
};

const columns: ColumnDef<Row>[] = [
  { header: "TEAM", accessorKey: "team" },
  { header: "INIT BY", accessorKey: "initBy" },
  { header: "PLAYER", accessorKey: "player" },
  { header: "TRANSFER ID", accessorKey: "transferId" },
  { header: "FROM", accessorKey: "from" },
  { header: "AMOUNT", accessorKey: "amount" },
  { header: "TO", accessorKey: "to" },
  { header: "STATUS", accessorKey: "status" },
  { header: "PROCESSED BY", accessorKey: "processedBy" },
  { header: "DURATION", accessorKey: "duration" },
];

const TransferTab: React.FC<{ activeTab: string, type: string }> = ({ 
  activeTab = "transfer", 
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
      return { activeTab: 'newaccount', status: pathname.includes('/pending') ? 'pending'  : 'completed' };
    } else if (pathname.includes('/resetpassword/')) {
      return { activeTab: 'resetpassword', status: pathname.includes('/pending') ? 'pending' : 'completed' };
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
      transferId: "TRF001",
      from: "Call of Duty",
      amount: "$150.00",
      to: "Fortnite",
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
      transferId: "TRF002",
      from: "PUBG",
      amount: "$200.00",
      to: "Valorant",
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
      transferId: "TRF003",
      from: "CS:GO",
      amount: "$75.50",
      to: "League of Legends",
      status: "Live",
      processedBy: "Support Team",
      duration: "30 minutes ago",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      team: "ENT-4",
      initBy: "Agent",
      player: "Sarah Wilson",
      transferId: "TRF004",
      from: "Apex Legends",
      amount: "$120.00",
      to: "Overwatch",
      status: "Pending",
      processedBy: "-",
      duration: "45 minutes ago",
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      team: "ENT-5",
      initBy: "Agent",
      player: "David Brown",
      transferId: "TRF005",
      from: "Rocket League",
      amount: "$85.25",
      to: "FIFA",
      status: "Completed",
      processedBy: "Finance Team",
      duration: "3 hours ago",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Filter data based on status
  const getFilteredData = () => {
    switch (selectedStatus) {
      case 'pending':
        return mockTransferData.filter(item => item.status === 'Pending');
      case 'live':
        return mockTransferData.filter(item => item.status === 'Live');
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
    transferId: item.transferId,
    from: item.from,
    amount: item.amount,
    to: item.to,
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

export default TransferTab;
