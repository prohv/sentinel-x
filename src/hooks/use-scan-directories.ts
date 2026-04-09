import { useQuery } from '@tanstack/react-query';
import { scanDirectories } from '@/app/actions/scan-directories.actions';
import type { DirEntry } from '@/app/actions/scan-directories.actions';

export function useScanDirectories() {
  return useQuery<
    | { success: true; dirs: DirEntry[]; autoPath?: string }
    | { success: false; error: string }
  >({
    queryKey: ['directories'],
    queryFn: () => scanDirectories(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}
