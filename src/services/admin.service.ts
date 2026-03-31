import api from "../api/axios";
import type { CustomerCountResponse, CustomerInvoice } from "../types/customer.types";

const adminService = {
  getInvoices: async (): Promise<CustomerInvoice[]> => {
    const response = await api.get<{ status: string; data: CustomerInvoice[] }>("/admin/invoices");
    return response.data.data;
  },

  updateInvoiceStatus: async (
    invoiceId: string,
    status: CustomerInvoice["status"],
  ): Promise<CustomerInvoice> => {
    const response = await api.put<{ status: string; data: CustomerInvoice }>(`/admin/invoices/${invoiceId}`, { status });
    return response.data.data;
  },

  getCustomerCount: async (): Promise<CustomerCountResponse> => {
    const response = await api.get<CustomerCountResponse>("/customers/count");
    return response.data;
  },
};

export default adminService;
