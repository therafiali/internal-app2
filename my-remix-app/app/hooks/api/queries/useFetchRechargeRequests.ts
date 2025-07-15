import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';
import { RechargeProcessStatus } from '~/lib/constants';

export interface RechargeRequest {
  id: string;
  payment_method: string;
  // Add other fields as needed
}

async function fetchRechargeRequests(process_status: RechargeProcessStatus): Promise< RechargeRequest[]> {
  const { data, error } = await supabase
    .from('recharge_requests')
    .select(`
      *,
      players:player_id (
        firstname,
        lastname
      ),
      payment_methods:payment_method_id (
        payment_method
      ),
      teams:team_id (
        page_name
      )
    `)
    .eq('process_status', process_status)
  console.log(data, 'data');
  if (error) throw error;
  return data as RechargeRequest[];
}

export function useFetchRechargeRequests(process_status: RechargeProcessStatus) {
  return useQuery<RechargeRequest[], Error>({
    queryKey: ['recharge_requests', process_status],
    queryFn: () => fetchRechargeRequests(process_status),
  });
} 