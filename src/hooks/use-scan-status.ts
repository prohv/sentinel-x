import { useQuery } from '@tanstack/react-query';
import { getScanStatus } from '@/app/actions/scan-status.actions';
import type { ScanStatusResult } from '@/app/actions/scan-types';

export function useScanStatus(scanId: number | null) {
  return useQuery<ScanStatusResult>({
    queryKey: ['scan-status', scanId],
    queryFn: () => {
      if (scanId === null) {
        return Promise.resolve({ success: false, error: 'No scan ID' });
      }
      return getScanStatus(scanId);
    },
    enabled: scanId !== null,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.success && data.status === 'running') {
        return 500;
      }
      return false;
    },
    staleTime: 200,
  });
}
