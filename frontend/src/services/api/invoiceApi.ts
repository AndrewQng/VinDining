import apiClient from './client'
import type { InvoicePreviewDto, SettleInvoiceRequest, SettleInvoiceResponse } from '@/types'

export const invoiceApi = {
  getPreview: async (tableId: string): Promise<InvoicePreviewDto> => {
    const response = await apiClient.get<InvoicePreviewDto>(`/invoice/preview/${tableId}`)
    return response.data
  },

  settleInvoice: async (command: SettleInvoiceRequest): Promise<SettleInvoiceResponse> => {
    const response = await apiClient.post<SettleInvoiceResponse>('/invoice/settle', command)
    return response.data
  },
}

export default invoiceApi
