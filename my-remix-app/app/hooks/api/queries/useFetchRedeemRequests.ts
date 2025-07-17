  import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';
import { RechargeProcessStatus } from '~/lib/constants';

export interface RechargeRequest {
  id: string;
  payment_method: string;
  amount?: number;
  created_at?: string;
  players?: {
    firstname?: string;
    lastname?: string;
  };
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


async function fetchRedeemRequestsMultiple(process_statuses: string[]): Promise<RedeemRequest[]> {
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
    .in('process_status', process_statuses);
  console.log(data, 'redeem data multiple');
  if (error) throw error;
  return data as RedeemRequest[];
}

export function useFetchRedeemRequests(process_status: string) {
  return useQuery<RedeemRequest[], Error>({
    queryKey: ['redeem_requests', process_status],
    queryFn: () => fetchRedeemRequests(process_status),
  });
}

export function useFetchRedeemRequestsMultiple(process_statuses: string[]) {
  return useQuery<RedeemRequest[], Error>({
    queryKey: ['redeem_requests_multiple', process_statuses],
    queryFn: () => fetchRedeemRequestsMultiple(process_statuses),
  });
}

