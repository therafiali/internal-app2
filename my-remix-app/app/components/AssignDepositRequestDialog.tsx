import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { RechargeRequest } from "../hooks/api/queries/useFetchRechargeRequests";
import { Zap } from "lucide-react";
import { useFetchCompanyTags } from "~/hooks/api/queries/useFetchCompanytags";
import {
  getStatusName,
  RechargeProcessStatus,
  RedeemProcessStatus,
} from "~/lib/constants";
import { useAssignCompanyTag } from "~/hooks/api/mutations/useAssignCompanyTag";
import { useAuth } from "~/hooks/use-auth";
import { useFetchRedeemRequests } from "~/hooks/api/queries/useFetchRedeemRequests";
import {
  useFetchPlayerPaymentMethodDetail,
  type PlayerPaymentMethod,
} from "~/hooks/api/queries/useFetchPlayerPaymentMethodDetail";
import { supabase } from "~/hooks/use-auth";
import { toast } from "sonner";

interface AssignDepositRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRow: RechargeRequest | null;
  onSuccess?: () => void;
}

interface RedeemWithPaymentMethods {
  redeemId: string;
  redeemUserName: string;
  redeemAmount: number;
  redeemHoldAmount: number;
  redeemAvailable: number;
  redeemPaymentMethod: string | null | undefined;
  playerPaymentMethods: PlayerPaymentMethod[];
  id: string;
}

