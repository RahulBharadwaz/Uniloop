import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import api from '../lib/axios';

export const useChat = (transactionId) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);

    useEffect(() => {
        if (!transactionId) return;

        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/${transactionId}`);
                const data = response.data.data;
                setMessages(data.messages || data || []);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();

        // Socket for real-time updates (optional enhancement)
        const socket = getSocket();
        if (socket) {
            socket.emit('join-transaction', transactionId);

            socket.on('new-message', (message) => {
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            });

            socket.on('user-typing', ({ userId }) => {
                setTypingUser(userId);
            });

            socket.on('user-stop-typing', () => {
                setTypingUser(null);
            });
        }

        return () => {
            if (socket) {
                socket.emit('leave-transaction', transactionId);
                socket.off('new-message');
                socket.off('user-typing');
                socket.off('user-stop-typing');
            }
        };
    }, [transactionId]);

    // Use API to send messages (more reliable than socket-only)
    const sendMessage = useCallback(async (content) => {
        if (!transactionId || !content.trim()) return;
        
        try {
            const response = await api.post(`/messages/${transactionId}`, { content });
            const newMessage = response.data.data;
            setMessages(prev => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }, [transactionId]);

    const startTyping = useCallback(() => {
        const socket = getSocket();
        if (socket && transactionId && !isTyping) {
            socket.emit('typing', { transactionId });
            setIsTyping(true);
        }
    }, [transactionId, isTyping]);

    const stopTyping = useCallback(() => {
        const socket = getSocket();
        if (socket && transactionId && isTyping) {
            socket.emit('stop-typing', { transactionId });
            setIsTyping(false);
        }
    }, [transactionId, isTyping]);

    return {
        messages,
        isLoading,
        typingUser,
        sendMessage,
        startTyping,
        stopTyping
    };
};
