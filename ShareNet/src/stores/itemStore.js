import { create } from 'zustand';
import api from '../lib/axios';

const useItemStore = create((set, get) => ({
    items: [],
    myItems: [],
    recommendations: [],
    currentItem: null,
    isLoading: false,
    filters: {
        category: '',
        mode: '',
        priceMin: '',
        priceMax: '',
        search: ''
    },

    setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

    fetchItems: async () => {
        set({ isLoading: true });
        try {
            const { filters } = get();
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.mode) params.append('mode', filters.mode);
            if (filters.priceMin) params.append('priceMin', filters.priceMin);
            if (filters.priceMax) params.append('priceMax', filters.priceMax);
            if (filters.search) params.append('search', filters.search);
            
            const response = await api.get(`/items?${params.toString()}`);
            const data = response.data.data;
            set({ items: data.items || data || [], isLoading: false });
        } catch (error) {
            set({ items: [], isLoading: false });
        }
    },

    fetchMyItems: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/items/my-items');
            const data = response.data.data;
            set({ myItems: data.items || data || [], isLoading: false });
        } catch (error) {
            set({ myItems: [], isLoading: false });
        }
    },

    fetchItem: async (id) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/items/${id}`);
            set({ currentItem: response.data.data, isLoading: false });
            return response.data.data;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    createItem: async (formData) => {
        const response = await api.post('/items', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        set({ myItems: [...get().myItems, response.data.data] });
        return response.data;
    },

    updateItem: async (id, data) => {
        const response = await api.patch(`/items/${id}`, data);
        const updated = response.data.data;
        set({
            myItems: get().myItems.map(item => item._id === id ? updated : item),
            currentItem: get().currentItem?._id === id ? updated : get().currentItem
        });
        return response.data;
    },

    deleteItem: async (id) => {
        await api.delete(`/items/${id}`);
        set({ myItems: get().myItems.filter(item => item._id !== id) });
    },

    fetchRecommendations: async () => {
        try {
            const response = await api.get('/items/recommendations');
            set({ recommendations: response.data.data || [] });
        } catch (error) {
            set({ recommendations: [] });
        }
    },

    toggleAvailability: async (id) => {
        const response = await api.patch(`/items/${id}/availability`);
        const updated = response.data.data;
        set({
            myItems: get().myItems.map(item => item._id === id ? updated : item)
        });
        return response.data;
    }
}));

export default useItemStore;
