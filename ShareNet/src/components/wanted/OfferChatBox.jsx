import { useState, useRef, useEffect } from 'react';
import { Send, Image, MapPin, Calendar, Check, X } from 'lucide-react';
import { Avatar, Loader, Button, Modal } from '../ui';
import { useOfferChat } from '../../hooks/useOfferChat';
import useAuthStore from '../../stores/authStore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OfferChatBox({ offerId, offer }) {
    const { 
        messages, 
        isLoading, 
        typingUser, 
        sendMessage,
        sendImage,
        sendLocation,
        proposeMeetup,
        respondToMeetup,
        startTyping, 
        stopTyping 
    } = useOfferChat(offerId);
    
    const { user } = useAuthStore();
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [showMeetupModal, setShowMeetupModal] = useState(false);
    const [meetupForm, setMeetupForm] = useState({
        date: '',
        time: '',
        location: '',
        notes: ''
    });
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

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

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSending(true);
        try {
            await sendImage(file);
            toast.success('Image sent');
        } catch (error) {
            toast.error('Failed to send image');
        } finally {
            setSending(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleShareLocation = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await sendLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    toast.success('Location shared');
                } catch (error) {
                    toast.error('Failed to share location');
                }
            },
            () => {
                toast.error('Unable to get your location');
            }
        );
    };

    const handleProposeMeetup = async () => {
        if (!meetupForm.date || !meetupForm.time || !meetupForm.location) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await proposeMeetup(meetupForm);
            setShowMeetupModal(false);
            setMeetupForm({ date: '', time: '', location: '', notes: '' });
            toast.success('Meetup proposal sent');
        } catch (error) {
            toast.error('Failed to propose meetup');
        }
    };

    const handleMeetupResponse = async (messageId, accept) => {
        try {
            await respondToMeetup(messageId, accept);
            toast.success(accept ? 'Meetup accepted' : 'Meetup declined');
        } catch (error) {
            toast.error('Failed to respond to meetup');
        }
    };

    const renderMessage = (message) => {
        const isMe = message.sender._id === user._id;
        const isSystem = message.type === 'SYSTEM';

        if (isSystem) {
            return (
                <div key={message._id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full">
                        {message.content}
                    </div>
                </div>
            );
        }

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
                    {message.type === 'TEXT' && (
                        <div className={`
                            inline-block px-4 py-2 rounded-2xl
                            ${isMe 
                                ? 'bg-blue-500 text-white rounded-br-sm' 
                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                            }
                        `}>
                            {message.content}
                        </div>
                    )}

                    {message.type === 'IMAGE' && (
                        <img 
                            src={message.image || message.content} 
                            alt="Shared image" 
                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                            onClick={() => window.open(message.image || message.content, '_blank')}
                        />
                    )}

                    {message.type === 'LOCATION' && (
                        <div className={`
                            inline-block px-4 py-3 rounded-2xl
                            ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}
                        `}>
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin size={16} />
                                <span className="font-medium">Location Shared</span>
                            </div>
                            <a 
                                href={`https://www.google.com/maps?q=${message.location?.coordinates?.lat || message.location?.lat},${message.location?.coordinates?.lng || message.location?.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm underline ${isMe ? 'text-blue-100' : 'text-blue-600'}`}
                            >
                                View on Google Maps
                            </a>
                        </div>
                    )}

                    {message.type === 'MEETUP_PROPOSAL' && (
                        <div className={`
                            inline-block px-4 py-3 rounded-2xl min-w-[250px]
                            ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}
                        `}>
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={16} />
                                <span className="font-medium">Meetup Proposal</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                {message.meetup?.date && (
                                    <p><strong>Date:</strong> {format(new Date(message.meetup.date), 'MMM d, yyyy')}</p>
                                )}
                                <p><strong>Time:</strong> {message.meetup?.time}</p>
                                <p><strong>Location:</strong> {message.meetup?.location}</p>
                                {message.meetup?.notes && (
                                    <p><strong>Notes:</strong> {message.meetup?.notes}</p>
                                )}
                            </div>
                            {!isMe && message.meetup?.status === 'PENDING' && (
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleMeetupResponse(message._id, true)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                                    >
                                        <Check size={14} /> Accept
                                    </button>
                                    <button
                                        onClick={() => handleMeetupResponse(message._id, false)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                                    >
                                        <X size={14} /> Decline
                                    </button>
                                </div>
                            )}
                            {message.meetup?.status === 'ACCEPTED' && (
                                <div className="mt-3 text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg">
                                    Meetup Accepted
                                </div>
                            )}
                            {message.meetup?.status === 'REJECTED' && (
                                <div className="mt-3 text-sm bg-red-100 text-red-700 px-3 py-1.5 rounded-lg">
                                    Meetup Declined
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-xs text-gray-400 mt-1">
                        {format(new Date(message.timestamp || message.createdAt), 'h:mm a')}
                    </p>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] bg-white rounded-xl border">
            {offer && (
                <div className="p-3 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        {offer.wantedItem?.images?.[0] && (
                            <img 
                                src={offer.wantedItem.images[0]} 
                                alt="" 
                                className="w-10 h-10 rounded-lg object-cover"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                                {offer.wantedItem?.title || 'Wanted Item'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Offer #{offerId?.slice(-6)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>No messages yet.</p>
                        <p className="text-sm mt-1">Start the conversation to coordinate the offer!</p>
                    </div>
                ) : (
                    messages.map(renderMessage)
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

            <div className="p-4 border-t">
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Send image"
                    >
                        <Image size={20} />
                    </button>
                    <button
                        onClick={handleShareLocation}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Share location"
                    >
                        <MapPin size={20} />
                    </button>
                    <button
                        onClick={() => setShowMeetupModal(true)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Propose meetup"
                    >
                        <Calendar size={20} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
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
                </form>
            </div>

            <Modal
                isOpen={showMeetupModal}
                onClose={() => setShowMeetupModal(false)}
                title="Propose a Meetup"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date *
                        </label>
                        <input
                            type="date"
                            value={meetupForm.date}
                            onChange={(e) => setMeetupForm({ ...meetupForm, date: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time *
                        </label>
                        <input
                            type="time"
                            value={meetupForm.time}
                            onChange={(e) => setMeetupForm({ ...meetupForm, time: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location *
                        </label>
                        <input
                            type="text"
                            value={meetupForm.location}
                            onChange={(e) => setMeetupForm({ ...meetupForm, location: e.target.value })}
                            placeholder="e.g., Campus Library Entrance"
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (optional)
                        </label>
                        <textarea
                            value={meetupForm.notes}
                            onChange={(e) => setMeetupForm({ ...meetupForm, notes: e.target.value })}
                            placeholder="Any additional details..."
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowMeetupModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleProposeMeetup}
                            className="flex-1"
                        >
                            Send Proposal
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
