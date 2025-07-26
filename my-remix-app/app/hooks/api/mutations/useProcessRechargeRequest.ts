import { useMutation, useQueryClient } from "@tanstack/react-query";
import { processRechargeRequest } from "../../../services/recharge-process.service";

export function useProcessRechargeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processRechargeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recharge_requests"] });
      queryClient.invalidateQueries({ queryKey: ["redeem_requests"] });
    },
  });
}
