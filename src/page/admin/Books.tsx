import { BookOpen, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/ui/modal";
import bookService from "../../services/book.service";
import type { Book, BookMutationData } from "../../types/book.types";

const emptyForm: BookMutationData = {
  title: "",
  description: "",
  price: 0,
  stock: 0,
  author_id: 0,
  category_id: 0,
  published_date: "",
  book_img: "",
};

const Books = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookMutationData>(emptyForm);

  const loadBooks = async () => {
    try {
      setError("");
      const response = await bookService.getBooks();
      setBooks(response.data);
    } catch (loadError: any) {
      setError(loadError?.response?.data?.message || "Unable to load books.");
    }
  };

  useEffect(() => {
    void loadBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    if (!search) {
      return books;
    }

    return books.filter((book) =>
      [book.title, book.author_name, book.category_name].some((value) =>
        value?.toLowerCase().includes(search),
      ),
    );
  }, [books, searchValue]);

  const authorOptions = useMemo(() => {
    const map = new Map<number, string>();
    books.forEach((book) => {
      if (book.author_id) {
        map.set(book.author_id, book.author_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [books]);

  const categoryOptions = useMemo(() => {
    const map = new Map<number, string>();
    books.forEach((book) => {
      if (book.category_id) {
        map.set(book.category_id, book.category_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [books]);

  const openCreateModal = () => {
    setEditingBook(null);
    setForm({
      ...emptyForm,
      author_id: authorOptions[0]?.id || 0,
      category_id: categoryOptions[0]?.id || 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      description: book.description || "",
      price: Number(book.price),
      stock: book.stock || 0,
      author_id: book.author_id || authorOptions[0]?.id || 0,
      category_id: book.category_id || categoryOptions[0]?.id || 0,
      published_date: book.published_date || "",
      book_img: book.book_img || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingBook) {
        await bookService.updateBook(editingBook.id, form);
        setSuccess("Book updated successfully.");
      } else {
        await bookService.createBook(form);
        setSuccess("Book created successfully.");
      }

      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingBook(null);
      await loadBooks();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || "Unable to save book.");
    }
  };

  const handleDelete = async (bookId: number) => {
    try {
      setError("");
      setSuccess("");
      await bookService.deleteBook(bookId);
      setSuccess("Book deleted successfully.");
      await loadBooks();
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.message || "Unable to delete book.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold mb-2">Catalog</p>
          <h1 className="text-3xl font-bold text-slate-900">Books Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage inventory, metadata, and publishing status.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-200/60"
        >
          <Plus size={16} />
          Add New Book
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      <div className="bg-white/90 rounded-3xl border border-white/80 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search books by title, author, or category"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm outline-none focus:ring-2 focus:ring-orange-300/30"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold">{filteredBooks.length} books loaded</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBooks.map((book) => (
            <div key={book.id} className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-700 grid place-items-center">
                  <BookOpen size={18} />
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-slate-200 text-slate-600 font-bold">
                  {book.category_name}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 mt-3">{book.title}</h3>
              <p className="text-xs text-slate-500 mt-1">by {book.author_name}</p>
              <p className="text-xs text-slate-500 mt-1">{book.stock || 0} in stock</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-lg font-extrabold text-orange-600">${Number(book.price).toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <button className="h-9 w-9 rounded-lg border border-slate-200 grid place-items-center text-slate-600 hover:text-slate-900" onClick={() => openEditModal(book)}>
                    <Pencil size={16} />
                  </button>
                  <button className="h-9 w-9 rounded-lg border border-rose-200 grid place-items-center text-rose-600 hover:bg-rose-50" onClick={() => void handleDelete(book.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBook ? "Edit Book" : "Create Book"}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Title"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <input
              value={form.price}
              type="number"
              min="0"
              step="0.01"
              onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
              placeholder="Price"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <input
              value={form.stock}
              type="number"
              min="0"
              onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
              placeholder="Stock"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <input
              value={form.published_date || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, published_date: e.target.value }))}
              placeholder="Published date"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <select
              value={form.author_id}
              onChange={(e) => setForm((prev) => ({ ...prev, author_id: Number(e.target.value) }))}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value={0}>Select author</option>
              {authorOptions.map((author) => (
                <option key={author.id} value={author.id}>{author.name}</option>
              ))}
            </select>
            <select
              value={form.category_id}
              onChange={(e) => setForm((prev) => ({ ...prev, category_id: Number(e.target.value) }))}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value={0}>Select category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <input
            value={form.book_img || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, book_img: e.target.value }))}
            placeholder="Book image URL"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
          />
          <textarea
            value={form.description || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description"
            className="min-h-32 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-200/60"
            >
              {editingBook ? "Save Changes" : "Create Book"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Books;
