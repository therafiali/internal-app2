import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate, useLocation } from "@remix-run/react";

import type { ColumnDef } from "@tanstack/react-table";
import {
  useFetchRedeemRequests,
  useFetchRedeemRequestsMultiple,
  useFetchAllRedeemRequests,
} from "~/hooks/api/queries/useFetchRedeemRequests";
import { RedeemProcessStatus } from "~/lib/constants";
import { useTeam } from "./TeamContext";
import { useAuth } from "~/hooks/use-auth";
import { useFetchAgentEnt } from "~/hooks/api/queries/useFetchAgentEnt";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

// Dynamic entOptions will be created from teams hook

type Row = {
  team: string;
  initBy: string;
  receiver: string;
  redeemId: string;
  platform: string;
  total: string;
  paid: string;
  hold: string;
  remaining: string;
  timeElapsed: string;
  status: string;
};

const columns: ColumnDef<Row>[] = [
  { header: "TEAM", accessorKey: "team" },
  // { header: "INIT BY", accessorKey: "initBy" },
  { header: "RECEIVER", accessorKey: "receiver" },
  { header: "REDEEM ID", accessorKey: "redeemId" },
  { header: "PLATFORM", accessorKey: "platform" },
  { header: "TOTAL", accessorKey: "total" },
  { header: "PAID", accessorKey: "paid" },
  { header: "HOLD", accessorKey: "hold" },
  { header: "REMAINING", accessorKey: "remaining" },
  { header: "TIME ELAPSED", accessorKey: "timeElapsed" },
  { header: "STATUS", accessorKey: "status" },
];

const RedeemTab: React.FC<{ activeTab: string; type: string }> = ({
  activeTab = "redeem",
  type = "pending",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedTeam } = useTeam();
  const { user } = useAuth();
  const { data: agentEnt } = useFetchAgentEnt(user?.id || "");

  // Get teams from agentEnt data for security filtering
  const teamsFromEnts = agentEnt|| [];
  const allowedEnts = teamsFromEnts.map((ent: string) => ent.toUpperCase());

  console.log(selectedTeam, "selectedTeam>>>>>");
  console.log("[RedeemTab] teamsFromEnts:", teamsFromEnts);
  console.log("[RedeemTab] allowedEnts:", allowedEnts);

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
    } else {
      return { activeTab: "redeem", status: "pending" };
    }
  };

  const { activeTab: urlActiveTab, status: urlStatus } =
    getActiveTabAndStatus();

  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Determine the process status based on the current URL
  const getProcessStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes("/redeem/pending")) {
      return [RedeemProcessStatus.OPERATION];
    } else if (pathname.includes("/redeem/live")) {
      return [RedeemProcessStatus.VERIFICATION, RedeemProcessStatus.FINANCE];
    } else if (pathname.includes("/redeem/completed")) {
      return [RedeemProcessStatus.COMPLETED];
    } else {
      return [RedeemProcessStatus.OPERATION];
    }
  };

  const processStatuses = getProcessStatus();
  console.log(processStatuses, "getProcessStatus");
  console.log(urlActiveTab, urlStatus, "urlActiveTab, urlStatus");

  // Fetch data with pagination like user list
  const { data: paginatedResult, isLoading: isPaginatedLoading, isError: isPaginatedError } = useFetchRedeemRequests(
    processStatuses[0],
    searchTerm ? undefined : limit,
    searchTerm ? undefined : pageIndex * limit
  );

  // Fetch all data for search
  const { data: allData, isLoading: isAllLoading, isError: isAllError } = useFetchAllRedeemRequests(processStatuses[0]);

  // Use appropriate data source
  const data = searchTerm ? allData : (paginatedResult?.data || []);
  const totalCount = searchTerm ? (allData?.length || 0) : (paginatedResult?.total || 0);
  const isLoading = searchTerm ? isAllLoading : isPaginatedLoading;
  const isError = searchTerm ? isAllError : isPaginatedError;

  console.log(data, "redeem data");

  // Map the API data to match the table structure
  const tableData: Row[] = (data || []).map((item) => ({
    team: (item.teams?.team_code || "N/A").toUpperCase(),
    initBy: "Agent", // Default value since not in API
    receiver: item.players ? `${item.players.fullname || ""}`.trim() : "N/A",
    redeemId: item.redeem_id || item.id || "N/A",
    platform: item.games?.game_name || "N/A",
    total: item.total_amount ? `$${item.total_amount}` : "$0",
    paid: item.amount_paid ? `$${item.amount_paid}` : "$0",
    hold: item.amount_hold ? `$${item.amount_hold}` : "$0",
    remaining: item.amount_available ? `$${item.amount_available}` : "$0",
    timeElapsed: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "N/A",
    status: item.process_status || "PENDING",
  }));

  console.log(tableData, "tableData");

  // Use selectedTeam from context for filtering with security
  const filteredData =
    selectedTeam === "ALL"
      ? tableData.filter((row) => allowedEnts.includes(row.team)) // Only show allowed teams
      : tableData.filter(
          (row) => row.team.toUpperCase() === selectedTeam.toUpperCase()
        );

  // Calculate page count using total count
  const pageCount = Math.ceil(totalCount / limit);

  // Use data directly like user list
  const tableDataToShow = filteredData;

  return (
    <UserActivityLayout
      activeTab={activeTab}
      onTabChange={(tab) =>
        navigate(`/support/useractivity/${tab}/${selectedStatus}`)
      }
      tabOptions={tabOptions}
      // REMOVE: selectedTeam={selectedEnt}
      // REMOVE: onTeamChange={setSelectedEnt}
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
        {/* <DynamicButtonGroup
          options={statusOptions}
          active={selectedStatus}
          onChange={(status) => {
            setSelectedStatus(status);
            setPageIndex(0); // Reset to first page on status change
            navigate(`/support/useractivity/redeem/${status}`);
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

export default RedeemTab;
