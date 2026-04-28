import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/app/actions/dashboard-stats.actions';
import type { DashboardStatsResult } from '@/app/actions/scan-types';

export function useDashboardStats(repoPath?: string | null) {
  return useQuery<DashboardStatsResult>({
    queryKey: ['dashboard', repoPath],
    queryFn: () => getDashboardStats(repoPath || undefined),
    refetchInterval: 5000,
    staleTime: 5000,
  });
}
