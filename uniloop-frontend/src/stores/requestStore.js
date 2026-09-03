import { create } from 'zustand';
import api from '../lib/axios';

const useRequestStore = create((set, get) => ({
    myRequests: [],
    receivedRequests: [],
    activeRequests: [],
    claimQueue: [],
    isLoading: false,

    fetchMyRequests: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/requests/my-requests');
            const data = response.data.data;
            set({ myRequests: data.requests || data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchReceivedRequests: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/requests/received');
            const data = response.data.data;
            set({ receivedRequests: data.requests || data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchActiveRequests: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/requests/active');
            const data = response.data.data;
            set({ activeRequests: data.requests || data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    createRequest: async (data) => {
        let response;
        if (data instanceof FormData) {
            response = await api.post('/requests', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            response = await api.post('/requests', data);
        }
        set({ myRequests: [...get().myRequests, response.data.data] });
        return response.data;
    },

    acceptRequest: async (id) => {
        const response = await api.post(`/requests/${id}/accept`);
        set({
            receivedRequests: get().receivedRequests.map(req => 
                req._id === id ? { ...req, status: 'ACCEPTED' } : req
            )
        });
        return response.data;
    },

    rejectRequest: async (id) => {
        const response = await api.post(`/requests/${id}/reject`);
        set({
            receivedRequests: get().receivedRequests.map(req => 
                req._id === id ? { ...req, status: 'REJECTED' } : req
            )
        });
        return response.data;
    },

    cancelRequest: async (id) => {
        const response = await api.post(`/requests/${id}/cancel`);
        set({
            myRequests: get().myRequests.map(req => 
                req._id === id ? { ...req, status: 'CANCELLED' } : req
            )
        });
        return response.data;
    },

    // Instant claim for free items
    instantClaim: async (itemId) => {
        const response = await api.post(`/requests/instant-claim/${itemId}`);
        return response.data;
    },

    // Get claim queue for free items
    getClaimQueue: async (itemId) => {
        const response = await api.get(`/requests/claim-queue/${itemId}`);
        const data = response.data.data;
        set({ claimQueue: data.claims || data });
        return data.claims || data;
    },

    // Update claim status (for owner)
    updateClaimStatus: async (claimId, status) => {
        const response = await api.patch(`/requests/claims/${claimId}/status`, { status });
        set({
            claimQueue: get().claimQueue.map(claim =>
                claim._id === claimId ? { ...claim, status } : claim
            )
        });
        return response.data;
    },

    // Create counter-offer
    createCounterOffer: async (requestId, offer) => {
        const response = await api.post(`/requests/${requestId}/counter-offer`, offer);
        set({
            receivedRequests: get().receivedRequests.map(req =>
                req._id === requestId ? { ...req, counterOffer: response.data.data.counterOffer } : req
            )
        });
        return response.data;
    },

    // Respond to counter-offer (accept/reject)
    respondToCounterOffer: async (requestId, accept) => {
        const response = await api.post(`/requests/${requestId}/counter-offer/respond`, { accept });
        const status = accept ? 'ACCEPTED' : 'REJECTED';
        set({
            myRequests: get().myRequests.map(req =>
                req._id === requestId ? { 
                    ...req, 
                    counterOffer: { ...req.counterOffer, status },
                    status: accept ? 'ACCEPTED' : req.status
                } : req
            )
        });
        return response.data;
    },

    // Propose pickup details
    proposePickupDetails: async (requestId, details) => {
        const response = await api.post(`/requests/${requestId}/pickup`, details);
        const updateRequest = (req) => 
            req._id === requestId ? { ...req, pickupDetails: response.data.data.pickupDetails } : req;
        
        set({
            receivedRequests: get().receivedRequests.map(updateRequest),
            myRequests: get().myRequests.map(updateRequest)
        });
        return response.data;
    },

    // Confirm pickup details
    confirmPickupDetails: async (requestId) => {
        const response = await api.post(`/requests/${requestId}/pickup/confirm`);
        const updateRequest = (req) =>
            req._id === requestId ? { 
                ...req, 
                pickupDetails: { ...req.pickupDetails, status: 'CONFIRMED' } 
            } : req;

        set({
            receivedRequests: get().receivedRequests.map(updateRequest),
            myRequests: get().myRequests.map(updateRequest)
        });
        return response.data;
    }
}));

export default useRequestStore;
