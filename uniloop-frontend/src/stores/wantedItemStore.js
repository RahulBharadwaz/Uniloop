import { create } from 'zustand';
import api from '../lib/axios';

const normalizeItem = (item) => {
    if (!item) return null;
    return {
        ...item,
        budgetType: item.budget?.type || item.budgetType,
        maxPrice: item.budget?.maxAmount || item.maxPrice,
        isFulfilled: item.status === 'FULFILLED'
    };
};

const normalizeItems = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(normalizeItem);
};

const useWantedItemStore = create((set, get) => ({
    items: [],
    myItems: [],
    currentItem: null,
    myOffers: [],
    receivedOffers: [],
    pagination: null,
    isLoading: false,
    isOfferLoading: false,
    error: null,
    filter: { category: '', budgetType: '', urgency: '' },

    setFilter: (filter) => set({ filter: { ...get().filter, ...filter } }),

    clearError: () => set({ error: null }),

    fetchItems: async (page = 1, limit = 10) => {
        set({ isLoading: true, error: null });
        try {
            const { filter } = get();
            const params = new URLSearchParams();
            if (filter.category) params.append('category', filter.category);
            if (filter.budgetType) params.append('budgetType', filter.budgetType);
            if (filter.urgency) params.append('urgency', filter.urgency);
            params.append('page', page);
            params.append('limit', limit);

            const response = await api.get(`/wanted-items/?${params.toString()}`);
            const data = response.data?.data;
            const itemsArray = Array.isArray(data) ? data : (data?.wantedItems || data?.items || []);
            const pagination = data?.pagination || null;

            set({
                items: normalizeItems(itemsArray),
                pagination,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch wanted items:', error);
            set({ items: [], error: error.response?.data?.message || 'Failed to fetch items', isLoading: false });
        }
    },

    fetchMyItems: async (page = 1, limit = 10) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams({ page, limit });
            const response = await api.get(`/wanted-items/my-posts?${params.toString()}`);
            const data = response.data?.data;
            const itemsArray = Array.isArray(data) ? data : (data?.wantedItems || data?.items || []);
            const pagination = data?.pagination || null;

            set({
                myItems: normalizeItems(itemsArray),
                pagination,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch my wanted items:', error);
            set({ myItems: [], error: error.response?.data?.message || 'Failed to fetch your items', isLoading: false });
        }
    },

    fetchItemDetail: async (itemId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/wanted-items/${itemId}`);
            const item = normalizeItem(response.data?.data);
            set({ currentItem: item, isLoading: false });
            return item;
        } catch (error) {
            console.error('Failed to fetch item detail:', error);
            set({ currentItem: null, error: error.response?.data?.message || 'Failed to fetch item details', isLoading: false });
            throw error;
        }
    },

    fetchItemOffers: async (itemId) => {
        set({ isOfferLoading: true, error: null });
        try {
            const response = await api.get(`/wanted-items/${itemId}`);
            const item = response.data?.data;
            set({ isOfferLoading: false });
            return { offers: item?.offers || [] };
        } catch (error) {
            console.error('Failed to fetch item offers:', error);
            set({ error: error.response?.data?.message || 'Failed to fetch offers', isOfferLoading: false });
            return { offers: [] };
        }
    },

    createItem: async (formData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/wanted-items/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newItem = normalizeItem(response.data?.data);
            set({
                myItems: [...get().myItems, newItem],
                isLoading: false
            });
            return response.data;
        } catch (error) {
            console.error('Failed to create item:', error);
            set({ error: error.response?.data?.message || 'Failed to create item', isLoading: false });
            throw error;
        }
    },

    updateItem: async (itemId, formData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.put(`/wanted-items/${itemId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updated = normalizeItem(response.data?.data);
            set({
                items: get().items.map(i => i._id === itemId ? updated : i),
                myItems: get().myItems.map(i => i._id === itemId ? updated : i),
                currentItem: get().currentItem?._id === itemId ? updated : get().currentItem,
                isLoading: false
            });
            return response.data;
        } catch (error) {
            console.error('Failed to update item:', error);
            set({ error: error.response?.data?.message || 'Failed to update item', isLoading: false });
            throw error;
        }
    },

    deleteItem: async (itemId) => {
        set({ isLoading: true, error: null });
        try {
            await api.delete(`/wanted-items/${itemId}`);
            set({
                items: get().items.filter(i => i._id !== itemId),
                myItems: get().myItems.filter(i => i._id !== itemId),
                currentItem: get().currentItem?._id === itemId ? null : get().currentItem,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to delete item:', error);
            set({ error: error.response?.data?.message || 'Failed to delete item', isLoading: false });
            throw error;
        }
    },

    makeOffer: async (itemId, offerData) => {
        set({ isOfferLoading: true, error: null });
        try {
            const response = await api.post(`/wanted-items/${itemId}/offers`, offerData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            set({ isOfferLoading: false });
            return response.data?.data;
        } catch (error) {
            console.error('Failed to make offer:', error);
            set({ error: error.response?.data?.message || 'Failed to make offer', isOfferLoading: false });
            throw error;
        }
    },

    fetchMyOffers: async (page = 1, limit = 10) => {
        set({ isOfferLoading: true, error: null });
        try {
            const params = new URLSearchParams({ page, limit });
            const response = await api.get(`/wanted-items/my-offers?${params.toString()}`);
            const data = response.data?.data;
            const offersArray = Array.isArray(data) ? data : (data?.offers || []);
            const pagination = data?.pagination || null;

            set({
                myOffers: offersArray,
                pagination,
                isOfferLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch my offers:', error);
            set({ myOffers: [], error: error.response?.data?.message || 'Failed to fetch your offers', isOfferLoading: false });
        }
    },

    fetchReceivedOffers: async () => {
        set({ isOfferLoading: true, error: null });
        try {
            const response = await api.get('/wanted-items/offers-received');
            const data = response.data?.data;
            const offersReceived = data?.offersReceived || [];
            
            // Flatten the structure - each offer gets the wantedItem attached
            const flattenedOffers = [];
            offersReceived.forEach(item => {
                if (item.offers && Array.isArray(item.offers)) {
                    item.offers.forEach(offer => {
                        flattenedOffers.push({
                            ...offer,
                            wantedItem: item.wantedItem
                        });
                    });
                }
            });

            set({
                receivedOffers: flattenedOffers,
                isOfferLoading: false
            });
        } catch (error) {
            console.error('Failed to fetch received offers:', error);
            set({ receivedOffers: [], error: error.response?.data?.message || 'Failed to fetch received offers', isOfferLoading: false });
        }
    },

    acceptOffer: async (itemId, offerId) => {
        set({ isOfferLoading: true, error: null });
        try {
            const response = await api.patch(`/wanted-items/${itemId}/offers/${offerId}/accept`);
            const updated = response.data?.data;
            set({
                myOffers: get().myOffers.map(o => o._id === offerId ? updated : o),
                receivedOffers: get().receivedOffers.map(o => o._id === offerId ? updated : o),
                isOfferLoading: false
            });
            return updated;
        } catch (error) {
            console.error('Failed to accept offer:', error);
            set({ error: error.response?.data?.message || 'Failed to accept offer', isOfferLoading: false });
            throw error;
        }
    },

    rejectOffer: async (itemId, offerId, reason) => {
        set({ isOfferLoading: true, error: null });
        try {
            const response = await api.patch(`/wanted-items/${itemId}/offers/${offerId}/reject`, { reason });
            const updated = response.data?.data;
            set({
                myOffers: get().myOffers.map(o => o._id === offerId ? updated : o),
                receivedOffers: get().receivedOffers.map(o => o._id === offerId ? updated : o),
                isOfferLoading: false
            });
            return updated;
        } catch (error) {
            console.error('Failed to reject offer:', error);
            set({ error: error.response?.data?.message || 'Failed to reject offer', isOfferLoading: false });
            throw error;
        }
    },

    cancelOffer: async (itemId, offerId) => {
        set({ isOfferLoading: true, error: null });
        try {
            await api.delete(`/wanted-items/${itemId}/offers/${offerId}`);
            set({
                myOffers: get().myOffers.filter(o => o._id !== offerId),
                isOfferLoading: false
            });
        } catch (error) {
            console.error('Failed to cancel offer:', error);
            set({ error: error.response?.data?.message || 'Failed to cancel offer', isOfferLoading: false });
            throw error;
        }
    },

    markFulfilled: async (itemId, offerId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.patch(`/wanted-items/${itemId}/fulfill`, { offerId });
            const updated = normalizeItem(response.data?.data);
            set({
                currentItem: updated,
                items: get().items.map(i => i._id === itemId ? updated : i),
                myItems: get().myItems.map(i => i._id === itemId ? updated : i),
                isLoading: false
            });
            return updated;
        } catch (error) {
            console.error('Failed to mark as fulfilled:', error);
            set({ error: error.response?.data?.message || 'Failed to mark as fulfilled', isLoading: false });
            throw error;
        }
    }
}));

export default useWantedItemStore;
