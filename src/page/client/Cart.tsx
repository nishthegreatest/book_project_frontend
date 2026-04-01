import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import customerService from "../../services/customer.service";
import { getAccessToken, getStoredUser } from "../../lib/session";
import { CART_CHANGED_EVENT } from "../../lib/cart";
import type { CartItem, CartResponseData, CustomerInvoice, CustomerProfile } from "../../types/customer.types";

type PaymentMethod = "card" | "cod";

interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  paymentMethod: PaymentMethod;
}

const emptyCart: CartResponseData = {
  cart_id: 0,
  item_count: 0,
  subtotal: 0,
  items: [],
};

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartResponseData>(emptyCart);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orderMessage, setOrderMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isPlaced, setIsPlaced] = useState(false);
  const [placedInvoice, setPlacedInvoice] = useState<CustomerInvoice | null>(null);
  const [form, setForm] = useState<CheckoutForm>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Cambodia",
    paymentMethod: "card",
  });

  const isLoggedIn = Boolean(getAccessToken()) && getStoredUser()?.role === "customer";

  useEffect(() => {
    let isMounted = true;

    const loadCheckoutData = async () => {
      if (!isLoggedIn) {
        setCart(emptyCart);
        setProfile(null);
        return;
      }

      try {
        setLoadingMessage("Loading your cart...");
        const [cartData, profileData] = await Promise.all([
          customerService.getCart(),
          customerService.getCurrentProfile(),
        ]);

        if (!isMounted) {
          return;
        }

        setCart(cartData);
        setProfile(profileData);
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setCheckoutError("Unable to load your cart right now.");
        }
      } finally {
        if (isMounted) {
          setLoadingMessage("");
        }
      }
    };

    void loadCheckoutData();

    const handleCartChanged = () => {
      void loadCheckoutData();
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);
    return () => {
      isMounted = false;
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const fullName = `${profile.first_name} ${profile.last_name}`.trim();
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || fullName,
      email: prev.email || profile.email,
      phone: prev.phone || profile.phone || "",
      address: prev.address || profile.address || "",
      city: prev.city || "",
      country: prev.country || "Cambodia",
    }));
  }, [profile]);

  const items = cart.items;

  const summary = useMemo(() => {
    const subtotal = Number(cart.subtotal || 0);
    const shipping = subtotal > 60 || subtotal === 0 ? 0 : 4.99;
    const tax = Number((subtotal * 0.08).toFixed(2));
    const total = Number((subtotal + shipping + tax).toFixed(2));
    return { subtotal, shipping, tax, total };
  }, [cart.subtotal]);

  const updateQty = async (bookId: number, nextQty: number) => {
    try {
      if (nextQty <= 0) {
        const updatedCart = await customerService.removeCartItem(bookId);
        setCart(updatedCart);
        return;
      }

      const updatedCart = await customerService.updateCartItemQuantity(bookId, nextQty);
      setCart(updatedCart);
    } catch (error: any) {
      setCheckoutError(error?.response?.data?.message || "Unable to update cart item.");
    }
  };

  const removeItem = async (bookId: number) => {
    try {
      const updatedCart = await customerService.removeCartItem(bookId);
      setCart(updatedCart);
    } catch (error: any) {
      setCheckoutError(error?.response?.data?.message || "Unable to remove cart item.");
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError("");
    setOrderMessage("");

    if (!isLoggedIn) {
      setCheckoutError("Please login first to complete checkout.");
      setTimeout(() => navigate("/login"), 600);
      return;
    }

    if (items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    const requiredValues = [form.fullName, form.email, form.phone, form.address, form.city, form.country];
    if (requiredValues.some((value) => !value.trim())) {
      setCheckoutError("Please complete all checkout fields.");
      return;
    }

    const shippingAddress = `${form.address}, ${form.city}, ${form.country}`;

    try {
      setLoadingMessage("Placing your order...");
      const invoice = await customerService.checkout(form.paymentMethod, shippingAddress);
      setPlacedInvoice(invoice);
      setCart(emptyCart);
      setIsPlaced(true);
      setOrderMessage(`Order ${invoice.id} placed successfully.`);
    } catch (error: any) {
      setCheckoutError(error?.response?.data?.message || "Checkout failed.");
    } finally {
      setLoadingMessage("");
    }
  };

  return (
    <div className="w-full">
      <main className="section-wrap py-6 lg:py-10 space-y-6">
        <section className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.1em] text-primary font-bold">Checkout</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-foreground">Your Cart Order</h1>
          <p className="mt-3 text-sm text-foreground/70 max-w-2xl">
            Review books, set quantity, and place your order in one clean checkout flow.
          </p>
        </section>

        {loadingMessage && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            {loadingMessage}
          </div>
        )}
        {orderMessage && (
          <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success">
            {orderMessage}
          </div>
        )}
        {checkoutError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {checkoutError}
          </div>
        )}

        {!isLoggedIn ? (
          <section className="rounded-2xl border border-dashed border-border/50 bg-background/50 p-8 text-center">
            <ShoppingBag className="h-8 w-8 text-foreground/40 mx-auto" />
            <h3 className="mt-3 text-xl font-bold text-foreground">Login required</h3>
            <p className="mt-1 text-sm text-foreground/70">Sign in as a customer to use your cart and checkout.</p>
            <Link
              to="/login"
              className="inline-flex mt-5 h-10 px-6 items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
            >
              Go to Login
            </Link>
          </section>
        ) : isPlaced && placedInvoice ? (
          <section className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h2 className="mt-3 text-2xl font-bold text-foreground">Order Confirmed</h2>
            <p className="mt-2 text-foreground/70">Thanks for your purchase. Your books are being prepared for shipping.</p>
            <p className="mt-2 text-sm font-medium text-foreground/80">Invoice ID: {placedInvoice.id}</p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/invoices"
                className="inline-flex h-10 px-6 items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
              >
                View Invoices
              </Link>
              <Link
                to="/browse"
                className="inline-flex h-10 px-6 items-center rounded-lg border border-border/50 text-foreground text-sm font-medium hover:bg-background/80 transition-all duration-200"
              >
                Continue Shopping
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/50 bg-background/50 p-8 text-center">
                  <ShoppingBag className="h-8 w-8 text-foreground/40 mx-auto" />
                  <h3 className="mt-3 text-xl font-bold text-foreground">Your cart is empty</h3>
                  <p className="mt-1 text-sm text-foreground/70">Add books from the shop to continue checkout.</p>
                  <Link
                    to="/browse"
                    className="inline-flex mt-5 h-10 px-6 items-center rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200"
                  >
                    Browse Books
                  </Link>
                </div>
              ) : (
                items.map((item: CartItem) => (
                  <article key={item.book_id} className="rounded-2xl border border-border/50 bg-card shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="h-28 w-full sm:w-24 rounded-lg border border-border/50 bg-background/50 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={item.book_img} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] uppercase tracking-[0.08em] font-bold text-primary">{item.category_name}</p>
                        <h3 className="text-lg font-bold text-foreground line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-foreground/60">by {item.author_name}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-lg border border-border/50 bg-background">
                            <button
                              onClick={() => void updateQty(item.book_id, item.quantity - 1)}
                              className="h-9 w-9 grid place-items-center text-foreground/60 hover:text-foreground transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-10 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                            <button
                              onClick={() => void updateQty(item.book_id, item.quantity + 1)}
                              className="h-9 w-9 grid place-items-center text-foreground/60 hover:text-foreground transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="text-xl font-bold text-foreground">${Number(item.line_total).toFixed(2)}</p>
                            <button
                              onClick={() => void removeItem(item.book_id)}
                              className="h-9 w-9 rounded-lg border border-border/50 grid place-items-center text-foreground/60 hover:text-destructive hover:border-destructive/40 transition-all duration-200"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5">
                <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-foreground/70">
                    <span>Subtotal</span>
                    <span>${summary.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-foreground/70">
                    <span>Shipping</span>
                    <span>{summary.shipping === 0 ? "Free" : `$${summary.shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-foreground/70">
                    <span>Tax</span>
                    <span>${summary.tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">${summary.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 space-y-3">
                <h2 className="text-xl font-bold text-foreground">Checkout Details</h2>
                <div className="grid grid-cols-1 gap-2.5">
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Full name"
                    className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                  />
                  <input
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                    className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                  />
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                  />
                  <input
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Street address"
                    className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                    />
                    <input
                      value={form.country}
                      onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                      className="h-10 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 bg-background/50 p-3">
                  <p className="text-sm font-medium text-foreground mb-2.5">Payment</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "card" }))}
                      className={`h-10 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-2 transition-all duration-200 ${
                        form.paymentMethod === "card" ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-foreground hover:bg-background/50"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, paymentMethod: "cod" }))}
                      className={`h-10 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        form.paymentMethod === "cod" ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-foreground hover:bg-background/50"
                      }`}
                    >
                      Cash
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-10 w-full rounded-lg bg-success text-success-foreground font-medium hover:bg-success/90 inline-flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Place Order
                </button>
                <p className="text-xs text-foreground/60 inline-flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  Secure checkout and tracked shipping.
                </p>
              </form>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};

export default Cart;
