import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/app/actions/dashboard-stats.actions';
import type { DashboardStatsResult } from '@/app/actions/scan-types';

export function useDashboardStats() {
  return useQuery<DashboardStatsResult>({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardStats(),
    staleTime: 5000,
  });
}
