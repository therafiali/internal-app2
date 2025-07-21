import { useMutation } from "@tanstack/react-query";
import {
  holdRedeemRequest,
  HoldRedeemInput,
} from "~/services/redeem-hold.service";

export function useHoldRedeem() {
  return useMutation({
    mutationFn: async (input: HoldRedeemInput) => {
      return holdRedeemRequest(input);
    },
  });
}
