import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, Badge, Avatar } from '../ui';
import useAuthStore from '../../stores/authStore';

const statusColors = {
    PENDING: 'gray',
    ACCEPTED: 'primary',
    AGREEMENT_PROPOSED: 'warning',
    ACTIVE: 'success',
    RETURN_PENDING: 'warning',
    COMPLETED: 'success',
    DISPUTED: 'danger',
    CANCELLED: 'gray'
};

const statusLabels = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    AGREEMENT_PROPOSED: 'Agreement Pending',
    ACTIVE: 'Active',
    RETURN_PENDING: 'Return Pending',
    COMPLETED: 'Completed',
    DISPUTED: 'Disputed',
    CANCELLED: 'Cancelled'
};

export default function TransactionCard({ transaction }) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const isOwner = user?._id === transaction.owner?._id;
    const otherParty = isOwner ? transaction.requester : transaction.owner;

    return (
        <Card 
            hover 
            onClick={() => navigate(`/transactions/${transaction._id}`)}
        >
            <Card.Body className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {transaction.item?.photos?.[0] ? (
                        <img 
                            src={transaction.item.photos[0]} 
                            alt={transaction.item.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No image
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                            {transaction.item?.title || 'Item Deleted'}
                        </h3>
                        <Badge variant={statusColors[transaction.status]}>
                            {statusLabels[transaction.status]}
                        </Badge>
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                        {isOwner ? 'Requested by' : 'Owner'}: {otherParty?.fullName}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        <Avatar src={otherParty?.avatar} name={otherParty?.fullName} size="sm" />
                        <span className="text-sm text-gray-600">
                            {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                        </span>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
