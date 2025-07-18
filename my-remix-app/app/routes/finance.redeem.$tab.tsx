import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../components/ui/dialog";
import { useState } from "react";
import { useFetchRedeemRequests, RedeemRequest } from "../hooks/api/queries/useFetchRedeemRequests";
import { supabase } from "../hooks/use-auth";
import { RedeemProcessStatus } from "../lib/constants";
import { useQueryClient } from '@tanstack/react-query';

export default function FinanceRedeemPage() {
  type RowType = {
    id: string;
    pendingSince: string;
    teamCode: string;
    redeemId: string;
    platform: string;
    user: string;
    initBy: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // Use the custom hook to fetch redeem requests with process_status 'finance'
  const { data, isLoading, isError, error } = useFetchRedeemRequests(RedeemProcessStatus.FINANCE);

  console.log('Finance Redeem Requests Data:', data);

  const columns = [
    // { accessorKey: "processedBy", header: "PROCESSED BY" },
    // { accessorKey: "verifiedBy", header: "VERIFIED BY" },
    { accessorKey: "pendingSince", header: "PENDING SINCE" },
    { accessorKey: "redeemId", header: "REDEEM ID" },
    { accessorKey: "user", header: "USER" },
    { accessorKey: "totalAmount", header: "TOTAL AMOUNT" },
    { accessorKey: "paidAmount", header: "PAID AMOUNT" },
    { accessorKey: "holdAmount", header: "HOLD AMOUNT" },
    { accessorKey: "remainingAmount", header: "REMAINING AMOUNT" },
    { accessorKey: "availableToHold", header: "AVAILABLE TO HOLD" },
    { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
    {
      accessorKey: "actions",
      header: "ACTIONS",
      cell: ({ row }: { row: { original: RowType } }) => (
        <Button
          onClick={() => {
            setSelectedRow(row.original);
            setOpen(true);
          }}
        >
          Process
        </Button>
      ),
    },
  ];

  // Map the fetched data to the table row format
  const tableData: RowType[] = (data || []).map((item: RedeemRequest) => ({
    id: item.redeem_id,
    pendingSince: item.created_at || '-',
    teamCode: item.teams?.page_name || '-',
    redeemId: item.redeem_id || '-',
    platform: item.process_status || '-',
    totalAmount:item.total_amount || "-",
    paidAmount:item.amount_paid || '-',
     holdAmount:item.amount_hold || '-',
     availableToHold:item.amount_available || '-',
    paymentMethod:item.amount_available || '-',
    


    user: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim() || '-'
      : '-',
    initBy: '-', // No direct player_id in RedeemRequest, so fallback to '-'
  }));

  // Function to update status from 'finance' to 'completed'
  async function updateRedeemStatus(id: string) {
    const { error: updateError } = await supabase
      .from("redeem_requests")
      .update({ process_status: RedeemProcessStatus.COMPLETED })
      .eq("id", id);
    if (!updateError) {
      setOpen(false);
      // Invalidate the query to refetch data and update the UI
      queryClient.invalidateQueries({ queryKey: ['redeem_requests', RedeemProcessStatus.FINANCE] });
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }
  if (isError) {
    return <div className="p-6 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <DynamicHeading title="Finance Redeem Request" />
      <div className="mt-6">
        <DynamicTable
          columns={columns}
          data={tableData}
          pagination={true}
          pageIndex={pageIndex}
          limit={limit}
          onPageChange={setPageIndex}
        />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redeem Details</DialogTitle>
            <DialogDescription>
              Dummy data for redeem process.
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="my-4">
              <div><b>Redeem ID:</b> {selectedRow.redeemId}</div>
              <div><b>User:</b> {selectedRow.user}</div>
              <div><b>Team Code:</b> {selectedRow.teamCode}</div>
              <div><b>Platform:</b> {selectedRow.platform}</div>
              <div><b>Pending Since:</b> {selectedRow.pendingSince}</div>
              <div><b>Redeem ID:</b> {selectedRow.total_amount}</div>
              <div><b>Redeem ID:</b> {selectedRow.paidAmount}</div>
              <div><b>Redeem ID:</b> {selectedRow.holdAmount}</div>
              <div><b>Redeem ID:</b> {selectedRow.availableToHold}</div>
              <div><b>Redeem ID:</b> {selectedRow.paymentMethod}</div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">Reject</Button>
            </DialogClose>
            <Button className="bg-green-600 hover:bg-green-700" onClick={async () => {
              if (selectedRow) {
                await updateRedeemStatus(selectedRow.id);
              }
            }}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
