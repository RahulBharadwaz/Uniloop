import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
    MessageSquare, 
    CheckCircle, 
    XCircle, 
    Clock,
    Gift,
    DollarSign,
    Image
} from 'lucide-react';
import { Card, Badge, Avatar, Button } from '../ui';

const statusConfig = {
    PENDING: { color: 'warning', label: 'Pending', icon: Clock },
    ACCEPTED: { color: 'success', label: 'Accepted', icon: CheckCircle },
    REJECTED: { color: 'danger', label: 'Rejected', icon: XCircle }
};

const offerTypeConfig = {
    FREE: { color: 'success', label: 'Free', icon: Gift },
    SELL: { color: 'primary', label: 'For Sale', icon: DollarSign },
    RENT: { color: 'warning', label: 'For Rent', icon: Clock }
};

export default function OfferCard({ 
    offer, 
    onAccept, 
    onReject, 
    onChat, 
    onCancel,
    isOwner,
    showItemInfo = false
}) {
    const navigate = useNavigate();
    const status = statusConfig[offer.status] || statusConfig.PENDING;
    const offerType = offerTypeConfig[offer.offerType] || offerTypeConfig.FREE;
    const StatusIcon = status.icon;
    const OfferTypeIcon = offerType.icon;

    return (
        <Card className="overflow-hidden">
            <Card.Body>
                {showItemInfo && offer.wantedItem && (
                    <div className="mb-4 pb-4 border-b">
                        <p className="text-sm text-gray-500">Offer for:</p>
                        <p className="font-medium text-gray-900">{offer.wantedItem.title}</p>
                    </div>
                )}

                <div className="flex items-start gap-3">
                    <Avatar 
                        src={offer.offerer?.avatar} 
                        name={offer.offerer?.fullName} 
                        size="md" 
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-900">
                                {offer.offerer?.fullName}
                            </span>
                            <Badge variant={status.color}>
                                <StatusIcon size={12} className="mr-1" />
                                {status.label}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                            {format(new Date(offer.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <Badge variant={offerType.color}>
                        <OfferTypeIcon size={12} className="mr-1" />
                        {offerType.label}
                    </Badge>
                    {offer.price > 0 && (
                        <span className="font-semibold text-gray-900">
                            ${offer.price}
                            {offer.offerType === 'RENT' && <span className="text-sm text-gray-500">/day</span>}
                        </span>
                    )}
                </div>

                <p className="mt-3 text-gray-700">{offer.message}</p>

                {offer.photos?.length > 0 && (
                    <div className="mt-3 flex gap-2">
                        {offer.photos.map((photo, idx) => (
                            <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={photo}
                                    alt={`Offer photo ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {offer.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                            <strong>Rejection reason:</strong> {offer.rejectionReason}
                        </p>
                    </div>
                )}
            </Card.Body>

            <Card.Footer className="flex gap-2 flex-wrap">
                {offer.status === 'ACCEPTED' && (
                    <Button variant="primary" size="sm" onClick={() => navigate(`/wanted/chat/${offer._id}`)}>
                        <MessageSquare size={16} />
                        Chat
                    </Button>
                )}

                {isOwner && offer.status === 'PENDING' && (
                    <>
                        <Button variant="success" size="sm" onClick={() => onAccept?.(offer)}>
                            <CheckCircle size={16} />
                            Accept
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onReject?.(offer)}>
                            <XCircle size={16} />
                            Reject
                        </Button>
                    </>
                )}

                {!isOwner && offer.status === 'PENDING' && (
                    <Button variant="secondary" size="sm" onClick={() => onCancel?.(offer)}>
                        <XCircle size={16} />
                        Cancel Offer
                    </Button>
                )}
            </Card.Footer>
        </Card>
    );
}
