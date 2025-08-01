import { useQuery } from "@tanstack/react-query";
import { supabase } from "~/hooks/use-auth";

export interface PlayerPaymentMethod {
  id: string;
  player_id: string;
  payment_method: string;
  tag_id?: string;
  tag_name?: string;
  qr_code?: string;
  payment_methods: {
    id: string;
    payment_method: string;
  };
}

async function fetchPlayerPaymentMethodDetail(playerId: string) {
  if (!playerId) return null;

  const { data, error } = await supabase
    .from("player_payment_methods")
    .select(
      `
            *,
            payment_method:payment_method (
                id,
                payment_method
            )
        `
    )
    .eq("player_id", playerId);
  
  if (error) throw error;

  return data as PlayerPaymentMethod[];
}

export function useFetchPlayerPaymentMethodDetail(playerId: string) {
  return useQuery({
    queryKey: ["player-payment-method-detail", playerId],
    queryFn: () => fetchPlayerPaymentMethodDetail(playerId),
    enabled: !!playerId,
  });
}
