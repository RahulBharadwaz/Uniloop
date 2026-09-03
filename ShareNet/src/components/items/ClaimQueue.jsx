import { Card, Button, Avatar, Badge } from '../ui';
import { Users, MessageSquare, Check, Clock, X } from 'lucide-react';

const statusConfig = {
    PENDING: { color: 'warning', icon: Clock, label: 'Pending' },
    CONFIRMED: { color: 'success', icon: Check, label: 'Confirmed' },
    COMPLETED: { color: 'primary', icon: Check, label: 'Picked Up' },
    CANCELLED: { color: 'error', icon: X, label: 'Cancelled' }
};

export default function ClaimQueue({ 
    item, 
    claims = [], 
    onConfirmPickup, 
    onContact,
    onCancelClaim,
    isLoading = false 
}) {
    const activeClaims = claims.filter(c => c.status !== 'CANCELLED');
    const maxClaimers = item?.maxClaimers || 1;

    if (activeClaims.length === 0) {
        return (
            <Card>
                <Card.Body className="text-center py-8">
                    <Users className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-gray-600">No claims yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                        {item?.instantClaim 
                            ? 'Users can instantly claim this item'
                            : 'Users need to request this item'}
                    </p>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users size={18} />
                    Claim Queue
                </h3>
                <span className="text-sm text-gray-500">
                    {activeClaims.length}/{maxClaimers} slots filled
                </span>
            </div>

            <div className="space-y-3">
                {activeClaims.map((claim, index) => {
                    const status = statusConfig[claim.status] || statusConfig.PENDING;
                    const StatusIcon = status.icon;

                    return (
                        <Card key={claim._id}>
                            <Card.Body className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                                    #{index + 1}
                                </div>
                                <Avatar 
                                    src={claim.requester?.avatar} 
                                    name={claim.requester?.fullName} 
                                    size="md" 
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{claim.requester?.fullName}</span>
                                        <Badge variant={status.color} className="text-xs">
                                            <StatusIcon size={12} className="mr-1" />
                                            {status.label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        @{claim.requester?.username}
                                    </p>
                                    {claim.claimedAt && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Claimed {new Date(claim.claimedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {onContact && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => onContact(claim)}
                                        >
                                            <MessageSquare size={14} />
                                            Chat
                                        </Button>
                                    )}
                                    {claim.status === 'PENDING' && onConfirmPickup && (
                                        <Button 
                                            size="sm"
                                            onClick={() => onConfirmPickup(claim._id)}
                                            loading={isLoading}
                                        >
                                            <Check size={14} />
                                            Confirm
                                        </Button>
                                    )}
                                    {claim.status === 'CONFIRMED' && onConfirmPickup && (
                                        <Button 
                                            size="sm"
                                            variant="success"
                                            onClick={() => onConfirmPickup(claim._id, 'COMPLETED')}
                                            loading={isLoading}
                                        >
                                            <Check size={14} />
                                            Mark Picked Up
                                        </Button>
                                    )}
                                    {['PENDING', 'CONFIRMED'].includes(claim.status) && onCancelClaim && (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => onCancelClaim(claim._id)}
                                        >
                                            <X size={14} />
                                        </Button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
