import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../use-auth';

export interface PaymentMethod {
  id: string;
  payment_method: string;
  // Add other fields as needed
}

async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
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