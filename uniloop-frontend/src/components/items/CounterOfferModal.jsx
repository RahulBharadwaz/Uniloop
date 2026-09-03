import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { DollarSign, Calendar, MessageSquare } from 'lucide-react';

export default function CounterOfferModal({ 
    isOpen, 
    onClose, 
    request, 
    item, 
    onSubmit,
    isOwner = false,
    isLoading = false
}) {
    const [counterOffer, setCounterOffer] = useState({
        price: request?.counterOffer?.price || request?.proposedPrice || item?.price || '',
        rentalDays: request?.counterOffer?.rentalDays || request?.rentalDays || '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(counterOffer);
    };

    const handleAccept = () => {
        onSubmit({ accept: true });
    };

    const handleReject = () => {
        onSubmit({ accept: false });
    };

    const hasCounterOffer = request?.counterOffer && request?.counterOffer?.status === 'PENDING';

    if (!isOwner && hasCounterOffer) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Counter-Offer Received">
                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-medium text-yellow-800 mb-2">
                            The owner has made a counter-offer:
                        </p>
                        <div className="space-y-2 text-sm">
                            {request.counterOffer.price && (
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} className="text-yellow-600" />
                                    <span>Price: <strong>${request.counterOffer.price}</strong></span>
                                    {request.proposedPrice && (
                                        <span className="text-gray-500 line-through">
                                            (was ${request.proposedPrice})
                                        </span>
                                    )}
                                </div>
                            )}
                            {item?.mode === 'RENT' && request.counterOffer.rentalDays && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-yellow-600" />
                                    <span>Duration: <strong>{request.counterOffer.rentalDays} days</strong></span>
                                </div>
                            )}
                            {request.counterOffer.message && (
                                <div className="flex items-start gap-2 mt-2">
                                    <MessageSquare size={16} className="text-yellow-600 mt-0.5" />
                                    <p className="text-gray-700">{request.counterOffer.message}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button 
                            onClick={handleAccept} 
                            loading={isLoading}
                            className="flex-1"
                        >
                            Accept
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handleReject}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Reject
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Counter
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isOwner ? "Make Counter-Offer" : "Make an Offer"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {request && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                        <p className="text-gray-600">
                            Original request: ${request.proposedPrice || item?.price}
                            {item?.mode === 'RENT' && request.rentalDays && ` for ${request.rentalDays} days`}
                        </p>
                    </div>
                )}

                <Input
                    label="Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={counterOffer.price}
                    onChange={(e) => setCounterOffer(prev => ({ ...prev, price: e.target.value }))}
                    required
                />

                {item?.mode === 'RENT' && (
                    <Input
                        label="Rental Duration (days)"
                        type="number"
                        min={item.minRentalDays || 1}
                        max={item.maxRentalDays || 365}
                        value={counterOffer.rentalDays}
                        onChange={(e) => setCounterOffer(prev => ({ ...prev, rentalDays: e.target.value }))}
                        required
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message
                    </label>
                    <textarea
                        value={counterOffer.message}
                        onChange={(e) => setCounterOffer(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add a message explaining your offer..."
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="submit" loading={isLoading} className="flex-1">
                        {isOwner ? 'Send Counter-Offer' : 'Submit Offer'}
                    </Button>
                    <Button variant="secondary" onClick={onClose} type="button">
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
