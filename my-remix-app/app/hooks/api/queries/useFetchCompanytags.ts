import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';

export interface CompanyTag {
  id: string;
  name: string;
  // Add other fields as needed
}

async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('company_tags')
    .select('*');
  console.log(data, 'data');
  if (error) throw error;
  return data as PaymentMethod[];
}

export function useFetchPaymentMethods() {
  return useQuery<PaymentMethod[], Error>({
    queryKey: ['payment-methods'],
    queryFn: fetchPaymentMethods,
  });
} 