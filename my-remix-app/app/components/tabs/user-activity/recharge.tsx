import React, { useState, useRef } from "react";
import UserActivityLayout from "./layout";
import { DynamicTable } from "~/components/shared/DynamicTable";
import { useNavigate } from "@remix-run/react";
import type { ColumnDef } from "@tanstack/react-table";
import PrivateRoute from "~/components/private-route";
import DynamicHeading from "~/components/shared/DynamicHeading";
import DynamicButtonGroup from "~/components/shared/DynamicButtonGroup";
import { getRechargeType, getStatusName, RechargeProcessStatus } from "~/lib/constants";
import { useFetchRechargeRequests, useFetchRechargeRequestsMultiple, type RechargeRequest } from "~/hooks/api/queries/useFetchRechargeRequests";
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
import UploadImages, { type UploadImagesRef } from "~/components/shared/UploadImages";

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
  actions: React.ReactNode;
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
      return [RechargeProcessStatus.SUPPORT, RechargeProcessStatus.VERIFICATION, RechargeProcessStatus.OPERATION];
    } else if (pathname.includes('/recharge/live')) {
      return [RechargeProcessStatus.FINANCE];
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
  const [selectedRow, setSelectedRow] = useState<RechargeRequest | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const uploadImagesRef = useRef<UploadImagesRef>(null);
  
  const tableData: Row[] = (data || []).map((item) => ({
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
    type: "CT", // Default type since it's not in the interface

    targetId: "N/A", // Default since target_id is not in the interface
    timeElapsed: item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "-",
    depositStatus: "Pending", // Add missing depositStatus
    loadStatus: getRechargeType(item.process_status || "") || "N/A",  


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
    newStatus: RechargeProcessStatus,
    screenshotUrls?: string[]
  ) {
    const updateData: any = { process_status: newStatus };
    
    // Add screenshot URLs if provided
    if (screenshotUrls && screenshotUrls.length > 0) {
      updateData.screenshot_url = screenshotUrls;
    }
    
    const { error } = await supabase
      .from("recharge_requests")
      .update(updateData)
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

  // Check if screenshot upload should be shown
  const shouldShowScreenshotUpload = selectedRow?.process_status === RechargeProcessStatus.SUPPORT;

  // Handle process button click
  const handleProcess = async () => {
    if (!selectedRow) return;
    
    setIsProcessing(true);
    
    try {
      let uploadedUrls: string[] = [];
      
      // Upload screenshots if files are selected
      if (uploadImagesRef.current?.selectedFiles.length) {
        uploadedUrls = await uploadImagesRef.current.uploadFiles();
        setScreenshots(uploadedUrls);
        console.log("Screenshots uploaded:", uploadedUrls);
      }


      const newStatus = selectedRow.ct_type === 'ct' ? RechargeProcessStatus.FINANCE_CONFIRMED : RechargeProcessStatus.VERIFICATION;

      // Update recharge status and save screenshot URLs
      await updateRechargeStatus(
        selectedRow.id,
        newStatus,
        uploadedUrls
      );

      setModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error processing recharge:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PrivateRoute toDepartment="support">
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
          limit={50}
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
                      <b>Team:</b> {selectedRow.teams?.team_code || "-"}
                    </div>
                    <div>
                      <b>Init By:</b> Agent
                    </div>
                    <div>
                      <b>Depositor:</b> {selectedRow.players
                        ? `${selectedRow.players.firstname || ""} ${selectedRow.players.lastname || ""}`.trim()
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
                        ? `${selectedRow.players.firstname || ""} ${selectedRow.players.lastname || ""
                          }`.trim()
                        : "-"}
                    </div>
                    <div>
                      <b>Payment Method:</b> {selectedRow.payment_methods?.payment_method || "-"}
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
                        <h4 className="font-semibold mb-2">Submit Screenshots</h4>
                        
                        {/* Show existing screenshots if any */}
                        {selectedRow.screenshot_url && selectedRow.screenshot_url.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-gray-400 mb-2">Existing Screenshots:</div>
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
                            setScreenshots(urls);
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
              <Button variant="destructive" onClick={() => setModalOpen(false)}>
                Reject
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
