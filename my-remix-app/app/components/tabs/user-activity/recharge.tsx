import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import { getStatusName, RechargeProcessStatus } from "~/lib/constants";
import { useFetchRechargeRequests, useFetchRechargeRequestsMultiple } from "~/hooks/api/queries/useFetchRechargeRequests";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { supabase } from "~/hooks/use-auth";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
];

const entOptions = [
  { label: "ALL ENT", value: "ALL" },
  { label: "ENT-1", value: "ENT-1" },
  { label: "ENT-2", value: "ENT-2" },
  { label: "ENT-3", value: "ENT-3" },
];

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Live", value: "live" },
  { label: "Completed", value: "completed" },
];


type Row = {
  team: string;
  initBy: string;
  depositor: string;
  rechargeId: string;
  platform: string;
  amount: string;
  type: string;
  target: string;
  targetId: string;
  timeElapsed: string;
  depositStatus: string;
  loadStatus: string;
};


const columns: ColumnDef<Row>[] = [
  { header: "TEAM", accessorKey: "team" },
  { header: "INIT BY", accessorKey: "initBy" },
  { header: "DEPOSITOR", accessorKey: "depositor" },
  { header: "RECHARGE ID", accessorKey: "rechargeId" },
  { header: "PLATFORM", accessorKey: "platform" },
  { header: "AMOUNT", accessorKey: "amount" },
  { header: "TYPE", accessorKey: "type" },
  { header: "TARGET", accessorKey: "target" },
  { header: "TARGET ID", accessorKey: "targetId" },
  { header: "TIME ELAPSED", accessorKey: "timeElapsed" },
  { header: "LOAD STATUS", accessorKey: "loadStatus" },
  { accessorKey: "actions", header: "ACTIONS" },
];

const RechargeTab: React.FC<{ activeTab: string }> = ({
  activeTab = "recharge",
}) => {



  const getProcessStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes('/recharge/pending')) {
      return [RechargeProcessStatus.FINANCE];
    } else if (pathname.includes('/recharge/live')) {
      return [RechargeProcessStatus.SUPPORT, RechargeProcessStatus.VERIFICATION, RechargeProcessStatus.OPERATION];
    } else if (pathname.includes('/recharge/completed')) {
      return [RechargeProcessStatus.COMPLETED];
    } else {
      return [RechargeProcessStatus.FINANCE];
    }
  }

  const processStatus = getProcessStatus();

  const { data, isLoading, isError, error, refetch } = processStatus.length === 1
    ? useFetchRechargeRequests(processStatus[0])
    : useFetchRechargeRequestsMultiple(processStatus);


  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState();
  const tableData = (data || []).map((item) => ({
    pendingSince: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "-",
    rechargeId: item.recharge_id || "N/A",
    platform: item.games?.game_name || "N/A",

    team: item.players
      ? `${item.teams?.team_code || ""}`.trim()
      : "-",

    initBy: "Agent",
    depositor: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",
    target: item.payment_methods?.payment_method|| "N/A",
    amount: item.amount ? `$${item.amount}` : "$0",
    type: item.type || "CT",

    targetId: item.target_id || "N/A",
    timeElapsed: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "-",
    loadStatus: getStatusName(item.process_status) || "N/A",  


    user: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",

    actions: (
      <Button
        variant="default"
        onClick={() => {
          setSelectedRow(item);
          setModalOpen(true);
        }}
      >
        Process
      </Button>
    ),
  }));


  console.log(tableData, "tableData")



  async function updateRechargeStatus(
    id: string,
    newStatus: RechargeProcessStatus
  ) {
    const { error } = await supabase
      .from("recharge_requests")
      .update({ process_status: newStatus })
      .eq("id", id);
    return error;
  }

  const navigate = useNavigate();
  const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  const filteredData =
    selectedEnt === "ALL"
      ? tableData
      : tableData.filter((row) => row.team === selectedEnt);

  const pageCount = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice(
    pageIndex * limit,
    (pageIndex + 1) * limit
  );

  return (
    <PrivateRoute section="support">
      <UserActivityLayout
        activeTab={activeTab}
        onTabChange={(tab) => navigate(`/support/useractivity/${tab}/${selectedStatus}`)}
        tabOptions={tabOptions}
      >
        <div className="mb-4">
          <DynamicButtonGroup
            options={entOptions}
            active={selectedEnt}
            onChange={(ent) => {
              setSelectedEnt(ent);
              setPageIndex(0); // Reset to first page on ENT change
            }}
            className="mb-2"
          />

          <div className="border-b border-[hsl(var(--sidebar-border))] w-full" />
        </div>
        <DynamicTable
          columns={columns}
          data={paginatedData}
          pagination={true}
          pageIndex={pageIndex}
          pageCount={pageCount}
          limit={limit}
          onPageChange={setPageIndex}
        />

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recharge Details</DialogTitle>
              <DialogDescription>
                {selectedRow ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <b>Team:</b> {selectedRow.team || "-"}
                    </div>
                    <div>
                      <b>Init By:</b> {selectedRow.initBy || "Agent"}
                    </div>
                    <div>
                      <b>Depositor:</b> {selectedRow.depositor || "-"}
                    </div>  
                    <div>
                      <b>Recharge ID:</b> {selectedRow.recharge_id || "-"}
                    </div>
                    <div>
                      <b>Platform:</b> {selectedRow.platform || "-"}
                    </div>
                    <div>
                      <b>User:</b>{" "}
                      {selectedRow.players
                        ? `${selectedRow.players.firstname || ""} ${selectedRow.players.lastname || ""
                          }`.trim()
                        : "-"}
                    </div>
                    <div>
                      <b>Target Id</b> {selectedRow.payment_method || "-"}
                    </div>
                    <div>
                      <b>Amount:</b>{" "}
                      {selectedRow.amount ? `$${selectedRow.amount}` : "-"}
                    </div>
                    <div>
                      <b>Pending Since:</b>{" "}
                      {selectedRow.created_at
                        ? new Date(selectedRow.created_at).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={() => setModalOpen(false)}>
                Reject
              </Button>
              <Button
                variant="default"
                onClick={async () => {
                  if (!selectedRow) return;

                  await updateRechargeStatus(
                    selectedRow.id,
                    RechargeProcessStatus.VERIFICATION
                  );

                  setModalOpen(false);
                  refetch();
                }}
              >
                {" "}
                Process{" "}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </UserActivityLayout>
    </PrivateRoute>
  );
};

export default RechargeTab;
