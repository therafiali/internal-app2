import { useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests, useFetchRechargeRequestsCount, RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "~/lib/constants";
import { Button } from "../components/ui/button";
import AssignDepositRequestDialog from "../components/AssignDepositRequestDialog";
import { formatPendingSince } from "~/lib/utils";

const columns = [
  {
    accessorKey: "pendingSince",
    header: "PENDING SINCE",
    cell: ({ row }: { row: { original: any } }) => {
      const { relative, formattedDate, formattedTime } = formatPendingSince(
        row.original.pendingSince
      );
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{relative}</div>
          <div>{formattedDate}</div>
          <div>{formattedTime}</div>
        </div>
      );
    },
  },
  { accessorKey: "rechargeId", header: "RECHARGE ID" },
  { accessorKey: "user", header: "USER" },
  { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
  { accessorKey: "amount", header: "AMOUNT" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function RechargeQueuePage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Fetch data with pagination
  const { data, isLoading, isError, error, refetch } = useFetchRechargeRequests(
    RechargeProcessStatus.FINANCE,
    pageSize,
    pageIndex * pageSize
  );
  
  // Fetch total count for pagination
  const { data: totalCount, isLoading: isCountLoading } = useFetchRechargeRequestsCount(
    RechargeProcessStatus.FINANCE
  );

  // State for modal
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Calculate page count
  const pageCount = Math.ceil((totalCount || 0) / pageSize);
  
  // Map fetched data to table format
  const tableData = (data || []).map((item: RechargeRequest) => ({
<<<<<<< Updated upstream
    pendingSince: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
    rechargeId: item.recharge_id || item.id || '-',
=======
    pendingSince: item.created_at || '-',
    rechargeId: item.recharge_id || '-',
>>>>>>> Stashed changes
    user: item.players ? `${item.players.firstname || ''} ${item.players.lastname || ''}`.trim() : '-',
    paymentMethod: item.payment_methods?.payment_method || item.payment_method || '-',
    amount: item.amount ? `$${item.amount}` : '-',
    actions: (
      <Button
        variant="default"
        onClick={() => {
          setSelectedRow(item);
          setModalOpen(true);
        }}
      >
        Assign
      </Button>
    ),
  }));

  console.log(tableData, "tableData finance recharge")

  if (isLoading || isCountLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <DynamicHeading title="Recharge Queue" />
      <DynamicTable 
             columns={columns} 
             data={tableData} 
             pagination={true}
             pageIndex={pageIndex}
             limit={pageSize}
             onPageChange={setPageIndex} />
      <AssignDepositRequestDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedRow={selectedRow}
        onSuccess={refetch}
      />
    </div>
  );
}
