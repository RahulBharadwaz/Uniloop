import { useNavigate } from 'react-router-dom';
import { Card, Badge, Avatar, TrustScore } from '../ui';
import { Zap, Package, Users } from 'lucide-react';

const modeConfig = {
    RENT: { color: 'primary', label: 'For Rent' },
    SELL: { color: 'success', label: 'For Sale' },
    GIVE: { color: 'warning', label: 'Free' }
};

const conditionLabels = {
    NEW: { label: 'New', color: 'success' },
    LIKE_NEW: { label: 'Like New', color: 'success' },
    GOOD: { label: 'Good', color: 'primary' },
    FAIR: { label: 'Fair', color: 'warning' },
    POOR: { label: 'Poor', color: 'error' }
};

export default function ItemCard({ item }) {
    const navigate = useNavigate();
    const condition = conditionLabels[item.condition];
    const mode = modeConfig[item.mode];
    const claimedCount = item.claimedCount || 0;
    const maxClaimers = item.maxClaimers || 1;
    const isFullyClaimed = item.mode === 'GIVE' && item.instantClaim && claimedCount >= maxClaimers;

    return (
        <Card 
            hover 
            onClick={() => navigate(`/items/${item._id}`)}
            className="overflow-hidden"
        >
            <div className="aspect-video relative bg-gray-100">
                {item.photos?.[0] ? (
                    <img 
                        src={item.photos[0]} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                    </div>
                )}
                
                {/* Badges container */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    <Badge 
                        variant={mode.color} 
                        title={mode.label}
                    >
                        {mode.label}
                    </Badge>
                    {item.mode === 'GIVE' && item.instantClaim && (
                        <Badge variant="warning" className="text-xs" title="Instant claim - join the queue immediately">
                            <Zap size={12} className="mr-1" />
                            Instant
                        </Badge>
                    )}
                </div>

                {/* Condition badge */}
                {condition && (
                    <div className="absolute top-2 left-2">
                        <Badge variant={condition.color} className="text-xs" title={`Item condition: ${condition.label}`}>
                            <Package size={12} className="mr-1" />
                            {condition.label}
                        </Badge>
                    </div>
                )}

                {/* Claimed count for free items */}
                {item.mode === 'GIVE' && item.instantClaim && (
                    <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-white/90" title={`${claimedCount} of ${maxClaimers} claim slots filled`}>
                            <Users size={12} className="mr-1" />
                            {claimedCount} of {maxClaimers} claimed
                        </Badge>
                    </div>
                )}

                {/* Unavailable overlay */}
                {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">Unavailable</span>
                    </div>
                )}

                {/* Fully claimed overlay */}
                {isFullyClaimed && item.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-medium">Fully Claimed</span>
                    </div>
                )}
            </div>
            <Card.Body>
                <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                {item.price > 0 ? (
                    <p className="text-lg font-bold text-blue-600 mt-2">
                        ${item.price}{item.mode === 'RENT' && '/day'}
                    </p>
                ) : item.mode === 'GIVE' && (
                    <p className="text-lg font-bold text-green-600 mt-2">Free</p>
                )}
                {item.owner && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Avatar src={item.owner.avatar} name={item.owner.fullName} size="sm" />
                        <span className="text-sm text-gray-600 flex-1">{item.owner.fullName}</span>
                        <TrustScore score={item.owner.trustScore} size="sm" />
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}
