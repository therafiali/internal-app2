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
import { useUpdateCompanyTagStatus } from "../hooks/api/mutations/useUpdateCompanyTagStatus";
import { useFetchPaymentMethods } from "../hooks/api/queries/useFetchPaymentMethods";

function getColumns(
  setQrPreview: (url: string) => void,
  setProcessModal: (tag: CompanyTag | null) => void
): ColumnDef<CompanyTag>[] {
  return [
    { accessorKey: "payment_method", header: "Payment Method" },
    { accessorKey: "tag_id", header: "Tag ID" },
    { accessorKey: "tag", header: "Tag Name" },
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
      cell: ({ row }) => {
        return (
          <div className="flex gap-2 justify-center">
            <Button
              size={"sm"}
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setProcessModal(row.original)}
            >
              Process
            </Button>
          </div>
        );
      },
    },
  ];
}

export default function FinanceTagList() {
  const [status, setStatus] = React.useState<string>("all");
  const [paymentMethod, setPaymentMethod] = React.useState<string>("all");
  const [qrPreview, setQrPreview] = React.useState<string | null>(null);
  const [processModal, setProcessModal] = React.useState<CompanyTag | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);
  const limit = 10;
  const { data: paymentMethods, isLoading: isLoadingPaymentMethods } =
    useFetchPaymentMethods();
  const updateStatus = useUpdateCompanyTagStatus();
  const {
    data: tags,
    isLoading,
    error,
  } = useFetchCompanyTags(status, paymentMethod);

  const columns = React.useMemo(
    () => getColumns(setQrPreview, setProcessModal),
    [setQrPreview, setProcessModal]
  );

  return (
    <div className="p-8 min-h-screen bg-[#16161a]">
      <DynamicHeading title="Tag List" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 mt-4">
        <CreateTagDialog />
        <div className="flex items-center gap-4 bg-[#23272f] px-4 py-2 rounded-lg border border-gray-700 shadow-sm">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="status"
              className="text-gray-200 text-sm font-medium"
            >
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              aria-label="Filter by status"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="payment-method"
              className="text-gray-200 text-sm font-medium"
            >
              Payment Method
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded border border-gray-700 bg-[#18181b] px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              aria-label="Filter by payment method"
              disabled={isLoadingPaymentMethods}
            >
              <option value="all">All</option>
              {paymentMethods &&
                paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.payment_method}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-800 bg-[#23272f] shadow-lg p-4">
        {isLoading ? (
          <div className="text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-red-500">Error loading tags</div>
        ) : (
          <DynamicTable
            columns={columns}
            data={tags || []}
            pagination={true}
            pageIndex={pageIndex}
            limit={limit}
            onPageChange={setPageIndex}
          />
        )}
      </div>
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
      <Dialog
        open={!!processModal}
        onOpenChange={(open) => setProcessModal(open ? processModal : null)}
      >
        <DialogContent className="bg-[#23272f] border border-gray-700">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-100 mb-2">
                Process Tag
              </h3>
              <p className="text-gray-400 text-sm">
                Tag: <span className="text-blue-400 font-medium">{processModal?.tag}</span>
              </p>
              <p className="text-gray-400 text-sm">
                Current Status: <span className="capitalize text-yellow-400 font-medium">{processModal?.status}</span>
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              {processModal?.status === "disabled" && (
                <>
                  <Button
                    size={"default"}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-6"
                    onClick={() => {
                      updateStatus.mutate({
                        id: processModal.id,
                        status: "active",
                      });
                      setProcessModal(null);
                    }}
                    disabled={updateStatus.isPending}
                  >
                    Set Active
                  </Button>
                  <Button
                    size={"default"}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6"
                    onClick={() => {
                      updateStatus.mutate({
                        id: processModal.id,
                        status: "inactive",
                      });
                      setProcessModal(null);
                    }}
                    disabled={updateStatus.isPending}
                  >
                    Set Inactive
                  </Button>
                </>
              )}
              {processModal?.status === "active" && (
                <>
                  <Button
                    size={"default"}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-6"
                    onClick={() => {
                      updateStatus.mutate({
                        id: processModal.id,
                        status: "disabled",
                      });
                      setProcessModal(null);
                    }}
                    disabled={updateStatus.isPending}
                  >
                    Set Disabled
                  </Button>
                  <Button
                    size={"default"}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6"
                    onClick={() => {
                      updateStatus.mutate({
                        id: processModal.id,
                        status: "inactive",
                      });
                      setProcessModal(null);
                    }}
                    disabled={updateStatus.isPending}
                  >
                    Set Inactive
                  </Button>
                </>
              )}
              {processModal?.status === "inactive" && (
                <>
                  <Button
                    size={"default"}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-6"
                    onClick={() => {
                      updateStatus.mutate({
                        id: processModal.id,
                        status: "disabled",
                      });
                      setProcessModal(null);
                    }}
                    disabled={updateStatus.isPending}
                  >
                    Set Disabled
                  </Button>
                  <Button
                    size={"default"}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium px-6"
                    onClick={() => {
                      updateStatus.mutate({
                        id: processModal.id,
                        status: "active",
                      });
                      setProcessModal(null);
                    }}
                    disabled={updateStatus.isPending}
                  >
                    Set Active
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
