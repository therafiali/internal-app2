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

export default function RedeemPage() {
  type RowType = {
    pendingSince: string;
    teamCode: string;
    redeemId: string;
    platform: string;
    user: string;
    initBy: string;
    // sequence: number; // Removed
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);

  const data: RowType[] = [
    {
      pendingSince: "2024-06-01",
      teamCode: "TEAM123",
      redeemId: "RDM001",
      platform: "Web",
      user: "John Doe",
      initBy: "Admin",
    },
    {
      pendingSince: "2024-06-02",
      teamCode: "TEAM456",
      redeemId: "RDM002",
      platform: "Mobile",
      user: "Jane Smith",
      initBy: "User",
    },
    {
      pendingSince: "2024-06-03",
      teamCode: "TEAM789",
      redeemId: "RDM003",
      platform: "Web",
      user: "Alice Brown",
      initBy: "Admin",
    },
  ];

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
    // { accessorKey: "sequence", header: "SEQUENCE" }, // Removed
  ];

  return (
    <div className="p-6">
      <DynamicHeading title="Redeem Request" />
      <div className="mt-6">
        <DynamicTable columns={columns} data={data} />
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
            <DialogClose asChild>
              <Button className="bg-green-600 hover:bg-green-700">Approve</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
