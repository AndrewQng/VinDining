import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi } from '@/services/api/invoiceApi'
import type { SettleInvoiceRequest } from '@/types'

export const INVOICE_KEYS = {
  all: ['invoices'] as const,
  preview: (tableId: string) => [...INVOICE_KEYS.all, 'preview', tableId] as const,
}

export function useInvoicePreview(tableId: string, enabled = true) {
  return useQuery({
    queryKey: INVOICE_KEYS.preview(tableId),
    queryFn: () => invoiceApi.getPreview(tableId),
    enabled: enabled && !!tableId,
    staleTime: 1000 * 10, // 10s
  })
}

export function useSettleInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (command: SettleInvoiceRequest) => invoiceApi.settleInvoice(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['testing-overview'] })
    },
  })
}
