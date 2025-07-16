import CreateTagDialog from "../components/forms/create-tag";
import DynamicHeading from "../components/shared/DynamicHeading";
import { DynamicTable } from "../components/shared/DynamicTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useFetchCompanyTags,
  CompanyTag,
} from "../hooks/api/queries/useFetchCompanytags";

const columns: ColumnDef<CompanyTag>[] = [
  { accessorKey: "tag_id", header: "Tag ID" },
  { accessorKey: "tag", header: "Tag Name" },
  { accessorKey: "payment_method", header: "Payment Method" },
  { accessorKey: "balance", header: "Balance" },
  { accessorKey: "qr_code", header: "QR Code URL" },
];

export default function FinanceTagList() {
  const { data: tags, isLoading, error } = useFetchCompanyTags();

  return (
    <div className="p-8">
      <DynamicHeading title="Tag List" />
      <CreateTagDialog />
      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-500">Error loading tags</div>
      ) : (
        <DynamicTable columns={columns} data={tags || []} />
      )}
    </div>
  );
}
