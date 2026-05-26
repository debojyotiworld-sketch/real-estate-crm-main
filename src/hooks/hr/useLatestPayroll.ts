import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLatestPayroll = (employeeId: string) => {
  const [latestPayroll, setLatestPayroll] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPayroll = async () => {
      if (!employeeId) return;
      
      try {
        setLoading(true);
        // Supabase query to get the latest single record for the specific employee
        const { data, error } = await supabase
          .from('employee_payrolls') 
          .select('*, employee:employees(*)')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching payroll:', error);
          throw error;
        }
        
        if (data) {
          setLatestPayroll(data);
        }
      } catch (error) {
        console.error('Failed to load latest payroll', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPayroll();
  }, [employeeId]);

  return { latestPayroll, loading };
};