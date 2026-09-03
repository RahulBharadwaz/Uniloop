import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DollarSign, Gift, Clock, MessageSquare, Tag } from 'lucide-react';
import { Card, Badge, Avatar, Button } from '../ui';

const categoryLabels = {
    electronics: 'Electronics',
    furniture: 'Furniture',
    clothing: 'Clothing',
    books: 'Books',
    sports: 'Sports',
    kitchen: 'Kitchen',
    tools: 'Tools',
    other: 'Other'
};

const urgencyConfig = {
    low: { color: 'bg-gray-400', label: 'Low', textColor: 'text-gray-600' },
    medium: { color: 'bg-blue-500', label: 'Medium', textColor: 'text-blue-600' },
    high: { color: 'bg-orange-500', label: 'High', textColor: 'text-orange-600' },
    urgent: { color: 'bg-red-500', label: 'Urgent', textColor: 'text-red-600' }
};

const budgetConfig = {
    FREE_ONLY: { icon: Gift, label: 'Free Only', color: 'success' },
    MAX_PRICE: { icon: DollarSign, label: 'Max', color: 'warning' },
    ANY: { icon: Tag, label: 'Any Budget', color: 'gray' }
};

export default function WantedItemCard({ item, onMakeOffer, currentUser, showActions = true }) {
    const navigate = useNavigate();
    const isOwner = currentUser?._id === item.user?._id;
    const urgency = urgencyConfig[item.urgency] || urgencyConfig.medium;
    const budget = budgetConfig[item.budgetType] || budgetConfig.ANY;
    const BudgetIcon = budget.icon;

    const handleClick = () => {
        navigate(`/wanted/${item._id}`);
    };

    const handleMakeOffer = (e) => {
        e.stopPropagation();
        onMakeOffer?.(item);
    };

    return (
        <Card hover onClick={handleClick} className="overflow-hidden group">
            <div className="relative aspect-video bg-gray-100">
                {item.referenceImage ? (
                    <img
                        src={item.referenceImage}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-purple-100 to-blue-100">
                        <Tag size={40} className="text-purple-300" />
                    </div>
                )}

                <Badge variant="primary" className="absolute top-3 left-3">
                    {categoryLabels[item.category] || item.category}
                </Badge>

                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${urgency.color}`} 
                     title={`${urgency.label} urgency`} 
                />

                {item.isFulfilled && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge variant="success" className="text-sm">
                            Fulfilled
                        </Badge>
                    </div>
                )}
            </div>

            <Card.Body>
                <h3 className="font-semibold text-gray-900 truncate mb-1">{item.title}</h3>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {item.description}
                </p>

                <div className="flex items-center gap-2 mb-3">
                    <Badge variant={budget.color} className="flex items-center gap-1">
                        <BudgetIcon size={12} />
                        {item.budgetType === 'MAX_PRICE' 
                            ? `Max $${item.maxPrice}` 
                            : budget.label}
                    </Badge>
                    <div className={`flex items-center gap-1 text-xs ${urgency.textColor}`}>
                        <Clock size={12} />
                        {urgency.label}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar src={item.user?.avatar} name={item.user?.fullName} size="sm" />
                        <span className="text-sm text-gray-600 truncate max-w-[100px]">
                            {item.user?.fullName}
                        </span>
                    </div>

                    {item.offersCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MessageSquare size={14} />
                            <span>{item.offersCount}</span>
                        </div>
                    )}
                </div>

                {item.expiresAt && (
                    <div className="mt-2 text-xs text-gray-400">
                        Expires: {format(new Date(item.expiresAt), 'MMM d, yyyy')}
                    </div>
                )}
            </Card.Body>

            {showActions && !item.isFulfilled && !isOwner && (
                <Card.Footer className="pt-0">
                    <Button 
                        size="sm" 
                        className="w-full"
                        variant="primary"
                        onClick={handleMakeOffer}
                    >
                        Make an Offer
                    </Button>
                </Card.Footer>
            )}
        </Card>
    );
}
