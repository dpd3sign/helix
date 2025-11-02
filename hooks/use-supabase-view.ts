import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

interface UseSupabaseViewOptions {
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export function useSupabaseView<T = Record<string, unknown>>(
  viewName: string,
  options?: UseSupabaseViewOptions,
) {
  const { session } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!session?.user) {
      setData([]);
      return;
    }
    setLoading(true);
    let query = supabase.from(viewName).select('*').eq('user_id', session.user.id);
    if (options?.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`[${viewName}] fetch error`, error.message);
      setData([]);
    } else {
      setData((data as T[]) ?? []);
    }
    setLoading(false);
  }, [session?.user, viewName, options?.order?.column, options?.order?.ascending, options?.limit]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  return { data, loading, refetch: fetchData };
}
