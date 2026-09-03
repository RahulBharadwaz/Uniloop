import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Card, Button, Loader } from '../components/ui';
import { 
    Bell, Check, MessageSquare, Package, AlertTriangle, Clock,
    Search, Gift, Heart, MapPin, XCircle, CheckCircle
} from 'lucide-react';
import useNotificationStore from '../stores/notificationStore';

const typeIcons = {
    // Transaction notifications
    REQUEST_RECEIVED: Package,
    REQUEST_ACCEPTED: Check,
    REQUEST_REJECTED: XCircle,
    AGREEMENT_PROPOSED: MessageSquare,
    AGREEMENT_CONFIRMED: Check,
    RETURN_PENDING: Clock,
    TRANSACTION_COMPLETED: CheckCircle,
    DISPUTE_RAISED: AlertTriangle,
    NEW_MESSAGE: MessageSquare,
    REMINDER: Clock,
    OVERDUE: AlertTriangle,
    // Lost & Found notifications
    LOST_FOUND_CLAIM: Search,
    LOST_FOUND_VERIFICATION: Search,
    LOST_FOUND_VERIFIED: CheckCircle,
    LOST_FOUND_REJECTED: XCircle,
    LOST_FOUND_MEETUP: MapPin,
    LOST_FOUND_MEETUP_ACCEPTED: CheckCircle,
    LOST_FOUND_RESOLVED: CheckCircle,
    LOST_FOUND_MESSAGE: MessageSquare,
    // Wanted Items notifications
    WANTED_OFFER_RECEIVED: Gift,
    WANTED_OFFER_ACCEPTED: CheckCircle,
    WANTED_OFFER_REJECTED: XCircle,
    WANTED_OFFER_MESSAGE: MessageSquare,
    WANTED_FULFILLED: Heart
};

const typeColors = {
    // Transaction notifications
    REQUEST_RECEIVED: 'bg-blue-100 text-blue-600',
    REQUEST_ACCEPTED: 'bg-green-100 text-green-600',
    REQUEST_REJECTED: 'bg-red-100 text-red-600',
    AGREEMENT_PROPOSED: 'bg-yellow-100 text-yellow-600',
    AGREEMENT_CONFIRMED: 'bg-green-100 text-green-600',
    RETURN_PENDING: 'bg-orange-100 text-orange-600',
    TRANSACTION_COMPLETED: 'bg-green-100 text-green-600',
    DISPUTE_RAISED: 'bg-red-100 text-red-600',
    NEW_MESSAGE: 'bg-blue-100 text-blue-600',
    REMINDER: 'bg-orange-100 text-orange-600',
    OVERDUE: 'bg-red-100 text-red-600',
    // Lost & Found notifications
    LOST_FOUND_CLAIM: 'bg-purple-100 text-purple-600',
    LOST_FOUND_VERIFICATION: 'bg-blue-100 text-blue-600',
    LOST_FOUND_VERIFIED: 'bg-green-100 text-green-600',
    LOST_FOUND_REJECTED: 'bg-red-100 text-red-600',
    LOST_FOUND_MEETUP: 'bg-indigo-100 text-indigo-600',
    LOST_FOUND_MEETUP_ACCEPTED: 'bg-green-100 text-green-600',
    LOST_FOUND_RESOLVED: 'bg-green-100 text-green-600',
    LOST_FOUND_MESSAGE: 'bg-blue-100 text-blue-600',
    // Wanted Items notifications
    WANTED_OFFER_RECEIVED: 'bg-purple-100 text-purple-600',
    WANTED_OFFER_ACCEPTED: 'bg-green-100 text-green-600',
    WANTED_OFFER_REJECTED: 'bg-red-100 text-red-600',
    WANTED_OFFER_MESSAGE: 'bg-blue-100 text-blue-600',
    WANTED_FULFILLED: 'bg-green-100 text-green-600'
};

export default function Notifications() {
    const navigate = useNavigate();
    const { notifications, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }
        
        // Determine redirect based on notification type
        const type = notification.type;
        
        // Transaction-related notifications
        if (notification.relatedTransaction) {
            navigate(`/transactions/${notification.relatedTransaction}`);
            return;
        }
        
        // Request-related notifications
        if (notification.relatedRequest) {
            navigate('/requests');
            return;
        }
        
        // Lost & Found notifications
        if (type?.startsWith('LOST_FOUND_')) {
            if (notification.relatedClaim) {
                // For claim-related notifications, go to chat or claims page
                if (type === 'LOST_FOUND_VERIFIED' || type === 'LOST_FOUND_MESSAGE' || 
                    type === 'LOST_FOUND_MEETUP' || type === 'LOST_FOUND_MEETUP_ACCEPTED') {
                    navigate(`/lost-found/chat/${notification.relatedClaim}`);
                } else {
                    navigate('/lost-found/claims');
                }
            } else if (notification.relatedLostFound) {
                navigate(`/lost-found/${notification.relatedLostFound}`);
            } else {
                navigate('/lost-found/claims');
            }
            return;
        }
        
        // Wanted Items notifications
        if (type?.startsWith('WANTED_')) {
            if (notification.relatedOffer) {
                // For offer-related notifications
                if (type === 'WANTED_OFFER_ACCEPTED' || type === 'WANTED_OFFER_MESSAGE') {
                    navigate(`/wanted/chat/${notification.relatedOffer}`);
                } else {
                    navigate('/wanted/my-offers');
                }
            } else if (notification.relatedWantedItem) {
                navigate(`/wanted/${notification.relatedWantedItem}`);
            } else {
                navigate('/wanted/my-offers');
            }
            return;
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                    <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
                        Mark all as read
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : notifications.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-12">
                        <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No notifications yet</p>
                    </Card.Body>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map(notification => {
                        const Icon = typeIcons[notification.type] || Bell;
                        const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600';

                        return (
                            <Card 
                                key={notification._id}
                                hover
                                onClick={() => handleClick(notification)}
                                className={!notification.isRead ? 'border-l-4 border-l-blue-500' : ''}
                            >
                                <Card.Body className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    )}
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
