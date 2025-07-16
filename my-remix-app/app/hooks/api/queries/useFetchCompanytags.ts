import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';

export interface CompanyTag {
  id: string;
  tag_id: string;
  tag: string;
  payment_method: string;
  balance: string;
  qr_code: string;
  status: string;
  // Add other fields as needed
}

async function fetchCompanyTags(status?: string, paymentMethod?: string): Promise<CompanyTag[]> {
  let query = supabase
    .from('company_tags')
    .select('*, ...payment_methods(payment_method)').order('balance', { ascending: false });
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (paymentMethod && paymentMethod !== 'all') {
    query = query.eq('payment_method', paymentMethod);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as CompanyTag[];
}

export function useFetchCompanyTags(status?: string, paymentMethod?: string) {
  return useQuery<CompanyTag[], Error>({
    queryKey: ['company-tags', status, paymentMethod],
    queryFn: () => fetchCompanyTags(status, paymentMethod),
  });
} 