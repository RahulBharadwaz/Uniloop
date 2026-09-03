import { create } from 'zustand';
import api from '../lib/axios';

const useTransactionStore = create((set, get) => ({
    transactions: [],
    currentTransaction: null,
    isLoading: false,

    fetchTransactions: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/transactions');
            // Backend returns { transactions, pagination } structure
            const data = response.data.data;
            set({ transactions: data.transactions || data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchTransaction: async (id) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/transactions/${id}`);
            set({ currentTransaction: response.data.data, isLoading: false });
            return response.data.data;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    proposeAgreement: async (id, agreementData) => {
        const response = await api.post(`/transactions/${id}/propose-agreement`, agreementData);
        set({ currentTransaction: response.data.data });
        return response.data;
    },

    confirmAgreement: async (id) => {
        const response = await api.post(`/transactions/${id}/confirm-agreement`);
        set({ currentTransaction: response.data.data });
        return response.data;
    },

    markReturnPending: async (id) => {
        const response = await api.post(`/transactions/${id}/mark-returned`);
        set({ currentTransaction: response.data.data });
        return response.data;
    },

    confirmReturn: async (id) => {
        const response = await api.post(`/transactions/${id}/confirm-return`);
        set({ currentTransaction: response.data.data });
        return response.data;
    },

    raiseDispute: async (id, reason) => {
        const response = await api.post(`/transactions/${id}/dispute`, { reason });
        set({ currentTransaction: response.data.data });
        return response.data;
    },

    updateCurrentTransaction: (data) => {
        set({ currentTransaction: { ...get().currentTransaction, ...data } });
    }
}));

export default useTransactionStore;
