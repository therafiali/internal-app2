import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";

const columns = [
  { accessorKey: "processedBy", header: "PROCESSED BY" },
  { accessorKey: "verifiedBy", header: "VERIFIED BY" },
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
    cell: ({ row }: { row: { original: typeof data[0] } }) => (
      <Button size="sm" onClick={() => alert(`View details for ${row.original.redeemId}`)}>
        View
      </Button>
    ),
  },
];

const data = [
  {
    processedBy: "Manager",
    verifiedBy: "Auditor",
    pendingSince: "2024-06-01 09:00",
    redeemId: "RD123456",
    user: "John Doe",
    totalAmount: "$500.00",
    paidAmount: "$200.00",
    holdAmount: "$50.00",
    remainingAmount: "$250.00",
    availableToHold: "$100.00",
    paymentMethod: "Bank Transfer",
  },
  {
    processedBy: "Supervisor",
    verifiedBy: "Lead",
    pendingSince: "2024-06-02 10:30",
    redeemId: "RD123457",
    user: "Jane Smith",
    totalAmount: "$300.00",
    paidAmount: "$100.00",
    holdAmount: "$30.00",
    remainingAmount: "$170.00",
    availableToHold: "$70.00",
    paymentMethod: "PayPal",
  },
  {
    processedBy: "Director",
    verifiedBy: "Manager",
    pendingSince: "2024-06-03 11:45",
    redeemId: "RD123458",
    user: "Alice Brown",
    totalAmount: "$800.00",
    paidAmount: "$400.00",
    holdAmount: "$100.00",
    remainingAmount: "$300.00",
    availableToHold: "$200.00",
    paymentMethod: "Credit Card",
  },
];

export default function RedeemQueuePage() {
  return (
    <div className="p-8">
      <DynamicHeading title="Redeem Queue" />
      <ScrollArea className="w-full max-w-full">
        <div className="min-w-[1200px]">
          <DynamicTable columns={columns} data={data} />
        </div>
      </ScrollArea>
    </div>
  );
}
