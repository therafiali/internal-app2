import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "../lib/constants";

const columns = [
  { accessorKey: "teamCode", header: "Team Code" },
  { accessorKey: "pendingSince", header: "Pending Since" },
  { accessorKey: "rechargeId", header: "Recharge ID" },
  { accessorKey: "user", header: "User" },
  { accessorKey: "platform", header: "Platform" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "initBy", header: "INIT BY" },
  { accessorKey: "assignedBy", header: "ASSIGNED BY" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function VerificationRechargePage() {
  const { data, isLoading, isError, error } = useFetchRechargeRequests(RechargeProcessStatus.VERIFICATION);

  // Console log the raw data for debugging
  console.log('Verification Recharge Data:', data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = (data || []).map((item: any) => ({
    teamCode: item.teams?.page_name || item.team_code || '-',
    pendingSince: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
    rechargeId: item.id || '-',
    user: item.players ? `${item.players.firstname || ''} ${item.players.lastname || ''}`.trim() : '-',
    platform: item.platform || '-',
    amount: item.amount ? `$${item.amount}` : '-',
    initBy: item.initBy || '-',
    assignedBy: item.assignedBy || '-',
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
      <DynamicHeading title="Verification Recharge" />
      <DynamicTable columns={columns} data={tableData} />
    </div>
  );
}
