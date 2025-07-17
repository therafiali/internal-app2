import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';
// You may want to define a RedeemProcessStatus enum/type if needed, or use string
export interface RedeemRequest {
  id: string;
  redeem_id?: string;
  payment_methods?: { payment_method?: string };
  total_amount?: number;
  amount_paid?: number;
  amount_hold?: number;
  amount_available?: number;
  created_at?: string;
  players?: { firstname?: string; lastname?: string };
  teams?: { page_name?: string };
  process_status?: string;
  operation_redeem_process_status?: string;
  operation_redeem_process_by?: string;
  // Add other fields as needed
}
async function fetchRedeemRequests(process_status: string): Promise<RedeemRequest[]> {
  const { data, error } = await supabase
    .from('redeem_requests')
    .select(`
      *,
      players:player_id (
        firstname,
        lastname
      ),
      payment_methods:payment_methods_id (
        payment_method
      ),
      teams:team_id (
        page_name
      )
    `)
    .eq('process_status', process_status);
  console.log(data, 'redeem data');
  if (error) throw error;
  return data as RedeemRequest[];
}
export function useFetchRedeemRequests(process_status: string) {
  return useQuery<RedeemRequest[], Error>({
    queryKey: ['redeem_requests', process_status],
    queryFn: () => fetchRedeemRequests(process_status),
  });
}
