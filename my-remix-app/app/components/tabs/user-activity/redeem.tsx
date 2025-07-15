import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import EntSelector from "~/components/shared/EntSelector";

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

const tableData: Row[] = [
  { team: "ENT-2", initBy: "Agent", receiver: "Rafi Ali\nHS-10105", redeemId: "R-MDPD9", platform: "test\nGAME VAULT", total: "$25", paid: "$0", hold: "$0", remaining: "$25", timeElapsed: "10d, 20m ago", status: "PENDING" },
  { team: "ENT-2", initBy: "Agent", receiver: "Rafi Ali\nHS-10105", redeemId: "R-5F7XX", platform: "chatgpt.com\nFIRE KIIRIN", total: "$200", paid: "$0", hold: "$70", remaining: "$200", timeElapsed: "10d, 17h, 42m ago", status: "QUEUED" },
  { team: "ENT-3", initBy: "Agent", receiver: "Rafi Ali\nHS-10105", redeemId: "R-ZDJ3E", platform: "test\nORION STARS", total: "$100", paid: "$0", hold: "$0", remaining: "$100", timeElapsed: "10d, 17h, 56m ago", status: "REJECTED" },
  { team: "ENT-3", initBy: "Agent", receiver: "Rafi Ali\nHS-10105", redeemId: "R-W556F", platform: "rafi_ali\nGOLDEN TREASURE", total: "$22", paid: "$0", hold: "$0", remaining: "$22", timeElapsed: "10d, 20h, 1m ago", status: "VERIFICATION FAILED" },
  { team: "ENT-2", initBy: "Agent", receiver: "Joseph Castro\nHS-10007", redeemId: "R-3KZS6", platform: "test\nORION STARS", total: "$20", paid: "$0", hold: "$0", remaining: "$20", timeElapsed: "10d, 20h, 38m ago", status: "VERIFICATION FAILED" },
  { team: "ENT-3", initBy: "Agent", receiver: "Rafi Ali\nHS-10105", redeemId: "R-NYFPC", platform: "rafi_ali\nJUWA", total: "$22", paid: "$0", hold: "$0", remaining: "$22", timeElapsed: "10d, 20h, 45m ago", status: "VERIFICATION FAILED" },
  { team: "ENT-1", initBy: "Agent", receiver: "Renee White\nBM-10295", redeemId: "R-YNCQP", platform: "njvw_reneewhite\nJUWA", total: "$20", paid: "$0", hold: "$10", remaining: "$20", timeElapsed: "10d, 20h, 46m ago", status: "QUEUED" },
  { team: "ENT-1", initBy: "Agent", receiver: "Reed Looper\nBM-10210", redeemId: "R-SSBF2", platform: "Jw_reedlooper\nJUWA", total: "$85", paid: "$0", hold: "$0", remaining: "$85", timeElapsed: "12d, 11h, 38m ago", status: "VERIFICATION FAILED" }
];

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

const RedeemTab: React.FC<{ activeTab: string }> = ({ activeTab = "redeem" }) => {
  const navigate = useNavigate();
  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 3;

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
