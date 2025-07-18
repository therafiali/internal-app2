import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';
import { RechargeProcessStatus } from '~/lib/constants';

export interface RechargeRequest {
  id: string;
  recharge_id?: string;
  payment_method: string;
  amount?: number;
  created_at?: string;
  process_status?: string;
  screenshot_url?: string[] | null;
  players?: {
    firstname?: string;
    lastname?: string;
  };
  payment_methods?: {
    payment_method?: string;
  };
  teams?: {
    page_name?: string;
    team_code?: string;
  };
  games?: {
    game_name?: string;
  };
  // Add other fields as needed
}

async function fetchRechargeRequests(process_status: RechargeProcessStatus, limit?: number, offset?: number): Promise< RechargeRequest[]> {
  let query = supabase
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
        page_name,
        team_code
    
        
      ),
      games:game_id(
      game_name
      )
    `)
    .eq('process_status', process_status);
  
  if (limit !== undefined) {
    query = query.limit(limit);
  }
  
  if (offset !== undefined) {
    query = query.range(offset, offset + (limit || 10) - 1);
  }
  
  const { data, error } = await query;
  console.log(data, 'data');
  // 
  if (error) throw error;
  return data as RechargeRequest[];
}

async function fetchRechargeRequestsCount(process_status: RechargeProcessStatus): Promise<number> {
  const { count, error } = await supabase
    .from('recharge_requests')
    .select('*', { count: 'exact', head: true })
    .eq('process_status', process_status);
  
  if (error) throw error;
  return count || 0;
}






async function fetchRechargeRequestsMultiple(process_status: RechargeProcessStatus[]): Promise< RechargeRequest[]> {
  const { data, error } = await supabase
    .from('recharge_requests')
    .select(`
      *,
      players:player_id (
        firstname,
        lastname,
         
         teams:  team_id (
          team_code
        )
      ),
      payment_methods:payment_method_id (
        payment_method
      ),
      games:game_id (
        game_name
      ),
      teams:team_id (
        page_name,
        team_code
      )

    `)
    .in('process_status', process_status)
  console.log(data, 'data');
  // 
  if (error) throw error;
  return data as RechargeRequest[];
}

export function useFetchRechargeRequests(process_status: RechargeProcessStatus, limit?: number, offset?: number) {
  return useQuery<RechargeRequest[], Error>({
    queryKey: ['recharge_requests', process_status, limit, offset],
    queryFn: () => fetchRechargeRequests(process_status, limit, offset),
  });
} 

export function useFetchRechargeRequestsCount(process_status: RechargeProcessStatus) {
  return useQuery<number, Error>({
    queryKey: ['recharge_requests_count', process_status],
    queryFn: () => fetchRechargeRequestsCount(process_status),
  });
}


export function useFetchRechargeRequestsMultiple(process_status: RechargeProcessStatus[]) {
  return useQuery<RechargeRequest[], Error>({
    queryKey: ['recharge_requests_multiple', process_status],
    queryFn: () => fetchRechargeRequestsMultiple(process_status),
  });
} 

