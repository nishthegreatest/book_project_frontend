import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Menu, ShoppingCart, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import authService from "../services/auth.service";
import customerService from "../services/customer.service";
import { getAccessToken, getStoredUser, AUTH_CHANGED_EVENT } from "../lib/session";
import { CART_CHANGED_EVENT } from "../lib/cart";
import { Button } from "./ui/button";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/browse" },
  { label: "Cart", to: "/cart" },
  { label: "Favorites", to: "/favorites" },
  { label: "Help", to: "/#help" },
];

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const syncAuthState = () => {
      const token = getAccessToken();
      const user = getStoredUser();
      const loggedIn = Boolean(token) && user?.role !== "admin";
      setIsLoggedIn(loggedIn);
      if (!loggedIn && isMounted) {
        setCartCount(0);
      }
    };

    const syncCartState = async () => {
      const token = getAccessToken();
      const user = getStoredUser();

      if (!token || user?.role === "admin") {
        if (isMounted) {
          setCartCount(0);
        }
        return;
      }

      try {
        const cart = await customerService.getCart();
        if (isMounted) {
          setCartCount(cart.item_count);
        }
      } catch {
        if (isMounted) {
          setCartCount(0);
        }
      }
    };

    const handleAuthChanged = () => {
      syncAuthState();
      void syncCartState();
    };

    const handleCartChanged = () => {
      void syncCartState();
    };

    syncAuthState();
    void syncCartState();

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, []);

  const handleSignOut = async () => {
    await authService.logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/30">
      <nav className="section-wrap py-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-[0_8px_16px_rgba(80,127,83,0.25)] group-hover:shadow-[0_12px_24px_rgba(80,127,83,0.35)] transition-shadow duration-200">
                <BookOpen className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Bookly</h1>
            </button>

            <div className="hidden md:flex items-center gap-1 bg-card/40 rounded-2xl border border-border/40 p-1.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(80,127,83,0.2)]" 
                        : "text-foreground/70 hover:text-foreground hover:bg-background/50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-sm-lg group"
              aria-label="Open cart"
            >
              <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold ring-2 ring-background">
                  {cartCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium rounded-lg hidden lg:inline-flex hover:bg-background/80"
                  onClick={() => navigate("/invoices")}
                >
                  Invoices
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium rounded-lg hidden sm:inline-flex hover:bg-background/80"
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg px-4 font-medium hidden sm:inline-flex"
                  onClick={() => void handleSignOut()}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium rounded-lg hidden sm:inline-flex hover:bg-background/80"
                  onClick={() => navigate("/register")}
                >
                  Register
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-lg px-4 font-medium hidden sm:inline-flex"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              </>
            )}

            <button
              className="md:hidden p-2.5 rounded-lg bg-card border border-border/50 text-foreground hover:bg-card/80 transition-colors duration-200"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="md:hidden mt-3 bg-card border border-border/40 rounded-2xl p-3 shadow-sm"
            >
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate(item.to);
                    }}
                    className="rounded-lg py-2.5 text-sm font-medium bg-background/60 hover:bg-background text-foreground transition-colors duration-200"
                  >
                    {item.label}
                  </button>
                ))}

                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="rounded-lg py-2.5 text-sm font-medium bg-background/60 hover:bg-background text-foreground transition-colors duration-200"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/invoices");
                      }}
                      className="rounded-lg py-2.5 text-sm font-medium bg-background/60 hover:bg-background text-foreground transition-colors duration-200"
                    >
                      Invoices
                    </button>
                    <button
                      onClick={() => void handleSignOut()}
                      className="col-span-2 rounded-lg py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/register");
                      }}
                      className="rounded-lg py-2.5 text-sm font-medium bg-background/60 hover:bg-background text-foreground transition-colors duration-200"
                    >
                      Register
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate("/login");
                      }}
                      className="col-span-2 rounded-lg py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
