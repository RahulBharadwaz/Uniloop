import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import api from '../lib/axios';

export const useClaimChat = (claimId) => {
    const [messages, setMessages] = useState([]);
    const [chat, setChat] = useState(null);
    const [chatId, setChatId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);

    useEffect(() => {
        if (!claimId) return;

        const initializeChat = async () => {
            try {
                // First get or create the chat for this claim
                const chatResponse = await api.get(`/claim-chats/claim/${claimId}`);
                const chatData = chatResponse.data.data;
                setChat(chatData);
                setChatId(chatData._id);

                // Then fetch messages using the chatId
                const messagesResponse = await api.get(`/claim-chats/${chatData._id}/messages`);
                const msgData = messagesResponse.data.data;
                setMessages(msgData.messages || msgData || []);
            } catch (error) {
                console.error('Failed to fetch claim messages:', error);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };

        initializeChat();
    }, [claimId]);

    // Socket connection based on chatId
    useEffect(() => {
        if (!chatId) return;

        const socket = getSocket();
        if (socket) {
            socket.emit('join-claim-chat', chatId);

            socket.on('new-claim-message', (message) => {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            });

            socket.on('claim-user-typing', ({ userId }) => {
                setTypingUser(userId);
            });

            socket.on('claim-user-stop-typing', () => {
                setTypingUser(null);
            });

            socket.on('claim-messages-read', ({ chatId: readChatId, userId }) => {
                if (readChatId === chatId) {
                    setMessages(prev => prev.map(m => ({
                        ...m,
                        readBy: [...(m.readBy || []), { user: userId, readAt: new Date() }]
                    })));
                }
            });
        }

        return () => {
            if (socket) {
                socket.emit('leave-claim-chat', chatId);
                socket.off('new-claim-message');
                socket.off('claim-user-typing');
                socket.off('claim-user-stop-typing');
                socket.off('claim-messages-read');
            }
        };
    }, [chatId]);

    const sendMessage = useCallback(async (content, type = 'TEXT') => {
        if (!chatId || !content.trim()) return;
        
        try {
            const response = await api.post(`/claim-chats/${chatId}/messages`, { 
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
            console.error('Failed to send claim message:', error);
            throw error;
        }
    }, [chatId]);

    const sendImage = useCallback(async (file) => {
        if (!chatId || !file) return;
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('content', 'Sent an image');
            formData.append('messageType', 'IMAGE');
            
            const response = await api.post(`/claim-chats/${chatId}/messages`, formData, {
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
    }, [chatId]);

    const sendLocation = useCallback(async (location) => {
        if (!chatId) return;
        
        try {
            const response = await api.post(`/claim-chats/${chatId}/location`, {
                name: location.name || 'Shared Location',
                lat: location.lat,
                lng: location.lng
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
    }, [chatId]);

    const proposeMeetup = useCallback(async (meetupData) => {
        if (!chatId) return;
        
        try {
            // Combine date and time into a single ISO string
            const meetupTime = meetupData.date && meetupData.time 
                ? new Date(`${meetupData.date}T${meetupData.time}`).toISOString()
                : meetupData.time;
            
            const response = await api.post(`/claim-chats/${chatId}/meetup-proposal`, {
                location: meetupData.location,
                time: meetupTime
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
    }, [chatId]);

    const respondToMeetup = useCallback(async (messageId, accept) => {
        try {
            const response = await api.post(`/claim-chats/${chatId}/meetup-response`, {
                messageId,
                accept
            });
            return response.data.data;
        } catch (error) {
            console.error('Failed to respond to meetup:', error);
            throw error;
        }
    }, [chatId]);

    const markAsRead = useCallback(async () => {
        if (!chatId) return;
        try {
            await api.patch(`/claim-chats/${chatId}/read`);
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }, [chatId]);

    const startTyping = useCallback(() => {
        const socket = getSocket();
        if (socket && chatId && !isTyping) {
            socket.emit('claim-typing', { chatId });
            setIsTyping(true);
        }
    }, [chatId, isTyping]);

    const stopTyping = useCallback(() => {
        const socket = getSocket();
        if (socket && chatId && isTyping) {
            socket.emit('claim-stop-typing', { chatId });
            setIsTyping(false);
        }
    }, [chatId, isTyping]);

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
