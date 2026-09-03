import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Avatar, TrustScore, Modal, Loader, Input } from '../components/ui';
import { 
    ChevronLeft, ChevronRight, MessageSquare, MapPin, Calendar, 
    Clock, DollarSign, Package, Shield 
} from 'lucide-react';
import useItemStore from '../stores/itemStore';
import useRequestStore from '../stores/requestStore';
import useAuthStore from '../stores/authStore';
import { 
    InstantClaimButton, 
    CounterOfferModal, 
    PickupDetailsModal, 
    NegotiationHistory,
    ClaimQueue 
} from '../components/items';

const modeColors = {
    RENT: 'primary',
    SELL: 'success',
    GIVE: 'warning'
};

const conditionLabels = {
    NEW: { label: 'New', color: 'success' },
    LIKE_NEW: { label: 'Like New', color: 'success' },
    GOOD: { label: 'Good', color: 'primary' },
    FAIR: { label: 'Fair', color: 'warning' },
    POOR: { label: 'Poor', color: 'error' }
};

export default function ItemDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentItem, isLoading, fetchItem } = useItemStore();
    const { 
        createRequest, 
        instantClaim, 
        getClaimQueue,
        createCounterOffer,
        respondToCounterOffer,
        proposePickupDetails,
        confirmPickupDetails
    } = useRequestStore();
    const { user, isAuthenticated } = useAuthStore();
    
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
    const [showPickupModal, setShowPickupModal] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [proposedPrice, setProposedPrice] = useState('');
    const [rentalDays, setRentalDays] = useState('');
    const [rentalStartDate, setRentalStartDate] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimQueue, setClaimQueue] = useState([]);
    const [userClaim, setUserClaim] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        fetchItem(id);
    }, [id]);

    useEffect(() => {
        if (currentItem?.mode === 'GIVE' && currentItem?.instantClaim) {
            loadClaimQueue();
        }
    }, [currentItem]);

    const loadClaimQueue = async () => {
        try {
            const queue = await getClaimQueue(id);
            setClaimQueue(queue || []);
            const myClaim = queue?.find(c => c.requester?._id === user?._id);
            setUserClaim(myClaim || null);
        } catch (error) {
            console.error('Failed to load claim queue:', error);
        }
    };

    const handleRequest = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setIsRequesting(true);
        try {
            const requestData = {
                item: id,
                description: requestMessage || `I'd like to ${currentItem.mode.toLowerCase()} this item.`
            };

            if (proposedPrice) {
                requestData.proposedPrice = parseFloat(proposedPrice);
            }

            if (currentItem.mode === 'RENT') {
                if (rentalDays) requestData.rentalDays = parseInt(rentalDays);
                if (rentalStartDate) requestData.rentalStartDate = rentalStartDate;
            }

            await createRequest(requestData);
            toast.success('Request sent! Check your Sent Requests to track it.');
            setShowRequestModal(false);
            resetRequestForm();
            navigate('/requests?tab=sent');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send request');
        } finally {
            setIsRequesting(false);
        }
    };

    const handleInstantClaim = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setIsClaiming(true);
        try {
            await instantClaim(id);
            toast.success('Item claimed successfully!');
            await Promise.all([loadClaimQueue(), fetchItem(id)]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to claim item');
        } finally {
            setIsClaiming(false);
        }
    };

    const handleCounterOffer = async (offer) => {
        setIsRequesting(true);
        try {
            if (offer.accept !== undefined) {
                await respondToCounterOffer(selectedRequest._id, offer.accept);
                toast.success(offer.accept ? 'Offer accepted!' : 'Offer rejected');
            } else {
                await createCounterOffer(selectedRequest._id, offer);
                toast.success('Counter-offer sent!');
            }
            setShowCounterOfferModal(false);
            fetchItem(id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process offer');
        } finally {
            setIsRequesting(false);
        }
    };

    const handlePickupProposal = async (details) => {
        setIsRequesting(true);
        try {
            await proposePickupDetails(selectedRequest._id, details);
            toast.success('Pickup details proposed!');
            setShowPickupModal(false);
            fetchItem(id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to propose pickup');
        } finally {
            setIsRequesting(false);
        }
    };

    const handlePickupConfirm = async () => {
        setIsRequesting(true);
        try {
            await confirmPickupDetails(selectedRequest._id);
            toast.success('Pickup confirmed!');
            setShowPickupModal(false);
            fetchItem(id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to confirm pickup');
        } finally {
            setIsRequesting(false);
        }
    };

    const handleConfirmClaimPickup = async (claimId, status = 'CONFIRMED') => {
        try {
            await useRequestStore.getState().updateClaimStatus(claimId, status);
            toast.success(status === 'COMPLETED' ? 'Pickup completed!' : 'Pickup confirmed!');
            await loadClaimQueue();
        } catch (error) {
            toast.error('Failed to update claim status');
        }
    };

    const resetRequestForm = () => {
        setRequestMessage('');
        setProposedPrice('');
        setRentalDays('');
        setRentalStartDate('');
    };

    if (isLoading || !currentItem) {
        return (
            <div className="flex justify-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    const isOwner = user?._id === currentItem.owner?._id;
    const photos = currentItem.photos || [];
    const condition = conditionLabels[currentItem.condition];
    const isFreeInstantClaim = currentItem.mode === 'GIVE' && currentItem.instantClaim;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative">
                        {photos.length > 0 ? (
                            <>
                                <img
                                    src={photos[currentPhoto]}
                                    alt={currentItem.title}
                                    className="w-full h-full object-cover"
                                />
                                {photos.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentPhoto(p => (p - 1 + photos.length) % photos.length)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPhoto(p => (p + 1) % photos.length)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No images
                            </div>
                        )}
                        {!currentItem.isAvailable && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg text-center">
                                    <span className="text-2xl font-bold tracking-wide uppercase">Unavailable</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {photos.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                            {photos.map((photo, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentPhoto(index)}
                                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                                        index === currentPhoto ? 'border-blue-500' : 'border-transparent'
                                    }`}
                                >
                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Item Details */}
                <div className="space-y-6">
                    {/* 1. Title + Mode Badge + Condition Badge */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">{currentItem.title}</h1>
                            <div className="flex gap-2">
                                {condition && (
                                    <Badge variant={condition.color} className="text-sm">
                                        <Package size={14} className="mr-1" />
                                        {condition.label}
                                    </Badge>
                                )}
                                <Badge
                                    variant={modeColors[currentItem.mode]}
                                    className="text-sm"
                                    title={
                                        currentItem.mode === 'RENT'
                                            ? 'This item is for rent'
                                            : currentItem.mode === 'SELL'
                                            ? 'This item is for sale'
                                            : 'This item is free'
                                    }
                                >
                                    {currentItem.mode}
                                </Badge>
                            </div>
                        </div>
                        <p className="text-gray-500 mt-1">{currentItem.category}</p>
                    </div>

                    {/* 2. Price / "Free" */}
                    {currentItem.price > 0 && (
                        <div className="text-3xl font-bold text-blue-600">
                            ${currentItem.price}
                            {currentItem.mode === 'RENT' && <span className="text-lg font-normal">/day</span>}
                        </div>
                    )}

                    {currentItem.mode === 'GIVE' && (
                        <div className="text-2xl font-bold text-green-600">Free</div>
                    )}

                    {/* 3. Primary Action Card */}
                    {!isOwner && currentItem.isAvailable && (
                        <>
                            {isFreeInstantClaim ? (
                                <InstantClaimButton 
                                    item={currentItem}
                                    onClaim={handleInstantClaim}
                                    isLoading={isClaiming}
                                    userClaim={userClaim}
                                />
                            ) : (
                                <Button 
                                    size="lg" 
                                    className="w-full"
                                    onClick={() => setShowRequestModal(true)}
                                >
                                    <MessageSquare size={20} />
                                    {currentItem.mode === 'GIVE' ? 'Request This Item' : 'Make an Offer'}
                                </Button>
                            )}
                        </>
                    )}

                    {/* 4. Owner actions + ClaimQueue */}
                    {isOwner && (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <Button 
                                    variant="outline"
                                    onClick={() => navigate(`/my-items/${id}/edit`)}
                                    className="flex-1"
                                >
                                    Edit Item
                                </Button>
                            </div>
                            
                            {isFreeInstantClaim && (
                                <ClaimQueue 
                                    item={currentItem}
                                    claims={claimQueue}
                                    onConfirmPickup={handleConfirmClaimPickup}
                                    onContact={(claim) => navigate(`/messages/${claim.requester?._id}`)}
                                />
                            )}
                        </div>
                    )}

                    {/* Rental Details */}
                    {currentItem.mode === 'RENT' && (currentItem.minRentalDays || currentItem.maxRentalDays || currentItem.depositRequired) && (
                        <Card>
                            <Card.Body className="space-y-2">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Calendar size={16} />
                                    Rental Terms
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {currentItem.minRentalDays && (
                                        <div>
                                            <span className="text-gray-500">Min:</span> {currentItem.minRentalDays} days
                                        </div>
                                    )}
                                    {currentItem.maxRentalDays && (
                                        <div>
                                            <span className="text-gray-500">Max:</span> {currentItem.maxRentalDays} days
                                        </div>
                                    )}
                                    {currentItem.depositRequired && currentItem.depositAmount && (
                                        <div className="col-span-2 flex items-center gap-1">
                                            <Shield size={14} className="text-gray-500" />
                                            <span className="text-gray-500">Deposit:</span> ${currentItem.depositAmount}
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* 5. Description */}
                    <Card>
                        <Card.Body>
                            <h3 className="font-semibold mb-2">Description</h3>
                            <p className="text-gray-600 whitespace-pre-wrap">{currentItem.description}</p>
                        </Card.Body>
                    </Card>

                    {/* 6. Pickup Location + Schedule */}
                    {currentItem.pickupLocation && (
                        <Card>
                            <Card.Body>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <MapPin size={16} />
                                    Pickup Location
                                </h3>
                                <p className="text-gray-600">{currentItem.pickupLocation}</p>
                                {currentItem.availabilitySchedule && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                        <Clock size={14} />
                                        {currentItem.availabilitySchedule}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* 7. Owner Info */}
                    <Card>
                        <Card.Body className="flex items-center gap-4">
                            <Avatar src={currentItem.owner?.avatar} name={currentItem.owner?.fullName} size="lg" />
                            <div className="flex-1">
                                <h3 className="font-semibold">{currentItem.owner?.fullName}</h3>
                                <p className="text-gray-500 text-sm">@{currentItem.owner?.username}</p>
                            </div>
                            <TrustScore score={currentItem.owner?.trustScore} />
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Request Modal for RENT/SELL */}
            <Modal
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                title={currentItem.mode === 'GIVE' ? 'Request Item' : 'Make an Offer'}
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Send a request to {currentItem.owner?.fullName} for "{currentItem.title}"
                    </p>
                    
                    {currentItem.mode !== 'GIVE' && (
                        <Input
                            label="Your Offer Price ($)"
                            type="number"
                            min="0"
                            step="0.01"
                            value={proposedPrice}
                            onChange={(e) => setProposedPrice(e.target.value)}
                            placeholder={`Suggested: $${currentItem.price}`}
                        />
                    )}

                    {currentItem.mode === 'RENT' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={rentalStartDate}
                                    onChange={(e) => setRentalStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <Input
                                    label="Duration (days)"
                                    type="number"
                                    min={currentItem.minRentalDays || 1}
                                    max={currentItem.maxRentalDays || 365}
                                    value={rentalDays}
                                    onChange={(e) => setRentalDays(e.target.value)}
                                    placeholder={`${currentItem.minRentalDays || 1}-${currentItem.maxRentalDays || 365} days`}
                                />
                            </div>
                            {proposedPrice && rentalDays && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={16} className="text-blue-600" />
                                        <span>
                                            Total: <strong>${(parseFloat(proposedPrice) * parseInt(rentalDays)).toFixed(2)}</strong>
                                            {currentItem.depositRequired && currentItem.depositAmount && (
                                                <span className="text-gray-500"> + ${currentItem.depositAmount} deposit</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message (Optional)
                        </label>
                        <textarea
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add a message to your request..."
                        />
                    </div>

                    <div className="flex gap-4">
                        <Button 
                            onClick={handleRequest} 
                            loading={isRequesting}
                            className="flex-1"
                        >
                            Send Request
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowRequestModal(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Counter-Offer Modal */}
            <CounterOfferModal
                isOpen={showCounterOfferModal}
                onClose={() => setShowCounterOfferModal(false)}
                request={selectedRequest}
                item={currentItem}
                onSubmit={handleCounterOffer}
                isOwner={isOwner}
                isLoading={isRequesting}
            />

            {/* Pickup Details Modal */}
            <PickupDetailsModal
                isOpen={showPickupModal}
                onClose={() => setShowPickupModal(false)}
                request={selectedRequest}
                onPropose={handlePickupProposal}
                onConfirm={handlePickupConfirm}
                isOwner={isOwner}
                isLoading={isRequesting}
            />
        </div>
    );
}
