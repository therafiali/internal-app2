import React, { useState } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import { RechargeProcessStatus } from "~/lib/constants";
import { useFetchRechargeRequests } from "~/hooks/api/queries/useFetchRechargeRequests";
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

const tableData: Row[] = [
  {
    team: "ENT-1",
    initBy: "Agent",
    depositor: "NadineMonique Gee\nBM-10006",
    rechargeId: "L-B87QE",
    platform: "umNadineMoniqueG\nULTRA PANDA",
    amount: "$20",
    type: "-",
    target: "-",
    targetId: "-",
    timeElapsed: "4d, 1h, 58m",
    depositStatus: "Pending",
    loadStatus: "Pending",
  },
  {
    team: "ENT-3",
    initBy: "Agent",
    depositor: "Sameer Khalid Khan\nPH-10137",
    rechargeId: "L-Y5CEJ",
    platform: "fk_sameer\nFIRE KIIRIN",
    amount: "$20",
    type: "PT",
    target: "$",
    targetId: "Rafi Ali",
    timeElapsed: "10d, 17h, 2m",
    depositStatus: "Verified",
    loadStatus: "Under Verification",
  },
  {
    team: "ENT-3",
    initBy: "Agent",
    depositor: "Sameer Khalid Khan\nPH-10137",
    rechargeId: "L-D5SSU",
    platform: "gv_sameer\nGAME VAULT",
    amount: "$50",
    type: "-",
    target: "-",
    targetId: "-",
    timeElapsed: "10d, 17h, 25m",
    depositStatus: "Pending",
    loadStatus: "Pending",
  },
  {
    team: "ENT-3",
    initBy: "Agent",
    depositor: "Sameer Khalid Khan\nPH-10137",
    rechargeId: "L-ZJM5M",
    platform: "fk_sameer\nFIRE KIIRIN",
    amount: "$50",
    type: "-",
    target: "-",
    targetId: "-",
    timeElapsed: "10d, 17h, 26m",
    depositStatus: "Pending",
    loadStatus: "Pending",
  },
];

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
  { header: "DEPOSIT STATUS", accessorKey: "depositStatus" },
  { header: "LOAD STATUS", accessorKey: "loadStatus" },
  { accessorKey: "actions", header: "ACTIONS" },
];

const RechargeTab: React.FC<{ activeTab: string }> = ({
  activeTab = "recharge",
}) => {
  const { data, isLoading, isError, error, refetch } = useFetchRechargeRequests(
    RechargeProcessStatus.SUPPORT
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState();
  const tableData = (data || []).map((item) => ({
    pendingSince: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "-",
    rechargeId: item.id || "-",
    user: item.players
      ? `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",
    paymentMethod: item.payment_method || "-",
    amount: item.amount ? `$${item.amount}` : "-",
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
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 3;

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
        onTabChange={(tab) => navigate(`/support/useractivity/${tab}`)}
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
          data={tableData}
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
                      <b>Recharge ID:</b> {selectedRow.id || "-"}
                    </div>
                    <div>
                      <b>User:</b>{" "}
                      {selectedRow.players
                        ? `${selectedRow.players.firstname || ""} ${
                            selectedRow.players.lastname || ""
                          }`.trim()
                        : "-"}
                    </div>
                    <div>
                      <b>Payment Method:</b> {selectedRow.payment_method || "-"}
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
