import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Button } from "./ui/button";
import { useFetchPlayerPaymentMethodDetail } from "../hooks/api/queries/useFetchPlayerPaymentMethodDetail";
import {
  useFetchCompanyTags,
  CompanyTag,
} from "../hooks/api/queries/useFetchCompanytags";
import { useHoldRedeem } from "../hooks/api/mutations/useHoldRedeem";
import { supabase, useAuth } from "../hooks/use-auth";

// RowType should match the one in finance.redeem.$tab.tsx
export type RowType = {
  id: string;
  pendingSince: string;
  teamCode: string;
  redeemId: string;
  platform: string;
  user: string;
  initBy: string;
  totalAmount: string;
  paidAmount: string;
  holdAmount: string;
  remainingAmount: string;
  availableToHold: string;
  paymentMethod: string;
};

interface RedeemProcessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRow: RowType | null;
  onSuccess?: () => void;
}

export default function RedeemProcessModal({
  open,
  onOpenChange,
  selectedRow,
  onSuccess,
}: RedeemProcessModalProps) {
  const { user } = useAuth();
  // Step management
  const [step, setStep] = useState(0);

  // Step 1: Amount
  const [holdAmount, setHoldAmount] = useState("");
  const [amountError, setAmountError] = useState("");

  // Step 2: Payment method & cashtag
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [selectedCashtag, setSelectedCashtag] = useState("");
  // const [identifier, setIdentifier] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentError, setPaymentError] = useState("");

  console.log("selectedPaymentMethod", selectedPaymentMethod);
  console.log("selectedCashtag", selectedCashtag);
  console.log("selectedRow", selectedRow?.player_id);
  // Step 3: Confirmation
  const [confirmInput, setConfirmInput] = useState("");

  // Fetch payment methods and cashtags for the user (player)
  // For demo, assume selectedRow.id is player_id (adjust as needed)
  const playerId = selectedRow?.player_id || "";
  const { data: playerPaymentMethodsRaw } =
    useFetchPlayerPaymentMethodDetail(playerId);
  const playerPaymentMethods = playerPaymentMethodsRaw ?? [];
  const { data: cashtags } = useFetchCompanyTags();

  console.log("playerPaymentMethods", playerPaymentMethods);

  const playerPaymentMethodsMap = playerPaymentMethods.map((pm) =>
    (pm.payment_method?.payment_method || pm.payment_method)
  );

  console.log("playerPaymentMethodsMap", playerPaymentMethodsMap);

  console.log("cashtags", cashtags);
  console.log("selectedPaymentMethod", selectedPaymentMethod);
  console.log("playerPaymentMethods", playerPaymentMethods);

  const holdRedeemMutation = useHoldRedeem();

  // Reset state when modal opens/closes or row changes
  useEffect(() => {
    if (!open) {
      setStep(0);
      setHoldAmount("");
      setAmountError("");
      setSelectedPaymentMethod("");
      setSelectedCashtag("");
      // setIdentifier("");
      setNotes("");
      setPaymentError("");
      setConfirmInput("");
    }
  }, [open, selectedRow]);

  // Step 1 validation
  const maxHold = selectedRow
    ? Number(selectedRow.availableToHold.replace(/[^\d.]/g, ""))
    : 0;

  const previousHoldAmount = selectedRow
    ? Number(selectedRow.holdAmount.replace(/[^\d.]/g, ""))
    : 0;

  const currentHoldAmount =
    Number(previousHoldAmount || 0) + Number(holdAmount || 0);

  console.log("selectedRow", selectedRow);

  const handleNextFromAmount = async () => {
    const amt = Number(holdAmount);
    if (!holdAmount || isNaN(amt) || amt <= 0) {
      setAmountError("Enter a valid amount");
      return;
    }
    if (amt > maxHold) {
      setAmountError(`Amount cannot exceed $${maxHold}`);
      return;
    }

    const { error: redeemError } = await supabase
      .from("redeem_requests")
      .update({
        amount_hold: currentHoldAmount,
      })
      .eq("redeem_id", selectedRow?.redeemId)
      .select();

    if (redeemError) {
      throw new Error(`Error updating redeem: ${redeemError.message}`);
    }

    setAmountError("");
    setStep(1);
  };

  // Step 2 validation
  const handleNextFromPayment = () => {
    if (!selectedPaymentMethod) {
      setPaymentError("Select a payment method");
      return;
    }
    if (!selectedCashtag) {
      setPaymentError("Select a cashtag");
      return;
    }
    // if (!identifier) {
    //   setPaymentError("Enter payment identifier");
    //   return;
    // }
    setPaymentError("");
    setStep(2);
  };

  // Step 3 validation (confirmation)
  const handleConfirm = async () => {
    if (confirmInput !== "process" || !selectedRow) return;

    try {
      // First, reset the process status to 'idle' since we're completing the operation
      await supabase
        .from("redeem_requests")
        .update({
          finance_redeem_process_status: "idle",
          finance_redeem_process_by: null,
          finance_redeem_process_at: null,
        })
        .eq("id", selectedRow.id);

      // Then proceed with the hold redeem mutation
      holdRedeemMutation.mutate(
        {
          redeemId: selectedRow.redeemId,
          holdAmount: Number(holdAmount),
          paymentMethod: selectedPaymentMethod,
          cashtag: selectedCashtag,
          // identifier,
          notes,
          user_id: user?.id || "",
        },
        {
          onSuccess: () => {
            if (onSuccess) onSuccess();
            onOpenChange(false);
          },
        }
      );
    } catch (error) {
      console.error("Error resetting process status:", error);
    }
  };

  // Add these lookups before the return statement
  const selectedPaymentMethodObj = playerPaymentMethods.find(
    (pm) =>
      pm.payment_method?.payment_method === selectedPaymentMethod ||
      pm.payment_method === selectedPaymentMethod
  );
  const selectedCashtagObj = (cashtags as CompanyTag[])?.find(
    (tag) => tag.tag_id === selectedCashtag
  );

  // UI for each step
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#181A20] border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === 0 && "Enter Amount"}
            {step === 1 && "Payment Details"}
            {step === 2 && "Confirm Process"}
          </DialogTitle>
        </DialogHeader>
        {/* Stepper indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                step === i ? "bg-blue-500" : "bg-gray-700"
              }`}
            ></div>
          ))}
        </div>
        {/* Step 1: Enter Amount */}
        {/* {step === 0 && selectedRow && ( */}
        <div className="space-y-6">
          <div className="bg-[#23272f] rounded-lg p-4 border border-gray-700">
            <div className="mb-2 text-sm text-gray-400 font-semibold">
              Amount Details
            </div>
            <div className="space-y-1 text-base">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">{selectedRow?.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount:</span>
                <span>{selectedRow?.paidAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Hold Amount:</span>
                <span>{selectedRow?.holdAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Available Amount:</span>
                <span>{selectedRow?.availableToHold}</span>
              </div>
            </div>
          </div>

          {step === 0 && (
            <>
              <div>
                <div className="mb-1 text-sm">
                  Enter Amount to Hold (Max: ${maxHold}):
                </div>
                <Input
                  type="number"
                  placeholder="Enter amount to process"
                  value={holdAmount}
                  onChange={(e) => setHoldAmount(e.target.value)}
                  min={0}
                  max={maxHold}
                  className="bg-[#23272f] border-gray-700 text-white"
                />
                {amountError && (
                  <div className="text-red-400 text-xs mt-1">{amountError}</div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextFromAmount}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Hold to Pay
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
        {/* )} */}
        {/* Step 2: Payment Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="mb-1 text-sm text-gray-400">
                User Payment Methods
              </div>
              <div className="bg-[#23272f] rounded px-3 py-2 mb-2 text-base">
                {playerPaymentMethods.length > 0 ? (
                  playerPaymentMethods.map((pm) => (
                    <div key={pm.id}>
                      {pm.payment_method?.payment_method}:{" "}
                      <span className="font-mono">
                        {pm.tag_name || pm.payment_method}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No payment methods</span>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm">Select Player Payment Method</div>
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger className="bg-[#23272f] border-gray-700 text-white">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {playerPaymentMethods.map((pm) => (
                    <SelectItem
                      key={pm.payment_method}
                      value={
                        pm.payment_method?.payment_method || pm.payment_method
                      }
                    >
                      {pm.payment_method?.payment_method} -{" "}
                      {pm.tag_name || pm.payment_method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-sm">Select Company Tags</div>
              <Select
                value={selectedCashtag}
                onValueChange={setSelectedCashtag}
              >
                <SelectTrigger className="bg-[#23272f] border-gray-700 text-white">
                  <SelectValue placeholder="Select a cashtag" />
                </SelectTrigger>
                <SelectContent>
                  {(cashtags as CompanyTag[])
                    .filter(
                      (tag) =>
                        tag.payment_method.toLowerCase() ===
                        selectedPaymentMethod.toLowerCase()
                    )
                    .map((tag) => (
                      <SelectItem key={tag.tag_id} value={tag.tag_id}>
                        {tag.tag} - {tag.payment_method}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* <div>
              <div className="mb-1 text-sm">Identifier</div>
              <Input
                placeholder="Enter payment identifier..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="bg-[#23272f] border-gray-700 text-white"
              />
            </div> */}
            {/* <div>
              <div className="mb-1 text-sm">Notes</div>
              <textarea
                placeholder="Enter any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-[#23272f] border border-gray-700 rounded text-white min-h-[60px]"
              />
            </div> */}
            {paymentError && (
              <div className="text-red-400 text-xs mt-1">{paymentError}</div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep(0)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleNextFromPayment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        )}
        {/* Step 3: Confirm Process */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-[#23272f] rounded-lg p-4 border border-gray-700">
              <div className="mb-2 text-sm text-gray-400 font-semibold">
                Review Details
              </div>
              <div className="space-y-1 text-base">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-bold">${holdAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span>
                    {selectedPaymentMethodObj
                      ? selectedPaymentMethodObj.payment_method?.payment_method
                      : selectedPaymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cashtag:</span>
                  <span>
                    {selectedCashtagObj
                      ? `${selectedCashtagObj.tag} - ${selectedCashtagObj.payment_method}`
                      : selectedCashtag}
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span>Identifier:</span>
                  <span>{identifier}</span>
                </div> */}
                {notes && (
                  <div className="flex justify-between">
                    <span>Notes:</span>
                    <span>{notes}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="mb-1 text-sm">
                Type &quot;process&quot; to confirm
              </div>
              <Input
                placeholder="Type 'process' to enable confirmation..."
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                className="bg-[#23272f] border-gray-700 text-white"
              />
            </div>
            {holdRedeemMutation.isError && (
              <div className="text-red-400 text-xs mt-1">
                {(holdRedeemMutation.error as Error)?.message}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={holdRedeemMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={
                  confirmInput !== "process" || holdRedeemMutation.isPending
                }
              >
                {holdRedeemMutation.isPending
                  ? "Processing..."
                  : "Confirm Process"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
