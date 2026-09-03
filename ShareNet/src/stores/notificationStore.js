import { create } from 'zustand';
import api from '../lib/axios';
import { getSocket } from '../lib/socket';

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/notifications');
            const data = response.data.data;
            set({ notifications: data.notifications || data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            set({ unreadCount: response.data.data.count });
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    },

    markAsRead: async (id) => {
        await api.patch(`/notifications/${id}/read`);
        set({
            notifications: get().notifications.map(n => 
                n._id === id ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, get().unreadCount - 1)
        });
    },

    markAllAsRead: async () => {
        await api.patch('/notifications/read-all');
        set({
            notifications: get().notifications.map(n => ({ ...n, isRead: true })),
            unreadCount: 0
        });
    },

    addNotification: (notification) => {
        set({
            notifications: [notification, ...get().notifications],
            unreadCount: get().unreadCount + 1
        });
    },

    setupSocketListeners: () => {
        const socket = getSocket();
        if (socket) {
            socket.on('notification', (notification) => {
                get().addNotification(notification);
            });
        }
    }
}));

export default useNotificationStore;
