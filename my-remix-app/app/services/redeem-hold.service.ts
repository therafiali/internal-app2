import { supabase } from "~/hooks/use-auth";

export interface HoldRedeemInput {
  redeemId: string;
  holdAmount: number;
  paymentMethod: string;
  cashtag: string;
  identifier: string;
  notes?: string;
}

export async function holdRedeemRequest({
  redeemId,
  holdAmount,
  paymentMethod,
}: HoldRedeemInput) {
  const { error } = await supabase
    .from("redeem_requests")
    .update({
      amount_hold: holdAmount,
      // payment_method: paymentMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("redeem_id", redeemId)
    .select();

  if (error) {
    throw new Error(`Error holding redeem: ${error.message}`);
  }

  return { success: true };
}
