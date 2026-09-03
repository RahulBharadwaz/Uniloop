import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, Input, Loader, Avatar, TrustScore } from '../../components/ui';
import { OfferModal, OfferCard } from '../../components/wanted';
import { 
    ArrowLeft, Edit, Trash2, MessageSquare, Clock, Gift, 
    DollarSign, Tag, AlertCircle, CheckCircle, Package,
    Calendar, Hash, Shield
} from 'lucide-react';
import useWantedItemStore from '../../stores/wantedItemStore';
import useAuthStore from '../../stores/authStore';

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
    low: { label: 'Low Priority', color: 'gray' },
    medium: { label: 'Medium Priority', color: 'warning' },
    high: { label: 'High Priority', color: 'danger' },
    urgent: { label: 'Urgent', color: 'danger' }
};

const budgetConfig = {
    FREE_ONLY: { icon: Gift, label: 'Free Only', color: 'success' },
    MAX_PRICE: { icon: DollarSign, label: 'Max Budget', color: 'warning' },
    ANY: { icon: Tag, label: 'Any Budget', color: 'gray' }
};

const conditionLabels = {
    any: 'Any Condition',
    new: 'New Only',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair'
};

export default function WantedItemDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { 
        currentItem, 
        fetchItemDetail, 
        fetchItemOffers,
        deleteItem, 
        acceptOffer, 
        rejectOffer, 
        markFulfilled,
        isLoading,
        isOfferLoading
    } = useWantedItemStore();
    
    const [offers, setOffers] = useState([]);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadItem();
        if (searchParams.get('action') === 'offer') {
            setShowOfferModal(true);
        }
    }, [id]);

    const loadItem = async () => {
        try {
            await fetchItemDetail(id);
            const offerData = await fetchItemOffers(id);
            setOffers(offerData?.offers || offerData || []);
        } catch (error) {
            toast.error('Failed to load item');
        }
    };

    const isOwner = user?._id === currentItem?.user?._id;
    const item = currentItem;

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await deleteItem(id);
            toast.success('Request deleted');
            navigate('/wanted');
        } catch (error) {
            toast.error('Failed to delete request');
        } finally {
            setActionLoading(false);
            setShowDeleteModal(false);
        }
    };

    const handleAcceptOffer = async (offer) => {
        setActionLoading(true);
        try {
            await acceptOffer(id, offer._id);
            toast.success('Offer accepted!');
            loadItem();
        } catch (error) {
            toast.error('Failed to accept offer');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectOffer = async () => {
        if (!selectedOffer) return;
        setActionLoading(true);
        try {
            await rejectOffer(id, selectedOffer._id, rejectReason);
            toast.success('Offer rejected');
            setShowRejectModal(false);
            setSelectedOffer(null);
            setRejectReason('');
            loadItem();
        } catch (error) {
            toast.error('Failed to reject offer');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkFulfilled = async (offerId) => {
        setActionLoading(true);
        try {
            await markFulfilled(id, offerId);
            toast.success('Request marked as fulfilled!');
            loadItem();
        } catch (error) {
            toast.error('Failed to mark as fulfilled');
        } finally {
            setActionLoading(false);
        }
    };

    const handleChat = (offer) => {
        navigate(`/wanted/chat/${offer._id}`);
    };

    if (isLoading && !item) {
        return (
            <div className="flex justify-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    if (!item) {
        return (
            <Card className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Request not found</h3>
                <p className="text-gray-500 mb-4">This request may have been deleted or doesn't exist.</p>
                <Button onClick={() => navigate('/wanted')}>
                    <ArrowLeft size={18} />
                    Back to Wanted Items
                </Button>
            </Card>
        );
    }

    const budget = budgetConfig[item.budgetType] || budgetConfig.ANY;
    const urgency = urgencyConfig[item.urgency] || urgencyConfig.medium;
    const BudgetIcon = budget.icon;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/wanted')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Wanted Items
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Item Details */}
                    <Card>
                        <Card.Body>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <Badge variant="primary" className="mb-2">
                                        {categoryLabels[item.category] || item.category}
                                    </Badge>
                                    <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                                </div>
                                <Badge variant={urgency.color}>
                                    {urgency.label}
                                </Badge>
                            </div>

                            {item.referenceImage && (
                                <div className="mb-6 rounded-xl overflow-hidden bg-gray-100">
                                    <img
                                        src={item.referenceImage}
                                        alt={item.title}
                                        className="w-full max-h-96 object-contain"
                                    />
                                </div>
                            )}

                            <div className="prose max-w-none mb-6">
                                <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <BudgetIcon size={14} />
                                        Budget
                                    </div>
                                    <p className="font-semibold">
                                        {item.budgetType === 'MAX_PRICE' 
                                            ? `Max $${item.maxPrice}` 
                                            : budget.label}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Hash size={14} />
                                        Quantity
                                    </div>
                                    <p className="font-semibold">{item.quantity || 1}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Shield size={14} />
                                        Condition
                                    </div>
                                    <p className="font-semibold">
                                        {conditionLabels[item.preferredCondition] || 'Any'}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                        <Calendar size={14} />
                                        Posted
                                    </div>
                                    <p className="font-semibold">
                                        {format(new Date(item.createdAt), 'MMM d, yyyy')}
                                    </p>
                                </div>
                            </div>

                            {item.expiresAt && (
                                <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-center gap-2">
                                    <Clock size={16} className="text-yellow-600" />
                                    <span className="text-yellow-800">
                                        Expires: {format(new Date(item.expiresAt), 'MMMM d, yyyy')}
                                    </span>
                                </div>
                            )}

                            {item.isFulfilled && (
                                <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-3">
                                    <CheckCircle size={24} className="text-green-600" />
                                    <div>
                                        <p className="font-semibold text-green-800">This request has been fulfilled!</p>
                                        <p className="text-sm text-green-600">The owner found what they needed.</p>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Offers Section */}
                    {isOwner && (
                        <Card>
                            <Card.Header>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Offers Received</h3>
                                    <Badge variant="gray">{offers.length} offers</Badge>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {isOfferLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader />
                                    </div>
                                ) : offers.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500">No offers yet</p>
                                        <p className="text-sm text-gray-400">
                                            Share your request to get more offers
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {offers.map(offer => (
                                            <OfferCard
                                                key={offer._id}
                                                offer={offer}
                                                isOwner={true}
                                                onAccept={handleAcceptOffer}
                                                onReject={(offer) => {
                                                    setSelectedOffer(offer);
                                                    setShowRejectModal(true);
                                                }}
                                                onChat={handleChat}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Owner Info Card */}
                    <Card>
                        <Card.Body>
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar src={item.user?.avatar} name={item.user?.fullName} size="lg" />
                                <div>
                                    <p className="font-semibold text-gray-900">{item.user?.fullName}</p>
                                    <p className="text-sm text-gray-500">Looking for this item</p>
                                </div>
                            </div>
                            
                            {item.user?.trustScore && (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                                    <span className="text-gray-600">Trust Score</span>
                                    <TrustScore score={item.user.trustScore} size="md" />
                                </div>
                            )}

                            {!isOwner && !item.isFulfilled && (
                                <Button 
                                    className="w-full" 
                                    onClick={() => setShowOfferModal(true)}
                                >
                                    <Gift size={18} />
                                    Make an Offer
                                </Button>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Owner Actions */}
                    {isOwner && !item.isFulfilled && (
                        <Card>
                            <Card.Body className="space-y-3">
                                <Button 
                                    variant="secondary" 
                                    className="w-full"
                                    onClick={() => navigate(`/wanted/${id}/edit`)}
                                >
                                    <Edit size={18} />
                                    Edit Request
                                </Button>
                                {offers.some(o => o.status === 'ACCEPTED') && (
                                    <Button 
                                        variant="success" 
                                        className="w-full"
                                        onClick={() => {
                                            const acceptedOffer = offers.find(o => o.status === 'ACCEPTED');
                                            if (acceptedOffer) handleMarkFulfilled(acceptedOffer._id);
                                        }}
                                        loading={actionLoading}
                                    >
                                        <CheckCircle size={18} />
                                        Mark as Fulfilled
                                    </Button>
                                )}
                                <Button 
                                    variant="danger" 
                                    className="w-full"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <Trash2 size={18} />
                                    Delete Request
                                </Button>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Stats */}
                    <Card>
                        <Card.Header>
                            <h3 className="font-semibold">Statistics</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Views</span>
                                    <span className="font-medium">{item.views || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Offers</span>
                                    <span className="font-medium">{item.offersCount || offers.length}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Offer Modal */}
            <OfferModal
                isOpen={showOfferModal}
                onClose={() => setShowOfferModal(false)}
                item={item}
                onSuccess={loadItem}
            />

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setSelectedOffer(null);
                    setRejectReason('');
                }}
                title="Reject Offer"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to reject this offer? You can optionally provide a reason.
                    </p>
                    <Input
                        label="Reason (Optional)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Why are you rejecting this offer?"
                    />
                    <div className="flex gap-3">
                        <Button 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => {
                                setShowRejectModal(false);
                                setSelectedOffer(null);
                                setRejectReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            className="flex-1"
                            onClick={handleRejectOffer}
                            loading={actionLoading}
                        >
                            Reject Offer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Request"
                size="sm"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} className="text-red-600" />
                    </div>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete this request? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            className="flex-1"
                            onClick={handleDelete}
                            loading={actionLoading}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
