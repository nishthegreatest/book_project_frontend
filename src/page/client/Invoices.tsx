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
        <section className="rounded-2xl border border-border/50 bg-card card-shadow p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.1em] text-primary font-bold">Invoices</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-foreground">Your Order History</h1>
          <p className="mt-3 text-sm text-foreground/70 max-w-2xl">
            Review completed orders, totals, payment method, and shipping details in one place.
          </p>
        </section>

        {isLoading ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            Loading invoices...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border/50 bg-background/50 p-10 text-center">
            <ReceiptText className="h-10 w-10 text-foreground/40 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-foreground">No invoices yet</h2>
            <p className="mt-2 text-foreground/70">Place an order from your cart and your invoice history will appear here.</p>
            <Link
              to="/browse"
              className="inline-flex mt-5 h-10 px-6 items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
            >
              Browse Books
            </Link>
          </section>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {invoices.map((invoice) => (
              <article key={invoice.id} className="rounded-2xl border border-border/50 bg-card card-shadow p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-primary font-medium">Invoice</p>
                    <h2 className="mt-1 text-2xl font-bold text-foreground">{invoice.id}</h2>
                    <p className="mt-1 text-sm text-foreground/60">
                      {new Date(invoice.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] border ${
                      invoice.status === "paid"
                        ? "bg-success/10 text-success border-success/30"
                        : invoice.status === "cancelled"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-amber-100/30 text-amber-700 border-amber-200/50"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-medium">Items</p>
                    <p className="mt-2 text-lg font-bold text-foreground">{invoice.items.length}</p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-medium">Total</p>
                    <p className="mt-2 text-lg font-bold text-foreground">${invoice.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-foreground/70">
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
                  className="mt-5 h-10 px-5 rounded-lg border border-border/50 text-sm font-medium text-foreground hover:bg-background/80 transition-all duration-200"
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
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-medium">Customer</p>
                <p className="mt-2 text-base font-bold text-foreground">{selectedInvoice.customerName}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-medium">Date</p>
                <p className="mt-2 text-base font-bold text-foreground">{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/60 font-medium">Payment</p>
                <p className="mt-2 text-base font-bold text-foreground">{selectedInvoice.paymentMethod === "card" ? "Card" : "Cash"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[1.4fr_0.5fr_0.6fr] bg-background/50 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-foreground/60">
                <span>Book</span>
                <span>Qty</span>
                <span>Total</span>
              </div>
              {selectedInvoice.items.map((item) => (
                <div key={`${selectedInvoice.id}-${item.id}`} className="grid grid-cols-[1.4fr_0.5fr_0.6fr] px-4 py-3 border-t border-border/30 text-sm text-foreground/80">
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-foreground/60">by {item.author_name}</p>
                  </div>
                  <span>{item.quantity}</span>
                  <span className="font-semibold text-foreground">${Number(item.total).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/50 bg-background/50 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between text-foreground/70"><span>Subtotal</span><span>${selectedInvoice.subtotal.toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-foreground/70"><span>Shipping</span><span>${selectedInvoice.shipping.toFixed(2)}</span></div>
              <div className="flex items-center justify-between text-foreground/70"><span>Tax</span><span>${selectedInvoice.tax.toFixed(2)}</span></div>
              <div className="flex items-center justify-between border-t border-border/30 pt-2 text-base font-bold text-foreground"><span>Total</span><span>${selectedInvoice.total.toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
