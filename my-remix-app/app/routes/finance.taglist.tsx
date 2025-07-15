import DynamicHeading from "../components/shared/DynamicHeading";
import { DynamicTable } from "../components/shared/DynamicTable";
import type { ColumnDef } from "@tanstack/react-table";

const tagListData = [
  {
    method: "Bank Transfer",
    tag: "Salary",
    info: "Monthly Salary",
    balance: "$5,000",
    limit: "$10,000",
    actions: "View",
  },
  {
    method: "Credit Card",
    tag: "Shopping",
    info: "Online Shopping",
    balance: "$1,200",
    limit: "$5,000",
    actions: "View",
  },
];

const columns: ColumnDef<typeof tagListData[0]>[] = [
  { accessorKey: "method", header: "METHOD" },
  { accessorKey: "tag", header: "TAG" },
  { accessorKey: "info", header: "INFO" },
  { accessorKey: "balance", header: "BALANCE" },
  { accessorKey: "limit", header: "LIMIT" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function FinanceTagList() {
  return (
    <div className="p-8">
      <DynamicHeading title="Tag List" />
      <DynamicTable columns={columns} data={tagListData} />
    </div>
  );
}
