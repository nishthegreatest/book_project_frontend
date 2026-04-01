import { useEffect, useMemo, useState } from "react";
import { BookOpen, Layers, Search, Sparkles, X } from "lucide-react";
import BookCard from "../../components/BookCard";
import Loading from "../../components/ui/loading";
import Modal from "../../components/ui/modal";
import CustomerLoginForm from "../../components/Authentication/CustomerLoginForm";
import CustomerRegisterForm from "../../components/Authentication/CustomerRegisterForm";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "../../components/ui/combobox";
import bookService from "../../services/book.service";
import customerService from "../../services/customer.service";
import type { Book, BookCategory } from "../../types/book.types";
import { isAuthenticated, loadFavorites, saveFavorites, toggleFavoriteId } from "../../lib/favorites";
import { getStoredUser } from "../../lib/session";

const Browse = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookCategory, setBookCategory] = useState<BookCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [searchTitle, setSearchTitle] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [favoriteBookIds, setFavoriteBookIds] = useState<number[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [booksRes, categoryRes] = await Promise.all([
          bookService.getBooks(),
          bookService.getBookCategories(),
        ]);
        setBooks([...booksRes.data].sort((a, b) => a.id - b.id));
        setBookCategory(categoryRes.data);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load books. Please check API connection.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  useEffect(() => {
    setFavoriteBookIds(loadFavorites());

    const syncFavorites = () => setFavoriteBookIds(loadFavorites());
    window.addEventListener("auth-changed", syncFavorites);
    return () => window.removeEventListener("auth-changed", syncFavorites);
  }, []);

  useEffect(() => {
    saveFavorites(favoriteBookIds);
  }, [favoriteBookIds]);

  const authorOptions = useMemo(
    () =>
      Array.from(new Set(books.map((book) => book.author_name)))
        .sort((a, b) => a.localeCompare(b))
        .map((name, index) => ({ id: index + 1, name })),
    [books],
  );

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesCategory = !selectedCategory || book.category_name === selectedCategory;
      const matchesAuthor = !selectedAuthor || book.author_name === selectedAuthor;
      const matchesTitle = !searchTitle || book.title.toLowerCase().includes(searchTitle.toLowerCase());

      const parsedMin = minPrice ? Number(minPrice) : null;
      const parsedMax = maxPrice ? Number(maxPrice) : null;
      const numericPrice = Number(book.price);
      const matchesMin = parsedMin === null || (!Number.isNaN(parsedMin) && numericPrice >= parsedMin);
      const matchesMax = parsedMax === null || (!Number.isNaN(parsedMax) && numericPrice <= parsedMax);

      return matchesCategory && matchesAuthor && matchesTitle && matchesMin && matchesMax;
    });
  }, [books, selectedCategory, selectedAuthor, searchTitle, minPrice, maxPrice]);

  const requireAuth = (mode: "login" | "register" = "login", message?: string) => {
    setAuthModalMode(mode);
    if (message) setFeedbackMessage(message);
    setIsAuthModalOpen(true);
  };

  const handleToggleFavorite = (bookId: number) => {
    if (!isAuthenticated()) {
      requireAuth("login", "Login is required to save favorite products.");
      return;
    }
    setFavoriteBookIds((prev) => toggleFavoriteId(prev, bookId));
  };

  const handleAddToCart = async (book: Book) => {
    if (!isAuthenticated() || getStoredUser()?.role !== "customer") {
      requireAuth("login", "You need to login as a customer before adding items to cart.");
      return;
    }

    try {
      await customerService.addCartItem(book.id, 1);
      setFeedbackMessage(`Added "${book.title}" to cart.`);
    } catch (error: any) {
      setFeedbackMessage(error?.response?.data?.message || "Unable to add item to cart.");
    }
  };

  return (
    <div className="w-full">
      <main className="section-wrap py-6 lg:py-10 space-y-6">
        <section id="browse" className="scroll-mt-32">
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm p-6 md:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col gap-6">
              <div>
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-primary font-bold mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Search Products
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">Browse All Books</h2>
                <p className="text-sm text-foreground/70 mt-3 max-w-2xl">
                  Find books faster with title search, filters, and clean product discovery flow.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-background/60 border border-border/40 p-4">
                  <p className="text-xs uppercase text-foreground/60 font-semibold tracking-[0.1em]">Books</p>
                  <p className="mt-2 text-2xl font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {books.length}
                  </p>
                </div>
                <div className="rounded-lg bg-background/60 border border-border/40 p-4">
                  <p className="text-xs uppercase text-foreground/60 font-semibold tracking-[0.1em]">Categories</p>
                  <p className="mt-2 text-2xl font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    {bookCategory.length}
                  </p>
                </div>
                <div className="rounded-lg bg-background/60 border border-border/40 p-4">
                  <p className="text-xs uppercase text-foreground/60 font-semibold tracking-[0.1em]">Showing</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{filteredBooks.length}</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                <div className="relative w-full md:flex-1">
                  <Search className="h-4 w-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder="Search by book title..."
                    className="h-10 w-full rounded-lg border border-border/50 bg-background px-3 pl-9 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                  />
                </div>

                <Combobox
                  items={bookCategory}
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(String(value ?? ""))}
                >
                  <ComboboxInput className="w-full md:w-56 bg-background border-border/50" placeholder="Filter by category" />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.id} value={item.name}>
                          {item.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                <Combobox
                  items={authorOptions}
                  value={selectedAuthor}
                  onValueChange={(value) => setSelectedAuthor(String(value ?? ""))}
                >
                  <ComboboxInput className="w-full md:w-56 bg-background border-border/50" placeholder="Filter by author" />
                  <ComboboxContent>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {authorOptions.map((item) => (
                        <ComboboxItem key={item.id} value={item.name}>
                          {item.name}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min price"
                  className="h-10 w-full md:w-32 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max price"
                  className="h-10 w-full md:w-32 rounded-lg border border-border/50 bg-background px-3 text-sm text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </section>

        {feedbackMessage && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
            {feedbackMessage}
          </div>
        )}

        {isLoading ? (
          <Loading />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <section id="books-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 scroll-mt-32">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                {...book}
                isFavorite={favoriteBookIds.includes(book.id)}
                onToggleFavorite={() => handleToggleFavorite(book.id)}
                onAddToCart={handleAddToCart}
              />
            ))}
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No books found</p>
            <p className="text-sm mt-1">Try a different search or filter</p>
          </div>
        )}
      </main>

      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        maxWidthClass="max-w-md"
        showHeader={false}
        bodyClassName="p-6 sm:p-8 bg-white"
      >
        <div className="space-y-5">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="h-8 w-8 rounded-lg grid place-items-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Close login form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-slate-900 mb-1">{authModalMode === "login" ? "Login" : "Sign Up"}</h3>
            <p className="text-sm text-slate-500">
              {authModalMode === "login"
                ? "Welcome back! Sign in to continue."
                : "Create your account to get started."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100">
            <button
              type="button"
              onClick={() => setAuthModalMode("login")}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                authModalMode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthModalMode("register")}
              className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                authModalMode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Register
            </button>
          </div>

          {authModalMode === "login" ? (
            <CustomerLoginForm
              onLoginSuccess={() => {
                setFeedbackMessage("Login successful.");
                setIsAuthModalOpen(false);
                setFavoriteBookIds(loadFavorites());
              }}
            />
          ) : (
            <CustomerRegisterForm
              onRegisterSuccess={() => {
                setFeedbackMessage("Register successful.");
                setIsAuthModalOpen(false);
                setFavoriteBookIds(loadFavorites());
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Browse;
