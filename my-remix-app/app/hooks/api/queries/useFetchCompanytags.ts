import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';

export interface CompanyTag {
  id: string;
  tag_id: string;
  tag: string;
  payment_method: string;
  balance: string;
  qr_code: string;
  // Add other fields as needed
}

async function fetchCompanyTags(): Promise<CompanyTag[]> {
  const { data, error } = await supabase
    .from('company_tags')
    .select('*');
  console.log(data, 'data');
  if (error) throw error;
  return data as CompanyTag[];
}

export function useFetchCompanyTags() {
  return useQuery<CompanyTag[], Error>({
    queryKey: ['company-tags'],
    queryFn: fetchCompanyTags,
  });
} 