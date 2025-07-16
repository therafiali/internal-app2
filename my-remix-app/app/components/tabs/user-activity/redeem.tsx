import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";
import { useFetchRedeemRequests } from "~/hooks/api/queries/useFetchRedeemRequests";
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
  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 3;

  // Use the correct process status for redeem requests
  const { data, isLoading, isError } = useFetchRedeemRequests(RedeemProcessStatus.OPERATION);

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
      activeTab={activeTab}
      onTabChange={tab => navigate(`/support/useractivity/${tab}`)}
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
