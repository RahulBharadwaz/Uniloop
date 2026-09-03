import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Gift, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Card, Badge, Avatar, Button } from '../ui';

const typeConfig = {
    LOST: { color: 'danger', label: 'LOST' },
    FOUND: { color: 'success', label: 'FOUND' }
};

const urgencyConfig = {
    LOW: { color: 'bg-gray-400', label: 'Low' },
    MEDIUM: { color: 'bg-blue-500', label: 'Medium' },
    HIGH: { color: 'bg-orange-500', label: 'High' },
    CRITICAL: { color: 'bg-red-500', label: 'Critical' }
};

const statusConfig = {
    OPEN: { color: 'primary', label: 'Open' },
    CLAIMED: { color: 'warning', label: 'Claimed' },
    VERIFIED: { color: 'success', label: 'Verified' },
    RESOLVED: { color: 'gray', label: 'Resolved' }
};

export default function LostFoundCard({ post, onClaim, showActions = true }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/lost-found/${post._id}`);
    };

    const handleClaim = (e) => {
        e.stopPropagation();
        onClaim?.(post);
    };

    const claimButtonText = post.type === 'LOST' ? 'I Found It' : 'This is Mine';

    return (
        <Card hover onClick={handleClick} className="overflow-hidden">
            <div className="aspect-video relative bg-gray-100">
                {post.photos?.[0] ? (
                    <img 
                        src={post.photos[0]} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                    </div>
                )}
                <Badge 
                    variant={typeConfig[post.type]?.color} 
                    className="absolute top-2 left-2"
                >
                    {typeConfig[post.type]?.label}
                </Badge>
                {post.urgency && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-full">
                        <span className={`w-2 h-2 rounded-full ${urgencyConfig[post.urgency]?.color}`} />
                        <span className="text-xs font-medium text-gray-700">
                            {urgencyConfig[post.urgency]?.label}
                        </span>
                    </div>
                )}
                {post.status !== 'OPEN' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant={statusConfig[post.status]?.color} className="text-sm">
                            {statusConfig[post.status]?.label}
                        </Badge>
                    </div>
                )}
            </div>
            <Card.Body>
                <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin size={14} />
                    <span className="truncate">{post.location?.address || 'Location not specified'}</span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <Calendar size={14} />
                    <span>
                        {post.type === 'LOST' ? 'Lost' : 'Found'} on{' '}
                        {format(new Date(post.dateOccurred || post.createdAt), 'MMM d, yyyy')}
                    </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                    {post.reward?.offered && (
                        <div className="flex items-center gap-1 text-green-600">
                            <Gift size={14} />
                            <span className="text-sm font-medium">
                                {post.reward.amount ? `$${post.reward.amount} Reward` : 'Reward'}
                            </span>
                        </div>
                    )}
                    {post.claimsCount > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                            <MessageSquare size={14} />
                            <span className="text-sm">{post.claimsCount} claim{post.claimsCount !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

                {post.owner && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Avatar src={post.owner.avatar} name={post.owner.fullName} size="sm" />
                        <span className="text-sm text-gray-600 flex-1">{post.owner.fullName}</span>
                    </div>
                )}

                {showActions && post.status === 'OPEN' && onClaim && (
                    <Button 
                        variant={post.type === 'LOST' ? 'success' : 'primary'}
                        size="sm"
                        className="w-full mt-3"
                        onClick={handleClaim}
                    >
                        {claimButtonText}
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
}
