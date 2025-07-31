import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

async function fetchPlayerPaymentMethodsUsingRedeemId(redeemId: string) {
  console.log(redeemId, "redeemId fetchPlayerPaymentMethodsUsingRedeemId");
  const { data: playerId, error } = await supabase
    .from("redeem_requests")
    .select("player_id")
    .eq("redeem_id", redeemId);
  console.log(playerId, "playerId fetchPlayerPaymentMethodsUsingRedeemId");
  if (error) throw error;

  const { data: playerPaymentMethods, error: playerPaymentMethodsError } =
    await supabase
      .from("player_payment_methods")
      .select(`
        tag_id,
        payment_method,
        payment_method: payment_method (payment_method)
        `)
      .eq("player_id", playerId[0].player_id);
      if (playerPaymentMethodsError) throw playerPaymentMethodsError;
      console.log(
        playerPaymentMethods,
        "playerPaymentMethods fetchPlayerPaymentMethodsUsingRedeemId data"
      );
  return playerPaymentMethods;
}

export function useFetchPlayerPaymentMethodsUsingRedeemId(redeemId: string) {
  return useQuery({
    queryKey: ["player-payment-methods", redeemId],
    queryFn: () => fetchPlayerPaymentMethodsUsingRedeemId(redeemId),
  });
}
