import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loader, Modal, Input } from '../../components/ui';
import { OfferCard } from '../../components/wanted';
import { ArrowLeft, Send, Inbox, Package, AlertCircle } from 'lucide-react';
import useWantedItemStore from '../../stores/wantedItemStore';
import useAuthStore from '../../stores/authStore';

export default function MyOffers() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { 
        myOffers, 
        receivedOffers, 
        fetchMyOffers, 
        fetchReceivedOffers,
        cancelOffer,
        acceptOffer,
        rejectOffer,
        isOfferLoading 
    } = useWantedItemStore();

    const [activeTab, setActiveTab] = useState('made');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'made') {
            fetchMyOffers();
        } else {
            fetchReceivedOffers();
        }
    }, [activeTab]);

    const handleCancelOffer = async () => {
        if (!selectedOffer) return;
        setActionLoading(true);
        try {
            const itemId = selectedOffer.wantedItem?._id;
            const offerId = selectedOffer.offer?._id || selectedOffer._id;
            await cancelOffer(itemId, offerId);
            toast.success('Offer cancelled');
            setShowCancelModal(false);
            setSelectedOffer(null);
            fetchMyOffers();
        } catch (error) {
            toast.error('Failed to cancel offer');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptOffer = async (offer) => {
        setActionLoading(true);
        try {
            const itemId = offer.wantedItem?._id;
            const offerId = offer._id;
            await acceptOffer(itemId, offerId);
            toast.success('Offer accepted!');
            fetchReceivedOffers();
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
            const itemId = selectedOffer.wantedItem?._id;
            const offerId = selectedOffer._id;
            await rejectOffer(itemId, offerId, rejectReason);
            toast.success('Offer rejected');
            setShowRejectModal(false);
            setSelectedOffer(null);
            setRejectReason('');
            fetchReceivedOffers();
        } catch (error) {
            toast.error('Failed to reject offer');
        } finally {
            setActionLoading(false);
        }
    };

    const handleChat = (offer) => {
        const offerId = offer.offer?._id || offer._id;
        navigate(`/wanted/chat/${offerId}`);
    };

    const tabs = [
        { id: 'made', label: 'Offers I Made', icon: Send, count: myOffers.length },
        { id: 'received', label: 'Offers Received', icon: Inbox, count: receivedOffers.length }
    ];

    const offers = activeTab === 'made' ? myOffers : receivedOffers;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/wanted')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Wanted Items
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Offers</h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                            ${activeTab === tab.id 
                                ? 'bg-purple-600 text-white shadow-lg' 
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}
                        `}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <Badge 
                            variant={activeTab === tab.id ? 'gray' : 'primary'}
                            className={activeTab === tab.id ? 'bg-white/20 text-white' : ''}
                        >
                            {tab.count}
                        </Badge>
                    </button>
                ))}
            </div>

            {/* Offers List */}
            {isOfferLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : offers.length === 0 ? (
                <Card className="text-center py-16">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Package size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {activeTab === 'made' ? 'No offers made yet' : 'No offers received'}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            {activeTab === 'made' 
                                ? "Browse wanted items and make offers to help others find what they need."
                                : "Post a request and wait for offers from the community."}
                        </p>
                        <Button onClick={() => navigate('/wanted')}>
                            Browse Wanted Items
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {offers.map(item => {
                        // For "made" tab: item is { wantedItem, offer }
                        // For "received" tab: item is already flattened { ...offer, wantedItem }
                        const offerData = activeTab === 'made' 
                            ? { ...item.offer, wantedItem: item.wantedItem }
                            : item;
                        const key = activeTab === 'made' 
                            ? item.offer?._id 
                            : item._id;
                        return (
                            <OfferCard
                                key={key}
                                offer={offerData}
                                isOwner={activeTab === 'received'}
                                showItemInfo={true}
                                onAccept={handleAcceptOffer}
                                onReject={(offer) => {
                                    setSelectedOffer(offer);
                                    setShowRejectModal(true);
                                }}
                                onCancel={(offer) => {
                                    setSelectedOffer(offer);
                                    setShowCancelModal(true);
                                }}
                                onChat={handleChat}
                            />
                        );
                    })}
                </div>
            )}

            {/* Cancel Offer Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setSelectedOffer(null);
                }}
                title="Cancel Offer"
                size="sm"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-yellow-600" />
                    </div>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to cancel this offer? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => {
                                setShowCancelModal(false);
                                setSelectedOffer(null);
                            }}
                        >
                            Keep Offer
                        </Button>
                        <Button 
                            variant="danger" 
                            className="flex-1"
                            onClick={handleCancelOffer}
                            loading={actionLoading}
                        >
                            Cancel Offer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Reject Offer Modal */}
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
        </div>
    );
}
