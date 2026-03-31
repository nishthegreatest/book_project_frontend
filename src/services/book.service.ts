import api from '../api/axios';
import type { Book, BookCategoryResponse, BookCountResponse, BookMutationData, BookPriceResponse, BookResponse } from '../types/book.types';

const bookService = {
    getBooks: async (): Promise<BookResponse> => {
        const response = await api.get<BookResponse>('/books');
        return response.data;
    },
    getBookCategories: async (): Promise<BookCategoryResponse> => {
        const response = await api.get<BookCategoryResponse>('/bookcategory');
        return response.data;
    },
    getBookPrice: async (): Promise<BookPriceResponse> => {
        const response = await api.get<BookPriceResponse>('/bookprice');
        return response.data;
    },
    getBookCount: async (): Promise<BookCountResponse> => {
        const response = await api.get<BookCountResponse>('/books/countbook');
        return response.data;
    },
    getNewArrivals: async (): Promise<BookResponse> => {
        const response = await api.get<BookResponse>('/books/new-arrivals');
        return response.data;
    },
    getBestSellers: async (): Promise<BookResponse> => {
        const response = await api.get<BookResponse>('/books/best-sellers');
        return response.data;
    },
    createBook: async (payload: BookMutationData): Promise<Book> => {
        const response = await api.post<{ status: string; data: Book }>('/books', payload);
        return response.data.data;
    },
    updateBook: async (bookId: number, payload: BookMutationData): Promise<Book> => {
        const response = await api.put<{ status: string; data: Book }>(`/books/${bookId}`, payload);
        return response.data.data;
    },
    deleteBook: async (bookId: number): Promise<void> => {
        await api.delete(`/books/${bookId}`);
    }
};

export default bookService;





