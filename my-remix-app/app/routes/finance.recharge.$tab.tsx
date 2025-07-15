import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests, RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "~/lib/constants";

const columns = [
  { accessorKey: "initBy", header: "INIT BY" },
  { accessorKey: "pendingSince", header: "PENDING SINCE" },
  { accessorKey: "rechargeId", header: "RECHARGE ID" },
  { accessorKey: "user", header: "USER" },
  { accessorKey: "paymentMethod", header: "PAYMENT METHOD" },
  { accessorKey: "amount", header: "AMOUNT" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function RechargeQueuePage() {
  const { data, isLoading, isError, error } = useFetchRechargeRequests(RechargeProcessStatus.FINANCE);

  // Map fetched data to table format
  const tableData = (data || []).map((item: RechargeRequest) => ({
    initBy: item.initBy || "-", // fallback if field missing
    pendingSince: item.pendingSince || "-",
    rechargeId: item.recharge_id,
    user: item.player_id || "-",
    paymentMethod: item.payment_method,
    amount: item.amount ? `$${item.amount}` : "-",
    actions: <button className="px-2 py-1 bg-blue-500 text-white rounded">View</button>,
  }));

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <DynamicHeading title="Recharge Queue" />
      <DynamicTable columns={columns} data={tableData} />
    </div>
  );
}
