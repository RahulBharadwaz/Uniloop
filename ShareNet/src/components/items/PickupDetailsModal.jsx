import { useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { MapPin, Clock, FileText, Check } from 'lucide-react';

export default function PickupDetailsModal({ 
    isOpen, 
    onClose, 
    request, 
    onPropose, 
    onConfirm,
    isOwner = false,
    isLoading = false 
}) {
    const existingPickup = request?.pickupDetails;
    const [pickupDetails, setPickupDetails] = useState({
        location: existingPickup?.location || '',
        date: existingPickup?.date ? existingPickup.date.split('T')[0] : '',
        time: existingPickup?.time || '',
        instructions: existingPickup?.instructions || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onPropose(pickupDetails);
    };

    const handleConfirm = () => {
        onConfirm();
    };

    const isPendingConfirmation = existingPickup && existingPickup.status === 'PROPOSED';
    const isConfirmed = existingPickup && existingPickup.status === 'CONFIRMED';

    if (isConfirmed) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Pickup Details">
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Check className="text-green-600" size={20} />
                            <span className="font-medium text-green-800">Pickup Confirmed!</span>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin size={16} className="text-green-600 mt-0.5" />
                                <span>{existingPickup.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-green-600" />
                                <span>
                                    {new Date(existingPickup.date).toLocaleDateString()} at {existingPickup.time}
                                </span>
                            </div>
                            {existingPickup.instructions && (
                                <div className="flex items-start gap-2">
                                    <FileText size={16} className="text-green-600 mt-0.5" />
                                    <span>{existingPickup.instructions}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <Button variant="secondary" onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    if (isPendingConfirmation && !isOwner) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Confirm Pickup Details">
                <div className="space-y-4">
                    <p className="text-gray-600">
                        The owner has proposed the following pickup details:
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <MapPin size={16} className="text-blue-600 mt-0.5" />
                            <span>{existingPickup.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-blue-600" />
                            <span>
                                {new Date(existingPickup.date).toLocaleDateString()} at {existingPickup.time}
                            </span>
                        </div>
                        {existingPickup.instructions && (
                            <div className="flex items-start gap-2">
                                <FileText size={16} className="text-blue-600 mt-0.5" />
                                <span>{existingPickup.instructions}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handleConfirm} loading={isLoading} className="flex-1">
                            Confirm Pickup
                        </Button>
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
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
            title={existingPickup ? "Update Pickup Details" : "Propose Pickup Details"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Pickup Location"
                    value={pickupDetails.location}
                    onChange={(e) => setPickupDetails(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter address or location description"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Date"
                        type="date"
                        value={pickupDetails.date}
                        onChange={(e) => setPickupDetails(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <Input
                        label="Time"
                        type="time"
                        value={pickupDetails.time}
                        onChange={(e) => setPickupDetails(prev => ({ ...prev, time: e.target.value }))}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions (Optional)
                    </label>
                    <textarea
                        value={pickupDetails.instructions}
                        onChange={(e) => setPickupDetails(prev => ({ ...prev, instructions: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special instructions for pickup..."
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="submit" loading={isLoading} className="flex-1">
                        {existingPickup ? 'Update Pickup' : 'Propose Pickup'}
                    </Button>
                    <Button variant="secondary" onClick={onClose} type="button">
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
