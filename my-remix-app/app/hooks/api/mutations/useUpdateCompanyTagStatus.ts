import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCompanyTagStatus } from '~/services/companytags.service';

export function useUpdateCompanyTagStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateCompanyTagStatus(id, status);
    },
    onSuccess: () => {
      // Invalidate the company-tags query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['company-tags'] });
    },
  });
} 