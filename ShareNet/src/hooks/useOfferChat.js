import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import api from '../lib/axios';

export const useOfferChat = (offerId) => {
    const [messages, setMessages] = useState([]);
    const [chat, setChat] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);

    useEffect(() => {
        if (!offerId) return;

        const initializeChat = async () => {
            try {
                // First get or create the chat for this offer
                const chatResponse = await api.get(`/offer-chats/${offerId}`);
                const chatData = chatResponse.data.data;
                setChat(chatData);

                // Then fetch messages
                const messagesResponse = await api.get(`/offer-chats/${offerId}/messages`);
                const msgData = messagesResponse.data.data;
                setMessages(msgData.messages || msgData || []);
            } catch (error) {
                console.error('Failed to fetch offer messages:', error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };

        initializeChat();

        const socket = getSocket();
        if (socket) {
            socket.emit('join-offer-chat', offerId);

            socket.on('new-offer-message', (message) => {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            });

            socket.on('offer-user-typing', ({ userId }) => {
                setTypingUser(userId);
            });

            socket.on('offer-user-stop-typing', () => {
                setTypingUser(null);
            });

            socket.on('offer-message-read', ({ messageId, readBy }) => {
                setMessages(prev => prev.map(m => 
                    m._id === messageId ? { ...m, readBy: [...(m.readBy || []), readBy] } : m
                ));
            });

            socket.on('offer-meetup-response', ({ messageId, status }) => {
                setMessages(prev => prev.map(m => 
                    m._id === messageId ? { ...m, meetupStatus: status } : m
                ));
            });
        }

        return () => {
            if (socket) {
                socket.emit('leave-offer-chat', offerId);
                socket.off('new-offer-message');
                socket.off('offer-user-typing');
                socket.off('offer-user-stop-typing');
                socket.off('offer-message-read');
                socket.off('offer-meetup-response');
            }
        };
    }, [offerId]);

    const sendMessage = useCallback(async (content, type = 'TEXT') => {
        if (!offerId || !content.trim()) return;
        
        try {
            const response = await api.post(`/offer-chats/${offerId}/messages`, { 
                content, 
                type 
            });
            const newMessage = response.data.data;
            setMessages(prev => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
            return newMessage;
        } catch (error) {
            console.error('Failed to send offer message:', error);
            throw error;
        }
    }, [offerId]);

    const sendImage = useCallback(async (file) => {
        if (!offerId || !file) return;
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('content', 'Sent an image');
            formData.append('type', 'IMAGE');
            
            const response = await api.post(`/offer-chats/${offerId}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newMessage = response.data.data;
            setMessages(prev => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
            return newMessage;
        } catch (error) {
            console.error('Failed to send image:', error);
            throw error;
        }
    }, [offerId]);

    const sendLocation = useCallback(async (location) => {
        if (!offerId) return;
        
        try {
            const response = await api.post(`/offer-chats/${offerId}/messages`, {
                type: 'LOCATION',
                content: 'Shared a location',
                location
            });
            const newMessage = response.data.data;
            setMessages(prev => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
            return newMessage;
        } catch (error) {
            console.error('Failed to send location:', error);
            throw error;
        }
    }, [offerId]);

    const proposeMeetup = useCallback(async (meetupData) => {
        if (!offerId) return;
        
        try {
            const response = await api.post(`/offer-chats/${offerId}/meetup`, {
                location: meetupData.location,
                date: meetupData.date,
                time: meetupData.time,
                notes: meetupData.notes
            });
            const newMessage = response.data.data;
            setMessages(prev => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
            return newMessage;
        } catch (error) {
            console.error('Failed to propose meetup:', error);
            throw error;
        }
    }, [offerId]);

    const respondToMeetup = useCallback(async (messageId, accept) => {
        try {
            const res = await api.post(`/offer-chats/${offerId}/meetup-response`, {
                messageId,
                response: accept ? 'ACCEPTED' : 'REJECTED'
            });
            return res.data.data;
        } catch (error) {
            console.error('Failed to respond to meetup:', error);
            throw error;
        }
    }, [offerId]);

    const markAsRead = useCallback(async (messageId) => {
        const socket = getSocket();
        if (socket && offerId) {
            socket.emit('offer-mark-read', { offerId, messageId });
        }
    }, [offerId]);

    const startTyping = useCallback(() => {
        const socket = getSocket();
        if (socket && offerId && !isTyping) {
            socket.emit('offer-typing', { offerId });
            setIsTyping(true);
        }
    }, [offerId, isTyping]);

    const stopTyping = useCallback(() => {
        const socket = getSocket();
        if (socket && offerId && isTyping) {
            socket.emit('offer-stop-typing', { offerId });
            setIsTyping(false);
        }
    }, [offerId, isTyping]);

    return {
        messages,
        isLoading,
        typingUser,
        chat,
        sendMessage,
        sendImage,
        sendLocation,
        proposeMeetup,
        respondToMeetup,
        markAsRead,
        startTyping,
        stopTyping
    };
};
