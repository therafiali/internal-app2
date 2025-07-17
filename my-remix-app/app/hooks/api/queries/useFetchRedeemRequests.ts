  import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';
import { RedeemProcessStatus } from '~/lib/constants';

export interface RedeemRequest {
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


async function fetchRedeemRequests(process_status: string): Promise<RedeemRequest> {
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
      ),
      users:operation_redeem_process_by (
        name
      )
    `)
    .eq('process_status', process_status);
  console.log(data, 'redeem data multiple');
  if (error) throw error;
  return data;
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


