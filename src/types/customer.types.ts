import type { Book } from "./book.types";

export interface CustomerCountResponse {
  status?: "success" | "error";
  total_customers: number;
}

export interface CustomerProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role?: string;
  name?: string;
}

export interface CustomerProfileUpdateData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  password?: string;
}

export interface CartItem extends Book {
  book_id: number;
  quantity: number;
  line_total: number;
}

export interface CartResponseData {
  cart_id: number;
  item_count: number;
  subtotal: number;
  items: CartItem[];
}

export interface InvoiceItem {
  id: number;
  book_id: number;
  title: string;
  author_name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface CustomerInvoice {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: "card" | "cod";
  shippingAddress: string;
  createdAt: string;
  updatedAt?: string;
  status: "pending" | "paid" | "processing" | "shipped" | "cancelled";
}
