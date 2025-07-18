import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignCompanyTag } from '~/services/assign-company-tags.service';



export function useAssignCompanyTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recharge_id, tag_id }: { recharge_id: string; tag_id: string }) => {
        console.log(recharge_id, tag_id, "calling assignCompanyTag");
      await assignCompanyTag(recharge_id, tag_id);
    },
    onSuccess: () => {
      // Invalidate the company-tags query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['company-tags'] });
      // Also invalidate recharge requests queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['recharge_requests'] });
      queryClient.invalidateQueries({ queryKey: ['recharge_requests_multiple'] });
    },
    onError: (error) => {
      console.error('Error in assignCompanyTag mutation:', error);
    }
  });
} 