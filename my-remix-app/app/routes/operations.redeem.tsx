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

export default function RedeemPage() {
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

  // Use the custom hook to fetch redeem requests with process_status 'operation'
  const { data, isLoading, isError, error } = useFetchRedeemRequests(RedeemProcessStatus.OPERATION);

  console.log('Redeem Requests Data:', data);

  const columns = [
    { accessorKey: "pendingSince", header: "PENDING SINCE" },
    { accessorKey: "teamCode", header: "TEAM CODE" },
    { accessorKey: "redeemId", header: "REDEEM ID" },
    { accessorKey: "platform", header: "PLATFORM" },
    { accessorKey: "user", header: "USER" },
    { accessorKey: "initBy", header: "INIT BY" },
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
    id: item.id,
    pendingSince: item.created_at || '-',
    teamCode: item.teams?.page_name || '-',
    redeemId: item.redeem_id || '-',
    platform: item.process_status || '-',
    user: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim() || '-'
      : '-',
    initBy: '-', // No direct player_id in RedeemRequest, so fallback to '-'
  }));

  // Function to update status from 'operation' to 'verification'
  async function updateRedeemStatus(id: string) {
    const { error: updateError } = await supabase
      .from("redeem_requests")
      .update({ process_status: RedeemProcessStatus.VERIFICATION })
      .eq("id", id);
    if (!updateError) {
      setOpen(false);
      // Invalidate the query to refetch data and update the UI
      queryClient.invalidateQueries(['redeem_requests', RedeemProcessStatus.OPERATION]);
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
      <DynamicHeading title="Redeem Request" />
      <div className="mt-6">
        <DynamicTable columns={columns} data={tableData} />
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
