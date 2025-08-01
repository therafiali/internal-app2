import { supabase } from "~/hooks/use-auth";
import { RechargeProcessStatus } from "~/lib/constants";

export async function assignRedeemToRecharge({
  rechargeId,
  redeemId,
  amountHold,
  rechargeAmount,
}: {
  rechargeId: string;
  redeemId: string;
  amountHold: number;
  rechargeAmount: number;
}) {
  // Update the recharge request (deposit request) to assign it to the redeem
  const { error } = await supabase
    .from("recharge_requests")
    .update({
      process_status: RechargeProcessStatus.SUPPORT,
      target_id: redeemId,
      ct_type: "pt",
      updated_at: new Date().toISOString(),
    })
    .eq("id", rechargeId)
    .select();

  if (error) {
    throw new Error(`Error assigning redeem: ${error.message}`);
  }

  const newAmountHold = Number(amountHold || 0) + Number(rechargeAmount);

  const { data: redeemData, error: redeemError } = await supabase
    .from("redeem_requests")
    .update({
      amount_hold: newAmountHold,
    })
    .eq("redeem_id", redeemId)
    .select();

  if (redeemError) {
    throw new Error(`Error updating redeem: ${redeemError.message}`);
  }

  return redeemData;
}
