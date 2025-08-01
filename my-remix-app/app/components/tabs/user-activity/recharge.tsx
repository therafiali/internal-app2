import React, { useState, useRef } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import PrivateRoute from "~/components/private-route";

import {
  getRechargeType,
  RechargeProcessStatus,
} from "~/lib/constants";
import {
  useFetchRechargeRequestsMultiple,
  type RechargeRequest,
} from "~/hooks/api/queries/useFetchRechargeRequests";

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
import { useFetchAgentEnt } from "~/hooks/api/queries/useFetchAgentEnt";
import { useTeam } from "./TeamContext";
import PaymentMethodTagsAdvanced from "~/components/shared/PaymentMethodTagsAdvanced";

const tabOptions = [
  { label: "Recharge", value: "recharge" },
  { label: "Redeem", value: "redeem" },
  { label: "Transfer", value: "transfer" },
  { label: "Reset Password", value: "resetpassword" },
  { label: "New Account", value: "newaccount" },
];

type Row = {
  team: string;
  ctType: string;
  depositor: string;
  rechargeId: string;
  platform: string;
  amount: string;
  type: string;
  target: string;
  targetId: string | JSX.Element;
  timeElapsed: string;
  depositStatus: string;
  loadStatus: string;
  actions: React.ReactNode;
};

const columns: ColumnDef<Row>[] = [
  { header: "TIME ELAPSED", accessorKey: "timeElapsed" },
  { header: "TEAM", accessorKey: "team" },
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

 
  // Get teams from agentEnt data and add "ALL" option
  const teamsFromEnts = agentEnt || [];
  const teams = ["ALL", ...teamsFromEnts];

  const getProcessStatus = () => {
    const pathname = location.pathname;
    if (pathname.includes("/recharge/pending")) {
      return [
        RechargeProcessStatus.SUPPORT,
        RechargeProcessStatus.VERIFICATION,
        RechargeProcessStatus.OPERATION,
        RechargeProcessStatus.FINANCE,
      ];
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

 

  // Ensure processStatus is always defined
  const safeProcessStatus = processStatus || [RechargeProcessStatus.FINANCE];

  // Always use multiple status fetch for consistency
  const multipleStatusFetch =
    useFetchRechargeRequestsMultiple(safeProcessStatus);

  // Use appropriate data source
  const data = multipleStatusFetch?.data || [];

  const refetch = multipleStatusFetch?.refetch || (() => {});

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

  const tableData: Row[] = (Array.isArray(data) ? data : []).map(
    (item: RechargeRequest) => ({
      pendingSince: item.created_at
        ? new Date(item.created_at).toLocaleString()
        : "-",
      rechargeId: item.recharge_id || "-",
      platform: item.games?.game_name || "-",

      team: (item.teams?.team_code || "-").toUpperCase(),

      depositor: item.players
        ? item.players.fullname ||
          `${item.players.firstname || ""} ${
            item.players.lastname || ""
          }`.trim()
        : "-",
      target: item.payment_methods?.payment_method || "-",
      amount: item.amount ? `$${item.amount}` : "$0",
      type: item.ct_type?.toUpperCase() || "-",
      ctType: item.ct_type || "-", // <-- Add this line

      targetId:
        item.ct_type === "pt" && item.target_id ? (
          <PaymentMethodTagsAdvanced
            redeemId={item.target_id}
            targetId={item.payment_methods?.payment_method || ""}
          />
        ) : (
          item.target_id || "-"
        ),

      timeElapsed: item.created_at
        ? new Date(item.created_at).toLocaleString()
        : "-",
      depositStatus: "Pending", // Add missing depositStatus
      loadStatus: getRechargeType(item.process_status || "") || "-",

      user: item.players
        ? item.players.fullname ||
          `${item.players.firstname || ""} ${
            item.players.lastname || ""
          }`.trim()
        : "-",

      actions: (
        // Show action button only when process_status is finance (0) or support (1)
        (item.process_status === RechargeProcessStatus.FINANCE || 
         item.process_status === RechargeProcessStatus.SUPPORT) ? (
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
        ) : <div
        className="p-2">-</div>         
      ),
    })
  );



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
     
      updateData.target_id = null;
      updateData.ct_type = null;
      if (ctType === "pt") {
       
        const { data: amountHoldData, error } = await supabase
          .from("redeem_requests")
          .select("amount_hold")
          .eq("redeem_id", targetId);
       
       
        if (error) {
          console.error("Error updating redeem request:", error);
        }
        
       
        const newAmountHold =
          Number(amount || 0) -
          Number(
            amountHoldData?.[0]?.amount_hold === 0
              ? 0
              : amountHoldData?.[0]?.amount_hold || 0
          );
       

        const { error: updateError } = await supabase
          .from("redeem_requests")
          .update({ amount_hold: newAmountHold })
          .eq("redeem_id", targetId);
       
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
 
  
  const allowedEnts = teamsFromEnts.map((ent: string) => ent.toUpperCase());
 

  const filteredData =
    selectedTeam === "ALL"
      ? tableData.filter((row) => allowedEnts.includes(row.team))
      : tableData.filter(
          (row) => row.team.toUpperCase() === selectedTeam.toUpperCase()
        );


  // Calculate page count - different logic for search vs normal pagination
  const pageCount = Math.ceil(filteredData?.length / limit); // Use filtered data count (client-side pagination)

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
                  <div className="space-y-6">
                    {/* Main Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          Basic Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Team</span>
                            <span className="text-white font-medium">
                              {selectedRow.teams?.team_code || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Depositor</span>
                            <span className="text-white font-medium">
                              {selectedRow.players?.fullname || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Recharge ID</span>
                            <span className="text-blue-400 font-mono text-sm">
                              {selectedRow.recharge_id || "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Transaction Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Platform</span>
                            <span className="text-white font-medium">
                              {selectedRow.games?.game_name || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Payment Method</span>
                            <span className="text-white font-medium">
                              {selectedRow.payment_methods?.payment_method || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Amount</span>
                            <span className="text-green-400 font-bold text-lg">
                              {selectedRow.amount ? `$${selectedRow.amount}` : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                        Timeline
                      </h3>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="text-white font-medium">Request Created</div>
                          <div className="text-gray-400 text-sm">
                            {selectedRow.created_at
                              ? new Date(selectedRow.created_at).toLocaleString()
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Upload Section */}
                    {shouldShowScreenshotUpload && (
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          Screenshots
                        </h3>

                        {/* Show existing screenshots if any */}
                        {selectedRow.screenshot_url &&
                          selectedRow.screenshot_url?.length > 0 && (
                            <div className="mb-6">
                              <div className="text-sm text-gray-400 mb-3 font-medium">
                                Existing Screenshots
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {selectedRow.screenshot_url.map((url, idx) => (
                                  <div
                                    key={idx}
                                    className="group relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200"
                                  >
                                    <img
                                      src={url}
                                      alt={`screenshot-${idx}`}
                                      className="object-cover w-full h-32 group-hover:scale-105 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200"></div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                      <div className="text-xs text-white font-medium">
                                        Screenshot {idx + 1}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                          <UploadImages
                            ref={uploadImagesRef}
                            bucket="recharge-requests-screenshots"
                            numberOfImages={5}
                            showUploadButton={false}
                            onUpload={(urls) => {
                            }}
                          />
                        </div>
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

              {RechargeProcessStatus.SUPPORT === selectedRow?.process_status && (
                <>
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
              </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </UserActivityLayout>
    </PrivateRoute>
  );
};

export default RechargeTab;
