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

export default function VerificationRedeemPage() {
  type RowType = {
    teamCode: string;
    pendingSince: string;
    redeemId: string;
    user: string;
    paymentMethods: string;
    initBy: string;
    processedBy: string;
  };

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RowType | null>(null);

  const data: RowType[] = [
    {
      teamCode: "A123",
      pendingSince: "2024-06-01",
      redeemId: "R001",
      user: "John Doe",
      paymentMethods: "Credit Card",
      initBy: "Admin",
      processedBy: "Manager",
    },
    {
      teamCode: "B456",
      pendingSince: "2024-06-02",
      redeemId: "R002",
      user: "Jane Smith",
      paymentMethods: "Bank Transfer",
      initBy: "User",
      processedBy: "Supervisor",
    },
    {
      teamCode: "C789",
      pendingSince: "2024-06-03",
      redeemId: "R003",
      user: "Alice Brown",
      paymentMethods: "PayPal",
      initBy: "Admin",
      processedBy: "Director",
    },
  ];

  const columns = [
    { accessorKey: "teamCode", header: "TEAM CODE" },
    { accessorKey: "pendingSince", header: "PENDING SINCE" },
    { accessorKey: "redeemId", header: "REDEEM ID" },
    { accessorKey: "user", header: "USER" },
    { accessorKey: "paymentMethods", header: "PAYMENT METHODS" },
    { accessorKey: "initBy", header: "INIT BY" },
    { accessorKey: "processedBy", header: "PROCESSED BY" },
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

  return (
    <div className="p-6">
      <DynamicHeading title="Verification Redeem Request" />
      <div className="mt-6">
        <DynamicTable columns={columns} data={data} />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verification Details</DialogTitle>
            <DialogDescription>
              Dummy data for verification process.
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="my-4">
              <div><b>Redeem ID:</b> {selectedRow.redeemId}</div>
              <div><b>User:</b> {selectedRow.user}</div>
              <div><b>Payment Methods:</b> {selectedRow.paymentMethods}</div>
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
