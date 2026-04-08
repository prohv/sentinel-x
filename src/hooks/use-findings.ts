import { useQuery } from '@tanstack/react-query';
import { getFindings } from '@/app/actions/get-findings.actions';
import type { FindingsResult } from '@/app/actions/scan-types';

type FindingsFilters = {
  scanId?: number;
  severity?: string;
  searchQuery?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

export function useFindings(filters?: FindingsFilters) {
  return useQuery<FindingsResult>({
    queryKey: ['findings', filters],
    queryFn: () => getFindings(filters),
    refetchInterval: 5000,
    staleTime: 1000,
  });
}
