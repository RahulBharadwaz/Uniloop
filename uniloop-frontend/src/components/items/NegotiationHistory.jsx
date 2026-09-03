import { DollarSign, Calendar, MessageSquare, User, ArrowRight } from 'lucide-react';

export default function NegotiationHistory({ history = [], currentUserId }) {
    if (!history || history.length === 0) {
        return null;
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <MessageSquare size={16} />
                Negotiation History
            </h4>
            <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                    {history.map((entry, index) => {
                        const isCurrentUser = entry.by === currentUserId || entry.by?._id === currentUserId;
                        return (
                            <div key={index} className="relative pl-10">
                                <div className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                                    entry.status === 'ACCEPTED' 
                                        ? 'bg-green-500 border-green-500' 
                                        : entry.status === 'REJECTED'
                                        ? 'bg-red-500 border-red-500'
                                        : 'bg-white border-blue-500'
                                }`} />
                                <div className={`p-3 rounded-lg ${
                                    isCurrentUser ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <User size={14} className="text-gray-500" />
                                            <span className="font-medium">
                                                {isCurrentUser ? 'You' : (entry.by?.fullName || 'Other party')}
                                            </span>
                                            {entry.type && (
                                                <span className={`px-2 py-0.5 rounded text-xs ${
                                                    entry.type === 'COUNTER' 
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : entry.type === 'INITIAL'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {entry.type === 'COUNTER' ? 'Counter-offer' : 'Initial offer'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(entry.createdAt)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                        {entry.price !== undefined && (
                                            <div className="flex items-center gap-1">
                                                <DollarSign size={14} className="text-gray-500" />
                                                <span className="font-medium">${entry.price}</span>
                                            </div>
                                        )}
                                        {entry.rentalDays && (
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} className="text-gray-500" />
                                                <span>{entry.rentalDays} days</span>
                                            </div>
                                        )}
                                        {entry.status && entry.status !== 'PENDING' && (
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                entry.status === 'ACCEPTED' 
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {entry.status}
                                            </span>
                                        )}
                                    </div>
                                    {entry.message && (
                                        <p className="text-sm text-gray-600 mt-2 italic">
                                            "{entry.message}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
