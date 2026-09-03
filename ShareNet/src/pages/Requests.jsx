import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Card, Button, Badge, Avatar, Loader, Modal } from '../components/ui';
import { Check, X, MessageSquare } from 'lucide-react';
import useRequestStore from '../stores/requestStore';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Requests() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { myRequests, receivedRequests, isLoading, fetchMyRequests, fetchReceivedRequests, acceptRequest, rejectRequest, cancelRequest } = useRequestStore();
    const [tab, setTab] = useState(searchParams.get('tab') || 'received');
    const [actionLoading, setActionLoading] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRequest, setNewRequest] = useState({ description: '' });

    useEffect(() => {
        fetchMyRequests();
        fetchReceivedRequests();
    }, []);

    const handleAccept = async (id) => {
        setActionLoading(id);
        try {
            const result = await acceptRequest(id);
            toast.success('Request accepted!');
            if (result.data?.transaction) {
                navigate(`/transactions/${result.data.transaction._id}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id) => {
        setActionLoading(id);
        try {
            await rejectRequest(id);
            toast.success('Request rejected');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject request');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id) => {
        setActionLoading(id);
        try {
            await cancelRequest(id);
            toast.success('Request cancelled');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel request');
        } finally {
            setActionLoading(null);
        }
    };

    const goToItem = (request) => {
        if (request.item?._id) {
            navigate(`/items/${request.item._id}`);
        }
    };

    const statusColors = {
        PENDING: 'warning',
        ACCEPTED: 'success',
        REJECTED: 'danger',
        CANCELLED: 'gray'
    };

    const requests = tab === 'received' ? receivedRequests : myRequests;

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Inbox</h1>

            <div className="flex gap-2 mb-6">
                <Button
                    variant={tab === 'received' ? 'primary' : 'secondary'}
                    onClick={() => setTab('received')}
                >
                    Received Requests ({receivedRequests.filter(r => r.status === 'PENDING').length})
                </Button>
                <Button
                    variant={tab === 'sent' ? 'primary' : 'secondary'}
                    onClick={() => setTab('sent')}
                >
                    Sent Requests ({myRequests.length})
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : requests.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-12">
                        <p className="text-gray-500">
                            {tab === 'received' 
                                ? "You haven't received any requests yet" 
                                : "You haven't sent any requests yet"}
                        </p>
                    </Card.Body>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map(request => (
                        <Card 
                            key={request._id} 
                            hover
                            onClick={() => goToItem(request)}
                            className="cursor-pointer"
                        >
                            <Card.Body className="flex items-start gap-4">
                                {request.item && (
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {request.item.photos?.[0] ? (
                                            <img
                                                src={request.item.photos[0]}
                                                alt={request.item.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                No img
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold truncate">
                                            {request.item?.title || 'General Request'}
                                        </span>
                                        <Badge variant={statusColors[request.status]}>
                                            {request.status}
                                        </Badge>
                                        {request.item?.mode && (
                                            <Badge variant={
                                                request.item.mode === 'RENT' ? 'primary' : 
                                                request.item.mode === 'SELL' ? 'success' : 'warning'
                                            }>
                                                {request.item.mode === 'GIVE' ? 'Free' : request.item.mode}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                                    {request.proposedPrice > 0 && (
                                        <p className="text-sm font-medium text-blue-600 mt-1">
                                            Offered: ${request.proposedPrice}
                                            {request.item?.mode === 'RENT' && request.rentalDays && ` for ${request.rentalDays} days`}
                                        </p>
                                    )}
                                    
                                    <div className="flex items-center gap-2 mt-2">
                                        <Avatar 
                                            src={request.requester?.avatar} 
                                            name={request.requester?.fullName} 
                                            size="sm" 
                                        />
                                        <span className="text-sm text-gray-500">
                                            {tab === 'received' ? request.requester?.fullName : 'You'} • {format(new Date(request.createdAt), 'MMM d')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {tab === 'received' && request.status === 'PENDING' && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="success"
                                                title="Accept this request"
                                                onClick={(e) => { e.stopPropagation(); handleAccept(request._id); }}
                                                loading={actionLoading === request._id}
                                            >
                                                <Check size={16} />
                                                <span className="hidden sm:inline">Accept</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                title="Reject this request"
                                                onClick={(e) => { e.stopPropagation(); handleReject(request._id); }}
                                                loading={actionLoading === request._id}
                                            >
                                                <X size={16} />
                                                <span className="hidden sm:inline">Reject</span>
                                            </Button>
                                        </>
                                    )}
                                    {tab === 'sent' && request.status === 'PENDING' && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            title="Cancel your request"
                                            onClick={(e) => { e.stopPropagation(); handleCancel(request._id); }}
                                            loading={actionLoading === request._id}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
