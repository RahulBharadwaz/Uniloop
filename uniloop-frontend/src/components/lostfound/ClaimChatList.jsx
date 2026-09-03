import { useState, useEffect } from 'react';
import { Avatar, Loader, Badge } from '../ui';
import api from '../../lib/axios';
import useAuthStore from '../../stores/authStore';
import { format, formatDistanceToNow } from 'date-fns';

export default function ClaimChatList({ onSelectChat, selectedClaimId }) {
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await api.get('/claim-chats/my-chats');
                const data = response.data?.data;
                // API returns { chats: [...], pagination: {...} }
                const chatsArray = Array.isArray(data) ? data : (data?.chats || []);
                setChats(chatsArray);
            } catch (error) {
                console.error('Failed to fetch claim chats:', error);
                setChats([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChats();
    }, []);

    const getOtherParticipant = (chat) => {
        return chat.participants?.find(p => p._id !== user._id) || {};
    };

    const formatTimestamp = (date) => {
        if (!date) return '';
        const messageDate = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return format(messageDate, 'h:mm a');
        } else if (diffDays < 7) {
            return formatDistanceToNow(messageDate, { addSuffix: true });
        } else {
            return format(messageDate, 'MMM d');
        }
    };

    const getMessagePreview = (message) => {
        if (!message) return 'No messages yet';
        
        switch (message.type) {
            case 'IMAGE':
                return '📷 Image';
            case 'LOCATION':
                return '📍 Location shared';
            case 'MEETUP_PROPOSAL':
                return '📅 Meetup proposal';
            case 'SYSTEM':
                return message.content;
            default:
                return message.content?.length > 40 
                    ? message.content.substring(0, 40) + '...' 
                    : message.content;
        }
    };

    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No claim chats yet</h3>
                <p className="text-gray-500 text-sm">
                    When you make or receive a claim, your conversations will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y">
            {chats.map((chat) => {
                const otherUser = getOtherParticipant(chat);
                const isSelected = selectedClaimId === chat.claim?._id;
                const hasUnread = chat.unreadCount > 0;

                return (
                    <button
                        key={chat._id}
                        onClick={() => onSelectChat(chat.claim?._id, chat)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                            isSelected ? 'bg-blue-50' : ''
                        }`}
                    >
                        <div className="relative">
                            <Avatar 
                                src={otherUser.avatar} 
                                name={otherUser.fullName} 
                                size="md" 
                            />
                            {chat.claim?.status === 'APPROVED' && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {otherUser.fullName || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {formatTimestamp(chat.lastMessage?.timestamp || chat.lastMessage?.createdAt)}
                                </span>
                            </div>

                            <p className="text-sm text-gray-500 truncate mb-1">
                                {chat.claim?.post?.title || 'Lost & Found Item'}
                            </p>

                            <div className="flex items-center justify-between">
                                <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                    {chat.lastMessage?.sender?._id === user._id && (
                                        <span className="text-gray-400">You: </span>
                                    )}
                                    {getMessagePreview(chat.lastMessage)}
                                </p>
                                {hasUnread && (
                                    <Badge variant="primary" size="sm" className="ml-2 flex-shrink-0">
                                        {chat.unreadCount}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
