import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Avatar, Loader } from '../ui';
import { useChat } from '../../hooks/useChat';
import useAuthStore from '../../stores/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ChatBox({ transactionId }) {
    const { messages, isLoading, typingUser, sendMessage, startTyping, stopTyping } = useChat(transactionId);
    const { user } = useAuthStore();
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleInputChange = (e) => {
        setInput(e.target.value);
        startTyping();

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 1000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        setSending(true);
        try {
            await sendMessage(input.trim());
            setInput('');
            stopTyping();
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-96 bg-white rounded-xl border">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => {
                        const isMe = message.sender._id === user._id;
                        return (
                            <div
                                key={message._id}
                                className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                            >
                                <Avatar 
                                    src={message.sender.avatar} 
                                    name={message.sender.fullName} 
                                    size="sm" 
                                />
                                <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                                    <div className={`
                                        inline-block px-4 py-2 rounded-2xl
                                        ${isMe 
                                            ? 'bg-blue-500 text-white rounded-br-sm' 
                                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                        }
                                    `}>
                                        {message.content}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {format(new Date(message.timestamp || message.createdAt), 'h:mm a')}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                {typingUser && typingUser !== user._id && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 transition-colors"
                    >
                        {sending ? <Loader size="sm" /> : <Send size={18} />}
                    </button>
                </div>
            </form>
        </div>
    );
}
