import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../use-auth';
import { RedeemProcessStatus } from '~/lib/constants';
import { generateCustomID } from '~/lib/utils';

export interface RedeemRequestData {
  player_id: string;
  team_id: string;
  game_id: string;
  amount: number;
  payment_methods_id?: string;
  player_platfrom_username_id?: string;
  notes?: string;
  target_id?: string;
  screenshots?: string[];
}

export interface RedeemRequest {
  id: string;
  redeem_id: string;
  player_id: string;
  team_id: string;
  game_id: string;
  total_amount: number;
  process_status: RedeemProcessStatus;
  notes?: string;
  target_id?: string;
  created_at: string;
  updated_at: string;
}

async function submitRedeemRequest(data: RedeemRequestData): Promise<RedeemRequest> {
  
  
  // First, let's check if the table exists and get its structure
  try {
    const { data: tableInfo, error: tableError } = await supabase
      .from('redeem_requests')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Table access error:', tableError);
      throw new Error(`Table access error: ${tableError.message}`);
    }
    
   
  } catch (tableCheckError) {
    console.error('Table check failed:', tableCheckError);
    throw new Error('Database table not accessible');
  }
  
  const redeemRequest = {
    redeem_id: generateCustomID("R"),
    player_id: data.player_id,
    team_id: data.team_id,
    game_id: data.game_id,
    total_amount: data.amount,
    // payment_methods_id: data.payment_methods_id,
    player_platfrom_username_id: data.player_platfrom_username_id,
    process_status: RedeemProcessStatus.OPERATION,
    notes: data.notes || "Redeem request submitted.",
    target_id: data.target_id,
    screenshots: data.screenshots,
  };



  try {
    const { data: result, error } = await supabase
      .from('redeem_requests')
      .insert([redeemRequest])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
    }

    if (!result) {
      throw new Error('No data returned from database insert');
    }

   
    return result as RedeemRequest;
  } catch (error) {
    console.error('Submit redeem request failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to submit redeem request');
  }
}

export function useSubmitRedeemRequest() {
  const queryClient = useQueryClient();

  return useMutation<RedeemRequest, Error, RedeemRequestData>({
    mutationFn: submitRedeemRequest,
    onMutate: async (variables) => {
      
    },
    onSuccess: (data) => {
     
      
      try {
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries({ queryKey: ['redeem_requests'] });
        queryClient.invalidateQueries({ queryKey: ['player'] });
        
        // Optionally add the new request to the cache
        queryClient.setQueryData(
          ['redeem_requests', RedeemProcessStatus.OPERATION],
          (oldData: RedeemRequest[] | undefined) => {
            
            if (oldData) {
              return [data, ...oldData];
            }
            return [data];
          }
        );
       
      } catch (cacheError) {
        console.error('Error updating cache:', cacheError);
      }
    },
    onError: (error, variables, context) => {
      console.error('Submit redeem request error:', error);
      console.error('Error variables:', variables);
      console.error('Error context:', context);
    },
  });
}