export default function AssignDepositRequestDialog({
  open,
  onOpenChange,
  selectedRow,
  onSuccess,
}: AssignDepositRequestDialogProps) {
  const {
    data: companyTags,
    isLoading: companyTagsLoading,
    error: companyTagsError,
  } = useFetchCompanyTags();
  const {
    data: redeemRequests,
    isLoading: redeemRequestsLoading,
    error: redeemRequestsError,
  } = useFetchRedeemRequests(RedeemProcessStatus.OPERATION);
  const assignCompanyTagMutation = useAssignCompanyTag();
  const [loading, setLoading] = useState(false);
  const [redeemWithPaymentMethods, setRedeemWithPaymentMethods] = useState<
    RedeemWithPaymentMethods[]
  >([]);
  const { user } = useAuth();

  console.log("Company Tags Data:", companyTags);
  console.log("Company Tags Loading:", companyTagsLoading);
  console.log("Company Tags Error:", companyTagsError);

  const tableData = companyTags?.map((tag) => ({
    tagId: tag.tag_id,
    tagName: tag.tag,
    tagBalance: tag.balance,
    payment_method: tag.payment_method || "-",
  }));
  console.log("tableData Row:", tableData);

  // Filter by payment method - make it more flexible
  const filteredTableData = tableData?.filter((tag) => {
    const selectedPaymentMethod = selectedRow?.payment_methods?.payment_method;
    const tagPaymentMethod = tag.payment_method;

    // If no payment method filter, show all tags
    if (!selectedPaymentMethod) return true;

    // Case-insensitive comparison
    return (
      tagPaymentMethod.toLowerCase() === selectedPaymentMethod.toLowerCase()
    );
  });

  // Fetch player payment methods for each redeem request
  useEffect(() => {
    const fetchPlayerPaymentMethods = async () => {
      if (!redeemRequests) return;

      const redeemWithMethods = await Promise.all(
        redeemRequests.map(async (redeem) => {
          try {
            // Fetch player payment methods for this redeem request
            const { data: playerPaymentMethods, error } = await supabase
              .from("player_payment_methods")
              .select(
                `
                                *,
                                payment_methods:payment_method (
                                    id,
                                    payment_method
                                )
                            `
              )
              .eq("player_id", redeem.player_id);

            if (error) {
              console.error("Error fetching player payment methods:", error);
              return {
                redeemId: redeem.redeem_id,
                redeemUserName: redeem.players?.firstname || "Unknown",
                redeemAmount: redeem.total_amount,
                redeemHoldAmount: redeem.amount_hold || 0,
                redeemAvailable: redeem.amount_available || 0,
                redeemPaymentMethod: redeem.payment_methods?.payment_method,
                playerPaymentMethods: [],
                id: redeem.id,
              };
            }

            return {
              redeemId: redeem.redeem_id,
              redeemUserName: redeem.players?.firstname || "Unknown",
              redeemAmount: redeem.total_amount,
              redeemHoldAmount: redeem.amount_hold || 0,
              redeemAvailable: redeem.amount_available || 0,
              redeemPaymentMethod: redeem.payment_methods?.payment_method,
              playerPaymentMethods:
                playerPaymentMethods as PlayerPaymentMethod[],
              id: redeem.id,
            };
          } catch (error) {
            console.error("Error processing redeem request:", error);
            return {
              redeemId: redeem.redeem_id,
              redeemUserName: redeem.players?.firstname || "Unknown",
              redeemAmount: redeem.total_amount,
              redeemHoldAmount: redeem.amount_hold || 0,
              redeemAvailable: redeem.amount_available || 0,
              redeemPaymentMethod: redeem.payment_methods?.payment_method,
              playerPaymentMethods: [],
              id: redeem.id,
            };
          }
        })
      );

      setRedeemWithPaymentMethods(redeemWithMethods);
    };

    fetchPlayerPaymentMethods();
  }, [redeemRequests]);

  const filteredRedeemTableData = redeemWithPaymentMethods?.filter((redeem) => {
    const selectedPaymentMethod = selectedRow?.payment_methods?.payment_method;
    const selectedAmount = selectedRow?.amount;
    const redeemAmount = redeem.redeemAmount;

    console.log("selectedAmount", selectedAmount);
    console.log("redeemAmount", redeemAmount);

    // If no payment method filter, show all redeem requests
    if (!selectedPaymentMethod) return true;

    // Check if the redeem request's payment method matches the selected payment method
    const redeemPaymentMethod = redeem.redeemPaymentMethod;
    const matchesRedeemPaymentMethod =
      redeemPaymentMethod?.toLowerCase() ===
      selectedPaymentMethod?.toLowerCase();

    // Also check if any of the player's payment methods match the selected payment method
    const matchesPlayerPaymentMethod = redeem.playerPaymentMethods?.some(
      (method) =>
        method.payment_methods?.payment_method?.toLowerCase() ===
        selectedPaymentMethod?.toLowerCase()
    );

    const matchesAmount = Number(selectedAmount) <= Number(redeemAmount);

    console.log("Filtering redeem:", {
      redeemId: redeem.redeemId,
      selectedPaymentMethod,
      redeemPaymentMethod,
      playerPaymentMethods: redeem.playerPaymentMethods?.map(
        (m) => m.payment_methods?.payment_method
      ),
      matchesRedeemPaymentMethod,
      matchesPlayerPaymentMethod,
      shouldShow:
        matchesRedeemPaymentMethod ||
        matchesPlayerPaymentMethod ||
        matchesAmount,
    });

    // Show if either the redeem payment method or any player payment method matches
    return (
      (matchesRedeemPaymentMethod || matchesPlayerPaymentMethod) && matchesAmount
    );
  });

  console.log("Selected Payment Method:", redeemRequests);
  console.log("Filtered Table Data:", filteredTableData);
  console.log("Redeem with Payment Methods:", redeemWithPaymentMethods);

  const handleAssign = async (
    targetId: string,
    targetType: "redeem" | "ct"
  ) => {
    console.log("=== ASSIGNMENT START ===");
    console.log("Selected Row:", selectedRow);
    console.log("Target ID:", targetId);
    console.log("Target Type:", targetType);

    if (!selectedRow) {
      console.error("No selected row found");
      return;
    }

    if (!selectedRow.id) {
      console.error("Selected row has no ID");
      return;
    }

    setLoading(true);

    try {
      if (targetType === "ct") {
        console.log("Calling assignCompanyTag mutation with:", {
          recharge_id: selectedRow.id,
          tag_id: targetId,
        });

        // Use the mutation properly
        const result = await assignCompanyTagMutation.mutateAsync({
          recharge_id: selectedRow.id,
          tag_id: targetId,
          user_id: user?.id || "", // Pass user_id to the mutation
        });

        console.log("Mutation result:", result);
        console.log(
          `Successfully assigned recharge ${selectedRow.id} to CT tag ${targetId}`
        );

        // Close dialog and call success callback
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle redeem assignment (mock for now)
        console.log(
          `Assigning recharge ${selectedRow.id} to redeem ${targetId}`
        );
        // TODO: Implement redeem assignment logic
      }
    } catch (error) {
      console.error("Error assigning company tag:", error);
      // You might want to show an error toast here
      alert(
        `Error assigning: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
      console.log("=== ASSIGNMENT END ===");
    }
  };

  const handleRedeemAssign = async (redeemId: string) => {
    console.log("=== REDEEM ASSIGNMENT START ===");
    console.log("Selected Row:", selectedRow);
    console.log("Redeem ID:", redeemId);

    if (!selectedRow) {
      console.error("No selected row found");
      toast.error("No selected row found");
      return;
    }

    if (!selectedRow.id) {
      console.error("Selected row has no ID");
      toast.error("Selected row has no ID");
      return;
    }

    setLoading(true);

    try {
      // Update the recharge request (deposit request) to assign it to the redeem
      const { data, error } = await supabase
        .from("recharge_requests")
        .update({
          process_status: RechargeProcessStatus.SUPPORT,
          target_id: redeemId,
          ct_type: "pt",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedRow.id)
        .select();

      if (error) {
        console.error("Error assigning redeem:", error);
        toast.error(`Error assigning redeem: ${error.message}`);
        return;
      }

      console.log("Redeem assigned successfully:", data);
      toast.success(
        `Successfully assigned recharge ${selectedRow.id} to redeem ${redeemId}`
      );

      // Close dialog and call success callback
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error in redeem assignment:", error);
      toast.error(
        `Failed to assign redeem: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
      console.log("=== REDEEM ASSIGNMENT END ===");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#23272f] border border-gray-700 text-gray-200 max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <div>
              <DialogTitle className="text-white text-lg font-semibold">
                Assign Deposit Request
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Select a withdrawal request or company tag to assign.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Deposit Request Details */}
        {selectedRow && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-white font-medium mb-3">
              Deposit Request Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Recharge ID:</span>
                <span className="text-white ml-2">
                  {selectedRow.recharge_id || "-"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Amount:</span>
                <span className="text-green-500 ml-2">
                  ${selectedRow.amount || "-"}
                </span>
              </div>

              <div>
                <span className="text-gray-400">Created At:</span>
                <span className="text-white ml-2">
                  {selectedRow.created_at
                    ? new Date(selectedRow.created_at).toLocaleString()
                    : "-"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Player Payment Method:</span>
                <span className="text-white ml-2">
                  {selectedRow.payment_methods?.payment_method || "-"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="redeem" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger
              value="redeem"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Redeem Queue
            </TabsTrigger>
            <TabsTrigger
              value="ct"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              CT Tags
            </TabsTrigger>
          </TabsList>

          {/* Redeem PT Tab Content */}
          <TabsContent value="redeem" className="mt-4">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {redeemRequestsLoading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400">
                    Loading redeem requests...
                  </div>
                </div>
              ) : redeemRequestsError ? (
                <div className="p-8 text-center">
                  <div className="text-red-400">
                    Error loading redeem requests: {redeemRequestsError.message}
                  </div>
                </div>
              ) : !filteredRedeemTableData ||
                filteredRedeemTableData.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400">
                    No redeem requests available
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          REDEEM ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          USER NAME
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          AMOUNT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          HOLD AMOUNT
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          PAYMENT METHODS
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredRedeemTableData?.map((redeem) => (
                        <tr key={redeem.redeemId} className="hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm text-white">
                            {redeem.redeemId}
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {redeem.redeemUserName}
                          </td>
                          <td className="px-4 py-3 text-sm text-green-500">
                            ${redeem.redeemAmount}
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-500">
                            ${redeem.redeemHoldAmount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            <div className="space-y-1">
                              {/* Show the original payment method from redeem request */}
                              {redeem.redeemPaymentMethod && (
                                <div className="text-blue-400">
                                  Request: {redeem.redeemPaymentMethod}
                                </div>
                              )}
                              {/* Show player's payment methods */}
                              {redeem.playerPaymentMethods &&
                              redeem.playerPaymentMethods.length > 0 ? (
                                <div className="text-xs">
                                  {redeem.playerPaymentMethods.map((method) => (
                                    <div
                                      key={method.id}
                                      className="text-gray-400"
                                    >
                                      {method.payment_methods?.payment_method ||
                                        "Unknown"}
                                      {method.tag_name &&
                                        ` (${method.tag_name})`}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-red-400 text-xs">
                                  No payment methods found
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleRedeemAssign(redeem.redeemId)
                              }
                              disabled={loading}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              {loading ? "Assigning..." : "Assign"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* CT Tab Content */}
          <TabsContent value="ct" className="mt-4">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {companyTagsLoading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400">Loading company tags...</div>
                </div>
              ) : companyTagsError ? (
                <div className="p-8 text-center">
                  <div className="text-red-400">
                    Error loading company tags: {companyTagsError.message}
                  </div>
                </div>
              ) : !tableData || tableData.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400">No company tags available</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          CASHTAG
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          NAME
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          BALANCE
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          PAYMENT METHOD
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredTableData?.map((tag) => (
                        <tr key={tag.tagId} className="hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm text-white">
                            {tag.tagId}
                          </td>
                          <td className="px-4 py-3 text-sm text-white">
                            {tag.tagName}
                          </td>

                          <td className="px-4 py-3 text-sm text-green-500">
                            ${tag.tagBalance}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {tag.payment_method || "-"}
                          </td>

                          <td className="px-4 py-3 text-sm">
                            <Button
                              size="sm"
                              onClick={() => handleAssign(tag.tagId, "ct")}
                              disabled={
                                loading || assignCompanyTagMutation.isPending
                              }
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              {assignCompanyTagMutation.isPending
                                ? "Assigning..."
                                : "Assign"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
