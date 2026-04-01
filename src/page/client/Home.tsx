import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenText, Flame, Layers, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import Loading from "../../components/ui/loading";
import Modal from "../../components/ui/modal";
import BookDetailModal from "../../components/BookDetailModal";
import bookService from "../../services/book.service";
import customerService from "../../services/customer.service";
import type { Book, BookCategory } from "../../types/book.types";
import { books as fallbackBooksSource, type StaticBook } from "../../components/data/book";
import { consumePendingWelcome } from "../../lib/customer";
import { getAccessToken, getStoredUser } from "../../lib/session";

const fallbackBooks: Book[] = (fallbackBooksSource as StaticBook[]).map((book) => ({
  id: book.id,
  title: book.title,
  description: "Featured selection available while the API is offline.",
  price: Number(book.price),
  stock: 1,
  author_name: book.author,
  published_date: book.published_date,
  book_img: book.book_img,
  category_name: book.genre,
}));

const fallbackCategories: BookCategory[] = Array.from(
  new Map(
    fallbackBooks.map((book, index) => [
      book.category_name,
      { id: index + 1, name: book.category_name },
    ]),
  ).values(),
);

const Home = () => {
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [bookCategory, setBookCategory] = useState<BookCategory[]>([]);
  const [newArrivals, setNewArrivals] = useState<Book[]>([]);
  const [bestSellers, setBestSellers] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  useEffect(() => {
    const pendingWelcome = consumePendingWelcome();
    if (pendingWelcome) {
      setWelcomeMessage(pendingWelcome);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [booksRes, categoryRes, newArrivalsRes, bestSellersRes] = await Promise.allSettled([
          bookService.getBooks(),
          bookService.getBookCategories(),
          bookService.getNewArrivals(),
          bookService.getBestSellers(),
        ]);

        const booksData = booksRes.status === "fulfilled" ? [...booksRes.value.data].sort((a, b) => a.id - b.id) : fallbackBooks;
        const categoryData = categoryRes.status === "fulfilled" ? categoryRes.value.data : fallbackCategories;
        const newArrivalsData = newArrivalsRes.status === "fulfilled" ? newArrivalsRes.value.data : booksData.slice(0, 10);
        const bestSellersData = bestSellersRes.status === "fulfilled" ? bestSellersRes.value.data : booksData.slice(0, 10);

        setBooks(booksData);
        setBookCategory(categoryData);
        setNewArrivals(newArrivalsData);
        setBestSellers(bestSellersData);

        const hasApiFailure = [booksRes, categoryRes, newArrivalsRes, bestSellersRes].some(
          (result) => result.status === "rejected",
        );

        if (hasApiFailure) {
          setError("API server is unavailable. Showing bundled homepage data.");
        }
      } catch (fetchError) {
        console.error(fetchError);
        setBooks(fallbackBooks);
        setBookCategory(fallbackCategories);
        setNewArrivals(fallbackBooks.slice(0, 10));
        setBestSellers(fallbackBooks.slice(0, 10));
        setError("API server is unavailable. Showing bundled homepage data.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [location.hash]);

  const heroBooks = useMemo(() => books.slice(0, 3), [books]);

  const handleOpenBookDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailModalOpen(true);
  };

  const handleAddToCart = async (book: Book) => {
    if (!getAccessToken() || getStoredUser()?.role !== "customer") {
      setFeedbackMessage("Please login as a customer first to add items to cart.");
      return;
    }

    try {
      await customerService.addCartItem(book.id, 1);
      setFeedbackMessage(`Added "${book.title}" to cart.`);
    } catch (error: any) {
      setFeedbackMessage(error?.response?.data?.message || "Unable to add item to cart.");
    }
  };

  if (isLoading) {
    return (
      <div className="section-wrap py-10">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full">
      <main className="section-wrap py-6 lg:py-10 space-y-10">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-medium text-accent"
          >
            {error}
          </motion.div>
        )}

        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary"
          >
            {feedbackMessage}
          </motion.div>
        )}

        <section id="home-hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 md:p-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-primary font-bold">Reader's Spotlight</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-3 leading-tight">
                  Discover Stories That Match Your Mood
                </h1>
                <p className="mt-4 text-sm md:text-base text-foreground/70 max-w-2xl">
                  Explore fresh arrivals, trending picks, and timeless classics with a clean shopping experience.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    to="/browse"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-sm-lg"
                  >
                    Browse Products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/favorites"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border/60 bg-background text-foreground text-sm font-medium hover:bg-background/80 transition-all duration-200"
                  >
                    View Favorites
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/60 font-semibold">Books</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{books.length}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/60 font-semibold">Categories</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{bookCategory.length}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/60 px-4 py-3 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/60 font-semibold">Trending</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{bestSellers.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-background/40 p-5">
                <p className="text-xs uppercase tracking-[0.1em] text-primary font-bold mb-3">Featured Covers</p>
                <div className="grid grid-cols-3 gap-2">
                  {heroBooks.map((book) => (
                    <div key={`hero-${book.id}`} className="h-36 rounded-lg border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-sm-lg transition-shadow duration-200">
                      <img src={book.book_img} alt={book.title} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="new-arrivals" className="mb-6 scroll-mt-32">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Flame className="h-5 w-5 text-accent" />
                New Arrivals
              </h3>
              <p className="text-sm text-foreground/70 mt-1">
                Highlights the newest products added to the store.
              </p>
            </div>
            <Link
              to="/browse"
              className="shrink-0 h-10 px-4 rounded-lg bg-card border border-border/50 text-sm font-medium text-foreground hover:bg-background/80 transition-all duration-200 inline-flex items-center gap-1.5"
            >
              Browse all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:var(--color-primary)_transparent]">
            <div className="flex gap-4 min-w-max pr-2">
              {newArrivals.slice(0, 10).map((book) => (
                <article
                  key={`arrival-${book.id}`}
                  onClick={() => handleOpenBookDetail(book)}
                  className="w-[280px] shrink-0 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-sm-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer p-3.5"
                >
                  <div className="h-40 rounded-lg overflow-hidden bg-background/60 flex items-center justify-center border border-border/40">
                    <img src={book.book_img} alt={book.title} className="h-full w-auto object-contain" />
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.1em] font-bold text-primary">{book.category_name}</p>
                  <h4 className="mt-1.5 text-base font-bold text-foreground line-clamp-2 min-h-[2.8rem]">{book.title}</h4>
                  <p className="text-sm text-foreground/70 line-clamp-1 mt-1">by {book.author_name}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                    <span className="text-xs text-foreground/60 uppercase tracking-[0.1em] font-medium">Price</span>
                    <span className="text-lg font-bold text-accent">${Number(book.price).toFixed(2)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="popular" className="mb-6 scroll-mt-32">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Best-sellers / Popular
              </h3>
              <p className="text-sm text-foreground/70 mt-1">
                Popular picks readers are buying the most right now.
              </p>
            </div>
            <Link
              to="/browse"
              className="shrink-0 h-10 px-4 rounded-lg bg-card border border-border/50 text-sm font-medium text-foreground hover:bg-background/80 transition-all duration-200 inline-flex items-center gap-1.5"
            >
              Browse all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:var(--color-primary)_transparent]">
            <div className="flex gap-4 min-w-max pr-2">
              {bestSellers.slice(0, 10).map((book) => (
                <article
                  key={`popular-${book.id}`}
                  onClick={() => handleOpenBookDetail(book)}
                  className="w-[280px] shrink-0 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-sm-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer p-3.5"
                >
                  <div className="h-40 rounded-lg overflow-hidden bg-background/60 flex items-center justify-center border border-border/40">
                    <img src={book.book_img} alt={book.title} className="h-full w-auto object-contain" />
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.1em] font-bold text-primary">{book.category_name}</p>
                  <h4 className="mt-1.5 text-base font-bold text-foreground line-clamp-2 min-h-[2.8rem]">{book.title}</h4>
                  <p className="text-sm text-foreground/70 line-clamp-1 mt-1">by {book.author_name}</p>
                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
                    <span className="text-xs text-foreground/60 uppercase tracking-[0.1em] font-medium">Price</span>
                    <span className="text-lg font-bold text-accent">${Number(book.price).toFixed(2)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="catalogue" className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 md:p-8 scroll-mt-32">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-primary font-bold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Curated Collection
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Book Catalogue</h2>
          <p className="text-sm text-foreground/70 mt-3 max-w-xl">
            Discover books by category, theme, and popularity with our curated collections.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-background/50 border border-border/40 p-4">
              <p className="text-xs uppercase text-foreground/60 font-semibold tracking-[0.1em]">Books</p>
              <p className="mt-2 text-2xl font-bold text-foreground flex items-center gap-2">
                <BookOpenText className="h-5 w-5 text-primary" />
                {books.length}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border/40 p-4">
              <p className="text-xs uppercase text-foreground/60 font-semibold tracking-[0.1em]">Categories</p>
              <p className="mt-2 text-2xl font-bold text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                {bookCategory.length}
              </p>
            </div>
            <div className="rounded-lg bg-background/50 border border-border/40 p-4">
              <p className="text-xs uppercase text-foreground/60 font-semibold tracking-[0.1em]">Best Sellers</p>
              <p className="mt-2 text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {bestSellers.length}
              </p>
            </div>
          </div>
        </section>

        <section id="help" className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 md:p-8 scroll-mt-32">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-primary font-bold">Need Help?</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">Support, Orders, and Account Assistance</h3>
              <p className="text-foreground/70 mt-2 text-sm">Our team can help with purchases, order status, and account issues.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link to="/login" className="h-10 px-5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center transition-all duration-200 shadow-sm hover:shadow-sm-lg">
                Contact Support
              </Link>
              <Link to="/browse" className="h-10 px-5 rounded-lg text-sm font-medium border border-border/50 text-foreground hover:bg-background/80 inline-flex items-center transition-all duration-200">
                Browse Products
              </Link>
            </div>
          </div>
        </section>
      </main>

      <BookDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        book={selectedBook}
        onAddToCart={handleAddToCart}
      />

      <Modal
        isOpen={Boolean(welcomeMessage)}
        onClose={() => setWelcomeMessage("")}
        title="Welcome to Bookly"
        maxWidthClass="max-w-md"
        bodyClassName="p-6 text-center space-y-4"
      >
        <p className="text-base text-foreground/80">{welcomeMessage}</p>
        <button
          onClick={() => setWelcomeMessage("")}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-sm-lg"
        >
          Start Exploring
        </button>
      </Modal>
    </div>
  );
};

export default Home;
