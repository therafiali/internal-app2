import React, { useState, useRef } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import PrivateRoute from "~/components/private-route";
// import DynamicHeading from "~/components/shared/DynamicHeading";
// import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import {
  getRechargeType,
  // getStatusName,
  RechargeProcessStatus,
} from "~/lib/constants";
import {
  useFetchRechargeRequests,
  useFetchRechargeRequestsMultiple,
  useFetchAllRechargeRequests,
  type RechargeRequest,
} from "~/hooks/api/queries/useFetchRechargeRequests";
// import { useFetchTeams } from "~/hooks/api/queries/useFetchTeams";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { supabase, useAuth } from "~/hooks/use-auth";
import UploadImages, {
  type UploadImagesRef,
} from "~/components/shared/UploadImages";
// import TeamTabsBar from "~/components/shared/TeamTabsBar";
import { useFetchAgentEnt } from "~/hooks/api/queries/useFetchAgentEnt";
// import { useFetchRedeemRequests } from "~/hooks/api/queries/useFetchRedeemRequests";
import { useTeam } from "./TeamContext";

// async function getPlayerId() {
//   const { data, error } = await supabase
//     .from("redeem_requests")
//     .select("player_id")
//     .eq("redeem_id", "R-3PYX")
//   console.log(data, "reddeemdata")
//   return data;
// }

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

// Dynamic entOptions will be created from teams hook

// const statusOptions = [
//   { label: "Pending", value: "pending" },
//   { label: "Live", value: "live" },
//   { label: "Completed", value: "completed" },
// ];

type Row = {
  team: string;
  initBy: string;
  ctType: string;
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
  actions: React.ReactNode;
};

const columns: ColumnDef<Row>[] = [
  { header: "TIME ELAPSED", accessorKey: "timeElapsed" },
  { header: "TEAM", accessorKey: "team" },
  { header: "INIT BY", accessorKey: "initBy" },
  { header: "DEPOSITOR", accessorKey: "depositor" },
  { header: "RECHARGE ID", accessorKey: "rechargeId" },
  { header: "PLATFORM", accessorKey: "platform" },
  { header: "AMOUNT", accessorKey: "amount" },
  { header: "TARGET", accessorKey: "target" },
  { header: "TYPE", accessorKey: "type" },
  { header: "ASSIGNED ID", accessorKey: "targetId" },
  { header: "LOAD STATUS", accessorKey: "loadStatus" },
  { accessorKey: "actions", header: "ACTIONS" },
];

