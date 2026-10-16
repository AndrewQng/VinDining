import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { testingApi } from '@/services/api/testingApi'

export function useTestingOverview(enabled = true) {
  return useQuery({
    queryKey: ['testing-overview'],
    queryFn: () => testingApi.getOverview(),
    enabled,
    refetchInterval: 5000, // Tự động refetch mỗi 5s để cập nhật sơ đồ kiểm thử
  })
}

export function useSeedSampleData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => testingApi.seedSampleData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testing-overview'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}
