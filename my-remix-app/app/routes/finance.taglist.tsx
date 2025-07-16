import CreateTagDialog from "../components/forms/create-tag";
import DynamicHeading from "../components/shared/DynamicHeading";
import { DynamicTable } from "../components/shared/DynamicTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useFetchCompanyTags,
  CompanyTag,
} from "../hooks/api/queries/useFetchCompanytags";
import React from "react";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Button } from "../components/ui/button";

function getColumns(
  setQrPreview: (url: string) => void
): ColumnDef<CompanyTag>[] {
  return [
    { accessorKey: "tag_id", header: "Tag ID" },
    { accessorKey: "tag", header: "Tag Name" },
    { accessorKey: "payment_method", header: "Payment Method" },
    { accessorKey: "balance", header: "Balance" },
    {
      accessorKey: "qr_code",
      header: "QR Code",
      cell: ({ row }) => {
        const url = row.original.qr_code;
        return url ? (
          <button
            type="button"
            onClick={() => setQrPreview(url)}
            className="p-0 border-none bg-transparent"
            aria-label="Preview QR Code"
          >
            <img
              src={url}
              alt="QR Preview"
              className="w-8 h-8 object-cover rounded border border-gray-600 hover:shadow"
            />
          </button>
        ) : (
          <span className="text-gray-400 text-xs">No QR</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.status}</span>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          onClick={() => {
            if (row.original.qr_code) setQrPreview(row.original.qr_code);
          }}
        >
          Show
        </Button>
      ),
    },
  ];
}

export default function FinanceTagList() {
  const [status, setStatus] = React.useState<string>("all");
  const { data: tags, isLoading, error } = useFetchCompanyTags(status);
  const [qrPreview, setQrPreview] = React.useState<string | null>(null);

  const columns = React.useMemo(() => getColumns(setQrPreview), [setQrPreview]);

  return (
    <div className="p-8">
      <DynamicHeading title="Tag List" />
      <CreateTagDialog />
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="status" className="text-gray-200 text-sm">
          Status:
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-gray-700 bg-[#23272f] px-3 py-2 text-sm text-gray-100 shadow-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-500">Error loading tags</div>
      ) : (
        <DynamicTable columns={columns} data={tags || []} limit={10} />
      )}
      <Dialog
        open={!!qrPreview}
        onOpenChange={(open) => setQrPreview(open ? qrPreview : null)}
      >
        <DialogContent className="flex flex-col items-center bg-[#18181b]">
          {qrPreview && (
            <img
              src={qrPreview}
              alt="QR Full Preview"
              className="max-w-xs max-h-[60vh] rounded shadow-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
