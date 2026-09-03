import { create } from 'zustand';
import api from '../lib/axios';

const useLostFoundStore = create((set, get) => ({
    posts: [],
    myPosts: [],
    currentPost: null,
    isOwner: false,
    claims: [],
    myClaims: [],
    receivedClaims: [],
    isLoading: false,
    isClaimLoading: false,
    filter: { type: '', resolved: '' },

    setFilter: (filter) => set({ filter: { ...get().filter, ...filter } }),

    fetchPosts: async () => {
        set({ isLoading: true });
        try {
            const { filter } = get();
            const params = new URLSearchParams();
            if (filter.type) params.append('type', filter.type);
            if (filter.resolved !== '') params.append('resolved', filter.resolved);
            
            const response = await api.get(`/lost-found?${params.toString()}`);
            const data = response.data?.data;
            const postsArray = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []);
            set({ posts: postsArray, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch posts:', error);
            set({ posts: [], isLoading: false });
        }
    },

    fetchMyPosts: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/lost-found/my-posts');
            const data = response.data?.data;
            const postsArray = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []);
            set({ myPosts: postsArray, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch my posts:', error);
            set({ myPosts: [], isLoading: false });
        }
    },

    fetchPostDetail: async (postId) => {
        set({ isLoading: true });
        try {
            const response = await api.get(`/lost-found/${postId}`);
            const data = response.data?.data;
            const post = data?.post || data;
            const isOwner = data?.isOwner || false;
            set({ currentPost: post, isOwner, isLoading: false });
            return { post, isOwner };
        } catch (error) {
            set({ currentPost: null, isOwner: false, isLoading: false });
            throw error;
        }
    },

    createPost: async (formData) => {
        try {
            const response = await api.post('/lost-found', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newPost = response.data?.data;
            if (newPost) {
                set({ myPosts: [...get().myPosts, newPost] });
            }
            return response.data;
        } catch (error) {
            console.error('Failed to create post:', error);
            throw error;
        }
    },

    updatePost: async (id, formData) => {
        try {
            const response = await api.put(`/lost-found/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updated = response.data?.data;
            if (updated) {
                set({
                    currentPost: updated,
                    posts: get().posts.map(p => p._id === id ? updated : p),
                    myPosts: get().myPosts.map(p => p._id === id ? updated : p)
                });
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update post:', error);
            throw error;
        }
    },

    markResolved: async (id) => {
        try {
            const response = await api.patch(`/lost-found/${id}/resolve`);
            const updated = response.data?.data;
            if (updated) {
                set({
                    posts: get().posts.map(p => p._id === id ? updated : p),
                    myPosts: get().myPosts.map(p => p._id === id ? updated : p)
                });
            }
            return response.data;
        } catch (error) {
            console.error('Failed to mark resolved:', error);
            throw error;
        }
    },

    deletePost: async (id) => {
        try {
            await api.delete(`/lost-found/${id}`);
            set({
                posts: get().posts.filter(p => p._id !== id),
                myPosts: get().myPosts.filter(p => p._id !== id)
            });
        } catch (error) {
            console.error('Failed to delete post:', error);
            throw error;
        }
    },

    fetchPostClaims: async (postId) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.get(`/lost-found/${postId}/claims`);
            const data = response.data?.data;
            const claimsArray = Array.isArray(data) ? data : (Array.isArray(data?.claims) ? data.claims : []);
            set({ claims: claimsArray, isClaimLoading: false });
            return claimsArray;
        } catch (error) {
            console.error('Failed to fetch post claims:', error);
            set({ claims: [], isClaimLoading: false });
            throw error;
        }
    },

    createClaim: async (postId, data) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.post(`/lost-found/${postId}/claim`, data);
            set({ isClaimLoading: false });
            return response.data?.data;
        } catch (error) {
            set({ isClaimLoading: false });
            console.error('Failed to create claim:', error);
            throw error;
        }
    },

    fetchMyClaims: async () => {
        set({ isClaimLoading: true });
        try {
            const response = await api.get('/lost-found/claims/sent');
            const data = response.data?.data;
            const claimsArray = Array.isArray(data) ? data : (Array.isArray(data?.claims) ? data.claims : []);
            set({ myClaims: claimsArray, isClaimLoading: false });
        } catch (error) {
            console.error('Failed to fetch my claims:', error);
            set({ myClaims: [], isClaimLoading: false });
            throw error;
        }
    },

    fetchReceivedClaims: async () => {
        set({ isClaimLoading: true });
        try {
            const response = await api.get('/lost-found/claims/received');
            const data = response.data?.data;
            const claimsArray = Array.isArray(data) ? data : (Array.isArray(data?.claims) ? data.claims : []);
            set({ receivedClaims: claimsArray, isClaimLoading: false });
        } catch (error) {
            console.error('Failed to fetch received claims:', error);
            set({ receivedClaims: [], isClaimLoading: false });
            throw error;
        }
    },

    startVerification: async (claimId) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.patch(`/lost-found/claims/${claimId}/start-verification`);
            const updated = response.data?.data;
            if (updated) {
                set({
                    claims: get().claims.map(c => c._id === claimId ? updated : c),
                    receivedClaims: get().receivedClaims.map(c => c._id === claimId ? updated : c),
                    isClaimLoading: false
                });
            } else {
                set({ isClaimLoading: false });
            }
            return updated;
        } catch (error) {
            set({ isClaimLoading: false });
            console.error('Failed to start verification:', error);
            throw error;
        }
    },

    submitVerification: async (claimId, answers) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.post(`/lost-found/claims/${claimId}/submit-verification`, { answers });
            const updated = response.data?.data;
            if (updated) {
                set({
                    claims: get().claims.map(c => c._id === claimId ? updated : c),
                    myClaims: get().myClaims.map(c => c._id === claimId ? updated : c),
                    isClaimLoading: false
                });
            } else {
                set({ isClaimLoading: false });
            }
            return updated;
        } catch (error) {
            set({ isClaimLoading: false });
            console.error('Failed to submit verification:', error);
            throw error;
        }
    },

    verifyClaim: async (claimId) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.patch(`/lost-found/claims/${claimId}/verify`);
            const updated = response.data?.data;
            if (updated) {
                set({
                    claims: get().claims.map(c => c._id === claimId ? updated : c),
                    receivedClaims: get().receivedClaims.map(c => c._id === claimId ? updated : c),
                    isClaimLoading: false
                });
            } else {
                set({ isClaimLoading: false });
            }
            return updated;
        } catch (error) {
            set({ isClaimLoading: false });
            console.error('Failed to verify claim:', error);
            throw error;
        }
    },

    rejectClaim: async (claimId, reason) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.patch(`/lost-found/claims/${claimId}/reject`, { reason });
            const updated = response.data?.data;
            if (updated) {
                set({
                    claims: get().claims.map(c => c._id === claimId ? updated : c),
                    receivedClaims: get().receivedClaims.map(c => c._id === claimId ? updated : c),
                    isClaimLoading: false
                });
            } else {
                set({ isClaimLoading: false });
            }
            return updated;
        } catch (error) {
            set({ isClaimLoading: false });
            console.error('Failed to reject claim:', error);
            throw error;
        }
    },

    proposeMeetup: async (claimId, details) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.post(`/lost-found/claims/${claimId}/propose-meetup`, details);
            const updated = response.data?.data;
            if (updated) {
                set({
                    claims: get().claims.map(c => c._id === claimId ? updated : c),
                    receivedClaims: get().receivedClaims.map(c => c._id === claimId ? updated : c),
                    isClaimLoading: false
                });
            } else {
                set({ isClaimLoading: false });
            }
            return updated;
        } catch (error) {
            set({ isClaimLoading: false });
            console.error('Failed to propose meetup:', error);
            throw error;
        }
    },

    acceptMeetup: async (claimId) => {
        set({ isClaimLoading: true });
        try {
            const response = await api.patch(`/lost-found/claims/${claimId}/accept-meetup`);
            const updated = response.data?.data;
            if (updated) {
                set({
                    claims: get().claims.map(c => c._id === claimId ? updated : c),
                    myClaims: get().myClaims.map(c => c._id === claimId ? updated : c),
                    isClaimLoading: false
                });
            } else {
                set({ isClaimLoading: false });
            }
            return updated;
        } catch (error) {
            set({ isClaimLoading: false });
            console.error('Failed to accept meetup:', error);
            throw error;
        }
    },

    resolvePost: async (postId, claimId) => {
        set({ isLoading: true });
        try {
            const response = await api.patch(`/lost-found/${postId}/resolve/${claimId}`);
            const updated = response.data?.data;
            if (updated) {
                set({
                    currentPost: updated,
                    posts: get().posts.map(p => p._id === postId ? updated : p),
                    myPosts: get().myPosts.map(p => p._id === postId ? updated : p),
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
            }
            return updated;
        } catch (error) {
            set({ isLoading: false });
            console.error('Failed to resolve post:', error);
            throw error;
        }
    }
}));

export default useLostFoundStore;