const RechargeTab: React.FC<{ activeTab: string }> = ({
  activeTab = "recharge",
}) => {
  const { selectedTeam } = useTeam();
  // Fetch teams dynamically from database
  // const { data: teams = ["All Teams"] } = useFetchTeams();
  const { user } = useAuth();
  const { data: agentEnt } = useFetchAgentEnt(user?.id || "");

  console.log(agentEnt, "agentEnt");
  // Get teams from agentEnt data and add "ALL" option
  const teamsFromEnts = agentEnt || [];
  const teams = ["ALL", ...teamsFromEnts];

  // Create dynamic entOptions from teams
  // const entOptions = [
  //   { label: "ALL", value: "ALL" },
  //   ...teams
  //     .filter((team) => team !== "All Teams")
  //     .map((team) => ({
  //       label: team,
  //       value: team,
  //     })),
  // ];

  const getProcessStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes("/recharge/pending")) {
      return [
        RechargeProcessStatus.SUPPORT,
        RechargeProcessStatus.VERIFICATION,
        RechargeProcessStatus.OPERATION,
        RechargeProcessStatus.FINANCE,
      ];
    } else if (pathname.includes("/recharge/live")) {
      return [RechargeProcessStatus.FINANCE];
    } else if (pathname.includes("/recharge/completed")) {
      return [RechargeProcessStatus.COMPLETED];
    } else {
      return [RechargeProcessStatus.FINANCE];
    }
  };

  const processStatus = getProcessStatus();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const uploadImagesRef = useRef<UploadImagesRef>(null);

  // const handleTeamChange = (team: string) => {
  //   setSelectedTeam(team);
  //   setPageIndex(0);
  // };

  console.log(processStatus, "processStatus1111");

  // Ensure processStatus is always defined
  const safeProcessStatus = processStatus || [RechargeProcessStatus.FINANCE];

  // Always call all hooks to maintain consistent order
  const singleStatusPaginated = useFetchRechargeRequests(
    safeProcessStatus[0] || RechargeProcessStatus.FINANCE
  );
  const singleStatusAll = useFetchAllRechargeRequests(
    safeProcessStatus[0] || RechargeProcessStatus.FINANCE
  );
  const multipleStatusFetch =
    useFetchRechargeRequestsMultiple(safeProcessStatus);

  // Determine which data source to use based on processStatus length
  const isSingleStatus = safeProcessStatus?.length === 1;

  // Use appropriate data source
  const data = isSingleStatus
    ? searchTerm
      ? singleStatusAll.data
      : singleStatusPaginated.data
    : multipleStatusFetch?.data;

  const refetch = isSingleStatus
    ? searchTerm
      ? singleStatusAll.refetch
      : singleStatusPaginated.refetch
    : multipleStatusFetch?.refetch || (() => {});

  // Function to reset process status to 'idle' if modal is closed without approving
  async function resetProcessStatus(id: string) {
    await supabase
      .from("recharge_requests")
      .update({
        support_recharge_process_status: "idle",
        support_recharge_process_by: null,
        support_recharge_process_at: null,
      })
      .eq("id", id);
    refetch();
  }

  const tableData: Row[] = (data || []).map((item) => ({
    pendingSince: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "-",
    rechargeId: item.recharge_id || "N/A",
    platform: item.games?.game_name || "N/A",

    team: (item.teams?.team_code || "-").toUpperCase(),

    initBy: "Agent",
    depositor: item.players
      ? item.players.fullname ||
        `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",
    target: item.payment_methods?.payment_method || "N/A",
    amount: item.amount ? `$${item.amount}` : "$0",
    type: item.ct_type || "N/A",
    ctType: item.ct_type || "N/A", // <-- Add this line

    targetId:
      item.ct_type === "pt" ? item.target_id || "N/A" : item.target_id || "N/A", // Default since target_id is not in the interface

    timeElapsed: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "-",
    depositStatus: "Pending", // Add missing depositStatus
    loadStatus: getRechargeType(item.process_status || "") || "N/A",

    user: item.players
      ? item.players.fullname ||
        `${item.players.firstname || ""} ${item.players.lastname || ""}`.trim()
      : "-",

    actions: (
      <Button
        disabled={item.support_recharge_process_status === "in_process"}
        variant="default"
        onClick={async () => {
          // fetch the row and check if it's in_process and show the alert
          const { data: rowData } = await supabase
            .from("recharge_requests")
            .select(
              "support_recharge_process_status, support_recharge_process_by, users:support_recharge_process_by (name, employee_code)"
            )
            .eq("id", item.id);
          console.log(rowData, "rowData");
          if (
            rowData &&
            rowData[0].support_recharge_process_status === "in_process"
          ) {
            const userName = rowData[0].users?.[0]?.name || "Unknown User";
            window.alert(
              rowData[0].support_recharge_process_status +
                " already in process" +
                " by " +
                userName
            );
            refetch();
            return;
          }

          // update the support_recharge_process_by to the current_user id from userAuth
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const currentUserId = userData.user.id;
            // update the support_recharge_process_by to the current_user id from userAuth
            await supabase
              .from("recharge_requests")
              .update({
                support_recharge_process_status: "in_process",
                support_recharge_process_by: currentUserId,
                support_recharge_process_at: new Date().toISOString(),
              })
              .eq("id", item.id);

            setSelectedRow(item);
            refetch();
            setModalOpen(true);
          }
        }}
      >
        {item.support_recharge_process_status === "in_process"
          ? `In Process${item.support_users?.[0]?.name || "Unknown"}`
          : "Process"}
      </Button>
    ),
  }));

  console.log(tableData, "tableData");

  // const getplayerid = getPlayerId()
  // console.log(getplayerid, "getplayerid")

  async function updateRechargeStatus(
    id: string,
    newStatus: RechargeProcessStatus,
    screenshotUrls?: string[],
    targetId?: string,
    ctType?: string,
    amount?: number
  ) {
    const updateData: Record<string, unknown> = { process_status: newStatus };

    // Add screenshot URLs if provided
    if (screenshotUrls && screenshotUrls?.length > 0) {
      updateData.screenshot_url = screenshotUrls;
    }

    if (targetId) {
      console.log(targetId, "targetId");
      updateData.target_id = null;
      updateData.ct_type = null;
      if (ctType === "pt") {
        console.log(ctType, "ctType");
        const { data: redeemData, error } = await supabase
          .from("redeem_requests")
          .select("amount_hold")
          .eq("id", targetId);
        console.log(error, "error");
        if (error) {
          console.error("Error fetching redeem request:", error);
          return error;
        }

        const currentAmountHold = redeemData?.[0]?.amount_hold || 0;
        const newAmountHold = Number(amount || 0) - Number(currentAmountHold);

        console.log(newAmountHold, "newAmountHold");

        const { error: updateError } = await supabase
          .from("redeem_requests")
          .update({ amount_hold: newAmountHold })
          .eq("id", targetId);
        console.log(updateError, "updateError");
        if (updateError) {
          console.error("Error updating redeem request:", updateError);
          return updateError;
        }
      }
    }

    const { error } = await supabase
      .from("recharge_requests")
      .update(updateData)
      .eq("id", id);
    return error;
  }

  const navigate = useNavigate();
  // Remove unused state variables
  // const [selectedEnt, setSelectedEnt] = useState("ALL");
  const [selectedStatus] = useState("pending");
  const [pageIndex, setPageIndex] = useState(0);
  const limit = 10;

  // DEBUG LOGS
  console.log("[RechargeTab] selectedTeam from context:", selectedTeam);
  console.log("[RechargeTab] teamsFromEnts:", teams);
  const allowedEnts = teamsFromEnts.map((ent: string) => ent.toUpperCase());
  console.log("[RechargeTab] allowedEnts:", allowedEnts);

  const filteredData =
    selectedTeam === "ALL"
      ? tableData.filter((row) => allowedEnts.includes(row.team))
      : tableData.filter(
          (row) => row.team.toUpperCase() === selectedTeam.toUpperCase()
        );
  console.log(
    "[RechargeTab] filteredData (length):",
    filteredData?.length,
    filteredData
  );

  // Calculate page count - different logic for search vs normal pagination
  const pageCount =
    searchTerm && isSingleStatus
      ? Math.ceil(filteredData?.length / limit) // Use filtered data count when searching
      : Math.ceil(filteredData?.length / limit); // Use filtered data count (client-side pagination)

  const paginatedData = filteredData.slice(
    pageIndex * limit,
    (pageIndex + 1) * limit
  );

  const tableDataToShow = searchTerm ? filteredData : paginatedData;
  // Check if screenshot upload should be shown
  const shouldShowScreenshotUpload =
    selectedRow?.process_status === RechargeProcessStatus.SUPPORT;

  // Handle process button click
  const handleProcess = async () => {
    if (!selectedRow) return;

    setIsProcessing(true);

    try {
      let uploadedUrls: string[] = [];

      // Upload screenshots if files are selected
      if (uploadImagesRef.current?.selectedFiles?.length) {
        uploadedUrls = await uploadImagesRef.current.uploadFiles();
        // setScreenshots(uploadedUrls); // This line was removed as per the edit hint
        console.log("Screenshots uploaded:", uploadedUrls);
      }

      // Determine new status based on process_status instead of ct_type
      const newStatus =
        selectedRow.ct_type === "pt"
          ? RechargeProcessStatus.VERIFICATION
          : RechargeProcessStatus.FINANCE_CONFIRMED;

      // Update recharge status and save screenshot URLs
      await updateRechargeStatus(selectedRow.id, newStatus, uploadedUrls);

      setModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error processing recharge:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReAssign = async () => {
    if (!selectedRow) return;
    setIsProcessing(true);

    try {
      await updateRechargeStatus(
        selectedRow.id,
        RechargeProcessStatus.FINANCE,
        undefined,
        selectedRow.target_id,
        selectedRow.ct_type,
        selectedRow.amount
      );
      setModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error reassigning recharge:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PrivateRoute toDepartment="support">
      <UserActivityLayout
        activeTab={activeTab}
        onTabChange={(tab) =>
          navigate(`/support/useractivity/${tab}/${selectedStatus}`)
        }
        tabOptions={tabOptions}
      >
        <div className="mb-4">
          {/* <DynamicButtonGroup
            options={entOptions}
            active={selectedEnt}
            onChange={(ent) => {
              setSelectedEnt(ent);
              setPageIndex(0); // Reset to first page on ENT change
            }}
            className="mb-2"
          /> */}

          {/* <TeamTabsBar
            teams={teams as string[]}
            selectedTeam={selectedTeam}
            onTeamChange={handleTeamChange}
          /> */}

          <div className="border-b border-[hsl(var(--sidebar-border))] w-full" />
        </div>
        <DynamicTable
          columns={columns}
          data={tableDataToShow}
          pagination={true}
          pageIndex={pageIndex}
          pageCount={pageCount}
          limit={50}
          onPageChange={(newPageIndex) => {
            setPageIndex(newPageIndex);
            if (searchTerm) setPageIndex(0);
          }}
          onSearchChange={(search) => {
            setSearchTerm(search);
            setPageIndex(0);
          }}
        />

        <Dialog
          open={modalOpen}
          onOpenChange={async (isOpen) => {
            if (!isOpen && selectedRow) {
              await resetProcessStatus(selectedRow.id);
              setSelectedRow(null);
            }
            setModalOpen(isOpen);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recharge Details</DialogTitle>
              <DialogDescription>
                {selectedRow ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <b>Team:</b> {selectedRow.teams?.team_code || "-"}
                    </div>
                    <div>
                      <b>Init By:</b> Agent
                    </div>
                    <div>
                      <b>Depositor:</b>{" "}
                      {selectedRow.players
                        ? selectedRow.players.fullname ||
                          `${selectedRow.players.firstname || ""} ${
                            selectedRow.players.lastname || ""
                          }`.trim()
                        : "-"}
                    </div>
                    <div>
                      <b>Recharge ID:</b> {selectedRow.recharge_id || "-"}
                    </div>
                    <div>
                      <b>Platform:</b> {selectedRow.games?.game_name || "-"}
                    </div>
                    <div>
                      <b>User:</b>{" "}
                      {selectedRow.players
                        ? selectedRow.players.fullname ||
                          `${selectedRow.players.firstname || ""} ${
                            selectedRow.players.lastname || ""
                          }`.trim()
                        : "-"}
                    </div>
                    <div>
                      <b>Payment Method:</b>{" "}
                      {selectedRow.payment_methods?.payment_method || "-"}
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

                    {/* Screenshot Upload Section */}
                    {shouldShowScreenshotUpload && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <h4 className="font-semibold mb-2">
                          Submit Screenshots
                        </h4>

                        {/* Show existing screenshots if any */}
                        {selectedRow.screenshot_url &&
                          selectedRow.screenshot_url?.length > 0 && (
                            <div className="mb-4">
                              <div className="text-sm text-gray-400 mb-2">
                                Existing Screenshots:
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {selectedRow.screenshot_url.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="border border-gray-700 rounded overflow-hidden"
                                  >
                                    <img
                                      src={url}
                                      alt={`screenshot-${idx}`}
                                      className="object-cover w-full h-24"
                                    />
                                    <div className="text-xs text-gray-400 truncate px-1 pb-1">
                                      Screenshot {idx + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        <UploadImages
                          ref={uploadImagesRef}
                          bucket="recharge-requests-screenshots"
                          numberOfImages={5}
                          showUploadButton={false}
                          onUpload={(urls) => {
                            // setScreenshots(urls); // This line was removed as per the edit hint
                            console.log("Screenshots uploaded:", urls);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  updateRechargeStatus(
                    selectedRow?.id || "",
                    RechargeProcessStatus.CANCELLED,
                    selectedRow?.screenshot_url || []
                  );
                  setModalOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                variant="default"
                onClick={handleReAssign}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Re Assign"}
              </Button>
              <Button
                variant="default"
                onClick={handleProcess}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Process"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </UserActivityLayout>
    </PrivateRoute>
  );
};

export default RechargeTab;
