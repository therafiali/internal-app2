
import { DynamicTable } from "../components/shared/DynamicTable";
import DynamicHeading from "../components/shared/DynamicHeading";
import { useFetchRechargeRequests } from "../hooks/api/queries/useFetchRechargeRequests";
import { RechargeProcessStatus } from "../lib/constants";

const columns = [
  { accessorKey: "pendingSince", header: "Pending Since" },
  { accessorKey: "teamCode", header: "Team Code" },
  { accessorKey: "rechargeId", header: "Recharge ID" },
  { accessorKey: "user", header: "USER" },
  { accessorKey: "actions", header: "ACTIONS" },
];

export default function OperationRechargePage() {
  const { data, isLoading, isError, error } = useFetchRechargeRequests(RechargeProcessStatus.OPERATION);

  // Console log the raw data for debugging
  console.log('Operation Recharge Data:', data);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = (data || []).map((item: any) => ({
    pendingSince: item.created_at ? new Date(item.created_at).toLocaleString() : '-',
    teamCode: item.teams?.page_name || item.team_code || '-',
    rechargeId: item.id || '-',
    user: item.players ? `${item.players.firstname || ''} ${item.players.lastname || ''}`.trim() : '-',
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
      <DynamicHeading title="Operation Recharge " />
      <DynamicTable columns={columns} data={tableData} />
    </div>
  );
}