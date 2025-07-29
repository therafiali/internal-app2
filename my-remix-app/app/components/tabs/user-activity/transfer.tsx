import React, { useState, useEffect } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate, useLocation } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";
import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";
import { useFetchTransferRequests } from "~/hooks/api/queries/useFetchTransferRequests";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

type Row = {
  player_id: string;
  from_platform: string;
  to_platform: string;
  amount: string;
  process_status: string;
  created_at: string;
  process_by: string;
};

const columns: ColumnDef<Row>[] = [
  { header: "PENDING SINCE", accessorKey: "created_at" },
  { header: "USER", accessorKey: "player_id" },
  { header: "TEAM", accessorKey: "team" },
  { header: "FROM", accessorKey: "from_platform" },
  { header: "TO", accessorKey: "to_platform" },
  { header: "AMOUNT", accessorKey: "amount" },
  { header: "STATUS", accessorKey: "process_status" },
];

const TransferTab: React.FC<{ activeTab: string; type: string }> = ({
  activeTab = "transfer",
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
          : "completed",
      };
    } else if (pathname.includes("/redeem/")) {
      return {
        activeTab: "redeem",
        status: pathname.includes("/pending")
          ? "pending"
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
      return { activeTab: "transfer", status: "pending" };
    }
  };

  const { activeTab: urlActiveTab, status: urlStatus } =
    getActiveTabAndStatus();

  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Update selectedStatus when URL changes
  useEffect(() => {
    setSelectedStatus(urlStatus);
    setPageIndex(0); // Reset to first page when status changes
  }, [urlStatus]);

  const {
    data: transferData,
    isLoading,
    isError,
    error,
  } = useFetchTransferRequests();

  // Filter data based on status
  const getFilteredData = () => {
    if (!transferData) return [];

    switch (selectedStatus) {
      case "pending":
        return transferData.filter((item) => item.process_status === "1");
      case "completed":
        return transferData.filter((item) => item.process_status === "2");
      default:
        return transferData;
    }
  };

  const data = getFilteredData();

  // Map the data to match the table structure
  const tableData: Row[] = (data || []).map((item: any) => {
    const fromPlatformName =
      item.from_platform_game?.game_name ?? item.from_platform;
    const toPlatformName = item.to_platform_game?.game_name ?? item.to_platform;

    const fromPlatformDisplay = item.from_platform_username
      ? `${fromPlatformName} (${item.from_platform_username})`
      : fromPlatformName;

    const toPlatformDisplay = item.to_platform_username
      ? `${toPlatformName} (${item.to_platform_username})`
      : toPlatformName;

    return {
      player_id:
        (item.players?.fullname ??
          item.players?.firstname + " " + item.players?.lastname ??
          item.player_id) ||
        "-",
      from_platform: fromPlatformDisplay || "-",
      to_platform: toPlatformDisplay || "-",
      amount: item.amount ? `$${item.amount}` : "$0",
      process_status: getStatusName(item.process_status),
      created_at: item.created_at
        ? new Date(item.created_at).toLocaleString()
        : "-",
      process_by: item.process_by || "-",
    };
  });

  // Function to get readable status name
  function getStatusName(status: string) {
    switch (status) {
      case "1":
        return "Pending";
      case "2":
        return "Completed";
      case "3":
        return "Cancelled";
      default:
        return "Unknown";
    }
  }

  // const filteredData = selectedEnt === "ALL"
  //   ? tableData
  //   : tableData.filter(row => row.team === selectedEnt);
  const filteredData = tableData; // Show all data without ENT filtering

  // Calculate page count
  const pageCount = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice(
    pageIndex * limit,
    (pageIndex + 1) * limit
  );

  // Use all data when searching, sliced when not
  const tableDataToShow = searchTerm ? filteredData : paginatedData;

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (isError) {
    return (
      <div className="p-6 text-red-500">
        Error: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <UserActivityLayout
      activeTab={activeTab}
      onTabChange={(tab) =>
        navigate(`/support/useractivity/${tab}/${selectedStatus}`)
      }
      tabOptions={tabOptions}
      // selectedTeam={selectedEnt}
      // onTeamChange={setSelectedEnt}
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

export default TransferTab;
