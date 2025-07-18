import { useState } from "react";
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests, RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "~/lib/constants";
import { Button } from "../components/ui/button";
import AssignDepositRequestDialog from "../components/AssignDepositRequestDialog";

const columns = [
  { accessorKey: "pendingSince", header: "PENDING SINCE" },
  { accessorKey: "rechargeId", header: "RECHARGE ID" },
  { accessorKey: "user", header: "USER" },
  { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
  { accessorKey: "amount", header: "AMOUNT" },
  { accessorKey: "actions", header: "ACTIONS" },
];



export default function RechargeQueuePage() {
  const { data, isLoading, isError, error, refetch } = useFetchRechargeRequests(RechargeProcessStatus.FINANCE);

  // State for modal
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  // Map fetched data to table format
  const tableData = (data || []).map((item: RechargeRequest) => ({
    pendingSince: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
    rechargeId: item.recharge_id || '-',
    user: item.players ? `${item.players.firstname || ''} ${item.players.lastname || ''}`.trim() : '-',
    paymentMethod: item.payment_method || '-',
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

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <DynamicHeading title="Recharge Queue" />
      <DynamicTable columns={columns} data={tableData} pagination={true} limit={10} pageIndex={0} onPageChange={setPageIndex} />
      <AssignDepositRequestDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedRow={selectedRow}
        onSuccess={refetch}
      />
    </div>
  );
}
