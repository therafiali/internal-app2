import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate, useLocation } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";
import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";
import NewAccountRequestModal from "~/components/NewAccountRequestModal";
import { Button } from "~/components/ui/button";
import { useFetchNewAccountRequests } from "~/hooks/api/queries/useFetchNewAccountRequests";
import { NewAccountProcessStatus } from "~/lib/constants";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer Request", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

type Row = {
  id: string;
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

const NewAccountTab: React.FC<{ activeTab: string; type: string }> = ({
  activeTab = "newaccount",
  type = "pending",
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine the active tab and status based on the current URL
  const getActiveTabAndStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes("/recharge/")) {
      return {
        activeTab: "recharge",
        status: pathname.includes("/pending")
          ? "pending"
          : pathname.includes("/live")
          ? "live"
          : "completed",
      };
    } else if (pathname.includes("/redeem/")) {
      return {
        activeTab: "redeem",
        status: pathname.includes("/pending")
          ? "pending"
          : pathname.includes("/live")
          ? "live"
          : "completed",
      };
    } else if (pathname.includes("/transfer/")) {
      return {
        activeTab: "transfer",
        status: pathname.includes("/pending") ? "pending" : "completed",
      };
    } else if (pathname.includes("/newaccount/")) {
      return {
        activeTab: "newaccount",
        status: pathname.includes("/pending") ? "pending" : "completed",
      };
    } else if (pathname.includes("/resetpassword/")) {
      return {
        activeTab: "resetpassword",
        status: pathname.includes("/pending") ? "pending" : "completed",
      };
    } else {
      return { activeTab: "newaccount", status: "pending" };
    }
  };

  const { activeTab: urlActiveTab, status: urlStatus } =
    getActiveTabAndStatus();

  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;

  // Fetch real data from database
  const { data: allData = [], isLoading, error } = useFetchNewAccountRequests();

  // Get process status based on selected status
  const getProcessStatusForTab = () => {
    if (selectedStatus === "completed") return NewAccountProcessStatus.APPROVED; // "1"
    return NewAccountProcessStatus.PENDING; // "0" for pending
  };

  const processStatus = getProcessStatusForTab();

  // Filter data based on status
  const filteredData = allData.filter(item => item.process_status === processStatus);
  
  // Filter by search term
  const searchFilteredData = searchTerm
    ? filteredData.filter(item =>
        item.players?.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.games?.game_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredData;

  // Map the data to match the table structure
  const tableData: Row[] = searchFilteredData.map((item) => ({
    id: item.id,
    initBy: "Agent", // Default value since we don't have init_by in new structure
    player: item.players?.fullname ?? "-",
    team: "ALL", // Default since we don't have team info in new structure
    platform: item.games?.game_name ?? "-",
    vipCode: "-", // Not available in new structure
    status: item.process_status === "0" ? "Pending" : item.process_status === "1" ? "Approved" : "Unknown",
    createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : "-",
  }));

  const filteredTableData = selectedEnt === "ALL"
    ? tableData
    : tableData.filter(row => row.team === selectedEnt);

  // Calculate page count
  const pageCount = Math.ceil(filteredTableData.length / limit);
  const paginatedData = filteredTableData.slice(pageIndex * limit, (pageIndex + 1) * limit);

  // Use all data when searching, sliced when not
  const tableDataToShow = searchTerm ? filteredTableData : paginatedData;

  const handleNewAccountSubmit = (data: { playerId: string; gameId: string }) => {
    console.log("New account request submitted:", data);
    // Refresh the data or update the table
    setIsModalOpen(false);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading requests</div>;

  return (
    <UserActivityLayout
      activeTab={activeTab}
      onTabChange={(tab) =>
        navigate(`/support/useractivity/${tab}/${selectedStatus}`)
      }
      tabOptions={tabOptions}
      selectedTeam={selectedEnt}
      onTeamChange={setSelectedEnt}
    >
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <EntSelector
            options={entOptions}
            active={selectedEnt}
            onChange={ent => {
              setSelectedEnt(ent);
              setPageIndex(0); // Reset to first page on ENT change
            }}
            className="mb-2"
          />
        </div>
       
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
