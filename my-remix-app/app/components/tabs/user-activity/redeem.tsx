import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate, useLocation } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import { useFetchRedeemRequests, useFetchRedeemRequestsMultiple } from "~/hooks/api/queries/useFetchRedeemRequests";
import { RedeemProcessStatus } from "~/lib/constants";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
];

const entOptions = [
  { label: "ALL ENT", value: "ALL" },
  { label: "ENT-1", value: "ENT-1" },
  { label: "ENT-2", value: "ENT-2" },
  { label: "ENT-3", value: "ENT-3" }
];

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Live", value: "live" },
  { label: "Completed", value: "completed" },
];

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
  { header: "INIT BY", accessorKey: "initBy" },
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

const RedeemTab: React.FC<{ activeTab: string, type: string }> = ({ activeTab = "redeem", type = "pending" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Determine the active tab and status based on the current URL
  const getActiveTabAndStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes('/recharge/')) {
      return { activeTab: 'recharge', status: pathname.includes('/pending') ? 'pending' : pathname.includes('/live') ? 'live' : 'completed' };
    } else if (pathname.includes('/redeem/')) {
      return { activeTab: 'redeem', status: pathname.includes('/pending') ? 'pending' : pathname.includes('/live') ? 'live' : 'completed' };
    } else {
      return { activeTab: 'redeem', status: 'pending' };
    }
  };

  const { activeTab: urlActiveTab, status: urlStatus } = getActiveTabAndStatus();

  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Determine the process status based on the current URL
  const getProcessStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes('/redeem/pending')) {
      return [RedeemProcessStatus.OPERATION];
    } else if (pathname.includes('/redeem/live')) {
      return [RedeemProcessStatus.VERIFICATION, RedeemProcessStatus.FINANCE];
    } else if (pathname.includes('/redeem/completed')) {
      return [RedeemProcessStatus.COMPLETED];
    } else {
      return [RedeemProcessStatus.OPERATION];
    }
  };

  const processStatuses = getProcessStatus();
  console.log(processStatuses, "getProcessStatus")
  console.log(urlActiveTab, urlStatus, "urlActiveTab, urlStatus")

  // Use the correct process status for redeem requests
  const { data, isLoading, isError } = processStatuses.length === 1 
    ? useFetchRedeemRequests(processStatuses[0])
    : useFetchRedeemRequestsMultiple(processStatuses);

  console.log(data, "redeem data")

  // Map the API data to match the table structure
  const tableData: Row[] = (data || []).map((item) => ({
    team: item.teams?.page_name || "N/A",
    initBy: "Agent", // Default value since not in API
    receiver: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "N/A",
    redeemId: item.redeem_id || item.id || "N/A",
    platform: item.payment_methods?.payment_method || "N/A",
    total: item.total_amount ? `$${item.total_amount}` : "$0",
    paid: item.amount_paid ? `$${item.amount_paid}` : "$0",
    hold: item.amount_hold ? `$${item.amount_hold}` : "$0",
    remaining: item.amount_available ? `$${item.amount_available}` : "$0",
    timeElapsed: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "N/A",
    status: item.process_status || "PENDING",
  }));

  console.log(tableData, "tableData")

  const filteredData = selectedEnt === "ALL"
    ? tableData
    : tableData.filter(row => row.team === selectedEnt);

  const pageCount = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice(pageIndex * limit, (pageIndex + 1) * limit);

  return (
    <UserActivityLayout
      activeTab={urlActiveTab}
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
        data={paginatedData}
        pagination={true}
        pageIndex={pageIndex}
        pageCount={pageCount}
        limit={limit}
        onPageChange={setPageIndex}
      />
    </UserActivityLayout>
  );
};

export default RedeemTab;
