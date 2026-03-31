import { useEffect, useState } from "react";
import { ReceiptText, ShoppingBag, Truck } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import Modal from "../../components/ui/modal";
import customerService from "../../services/customer.service";
import { getAccessToken } from "../../lib/session";
import type { CustomerInvoice } from "../../types/customer.types";

const Invoices = () => {
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadInvoices = async () => {
      try {
        setIsLoading(true);
        const invoiceData = await customerService.getInvoices();
        if (isMounted) {
          setInvoices(invoiceData);
        }
      } catch (loadError: any) {
        if (isMounted) {
          setError(loadError?.response?.data?.message || "Unable to load invoices.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInvoices();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="w-full">
      <main className="section-wrap py-6 lg:py-10 space-y-6">
        <section className="rounded-[2.25rem] border border-white/70 bg-gradient-to-br from-white/95 via-sky-50/45 to-cyan-100/35 p-6 md:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-700 font-bold">Invoices</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">Your Order History</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Review completed orders, totals, payment method, and shipping details in one place.
          </p>
        </section>

        {isLoading ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
            Loading invoices...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white/85 p-10 text-center">
            <ReceiptText className="h-10 w-10 text-slate-400 mx-auto" />
            <h2 className="mt-4 text-2xl font-black text-slate-900">No invoices yet</h2>
            <p className="mt-2 text-slate-600">Place an order from your cart and your invoice history will appear here.</p>
            <Link
              to="/browse"
              className="inline-flex mt-5 h-11 px-6 items-center rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Browse Books
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {invoices.map((invoice) => (
              <article key={invoice.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-sky-700 font-bold">Invoice</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">{invoice.id}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(invoice.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                      invoice.status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : invoice.status === "cancelled"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 font-semibold">Items</p>
                    <p className="mt-1 text-lg font-black text-slate-900">{invoice.items.length}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 font-semibold">Total</p>
                    <p className="mt-1 text-lg font-black text-slate-900">${invoice.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4" />
                    {invoice.paymentMethod === "card" ? "Card payment" : "Cash on delivery"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    {invoice.shippingAddress}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedInvoice(invoice)}
                  className="mt-5 h-10 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View Details
                </button>
              </article>
            ))}
          </section>
        )}
      </main>

      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice?.id ?? "Invoice"}
        maxWidthClass="max-w-3xl"
      >
        {selectedInvoice && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-semibold">Customer</p>
                <p className="mt-1 text-base font-bold text-slate-900">{selectedInvoice.customerName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-semibold">Date</p>
                <p className="mt-1 text-base font-bold text-slate-900">{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-semibold">Payment</p>
                <p className="mt-1 text-base font-bold text-slate-900">{selectedInvoice.paymentMethod === "card" ? "Card" : "Cash"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-[1.4fr_0.5fr_0.6fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                <span>Book</span>
                <span>Qty</span>
                <span>Total</span>
              </div>
              {selectedInvoice.items.map((item) => (
                <div key={`${selectedInvoice.id}-${item.id}`} className="grid grid-cols-[1.4fr_0.5fr_0.6fr] px-4 py-3 border-t border-slate-200 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">by {item.author_name}</p>
                  </div>
                  <span>{item.quantity}</span>
                  <span className="font-semibold text-slate-900">${Number(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>${selectedInvoice.subtotal.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Shipping</span><span>${selectedInvoice.shipping.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span>Tax</span><span>${selectedInvoice.tax.toFixed(2)}</span></div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-black text-slate-900"><span>Total</span><span>${selectedInvoice.total.toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
