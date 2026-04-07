import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startScan } from '@/app/actions/start-scan.actions';
import type { StartScanResult } from '@/app/actions/scan-types';

export function useStartScan() {
  const queryClient = useQueryClient();

  return useMutation<
    StartScanResult,
    Error,
    { repoPath: string; scanType: string }
  >({
    mutationFn: (input) => startScan(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['scans'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['findings'] });
      }
    },
  });
}
