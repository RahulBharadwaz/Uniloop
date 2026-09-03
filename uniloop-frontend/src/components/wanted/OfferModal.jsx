import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button, Input } from '../ui';
import { Upload, X, Gift, DollarSign, Clock } from 'lucide-react';
import useWantedItemStore from '../../stores/wantedItemStore';

const OFFER_TYPES = [
    { value: 'FREE', label: 'Free', icon: Gift, description: 'I\'ll give it for free', color: 'green' },
    { value: 'SELL', label: 'Sell', icon: DollarSign, description: 'I want to sell it', color: 'blue' },
    { value: 'RENT', label: 'Rent', icon: Clock, description: 'Available for rent', color: 'purple' }
];

export default function OfferModal({ isOpen, onClose, item, onSuccess }) {
    const { makeOffer, isOfferLoading } = useWantedItemStore();
    
    const [formData, setFormData] = useState({
        offerType: 'FREE',
        price: '',
        message: '',
        photos: []
    });
    const [photoPreview, setPhotoPreview] = useState([]);

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = [...formData.photos, ...files].slice(0, 3);
        setFormData({ ...formData, photos: newPhotos });

        const newPreviews = [...photoPreview];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newPreviews.push(e.target.result);
                setPhotoPreview([...newPreviews].slice(0, 3));
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        const newPhotos = formData.photos.filter((_, i) => i !== index);
        const newPreviews = photoPreview.filter((_, i) => i !== index);
        setFormData({ ...formData, photos: newPhotos });
        setPhotoPreview(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.message.trim()) {
            toast.error('Please add a message');
            return;
        }

        if (formData.offerType !== 'FREE' && !formData.price) {
            toast.error('Please enter a price');
            return;
        }

        try {
            const data = new FormData();
            data.append('offerType', formData.offerType);
            data.append('message', formData.message);
            if (formData.price) data.append('price', formData.price);
            formData.photos.forEach(photo => {
                data.append('photos', photo);
            });

            await makeOffer(item._id, data);
            toast.success('Offer submitted successfully!');
            resetForm();
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit offer');
        }
    };

    const resetForm = () => {
        setFormData({
            offerType: 'FREE',
            price: '',
            message: '',
            photos: []
        });
        setPhotoPreview([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Make an Offer for "${item?.title}"`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offer Type *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {OFFER_TYPES.map(type => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, offerType: type.value })}
                                className={`
                                    p-4 rounded-xl border-2 transition-all text-center
                                    ${formData.offerType === type.value
                                        ? `border-${type.color}-500 bg-${type.color}-50`
                                        : 'border-gray-200 hover:border-gray-300'}
                                `}
                            >
                                <type.icon 
                                    size={24} 
                                    className={`mx-auto mb-2 ${
                                        formData.offerType === type.value 
                                            ? `text-${type.color}-600` 
                                            : 'text-gray-400'
                                    }`} 
                                />
                                <span className={`font-medium ${
                                    formData.offerType === type.value 
                                        ? `text-${type.color}-700` 
                                        : 'text-gray-700'
                                }`}>
                                    {type.label}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {formData.offerType !== 'FREE' && (
                    <Input
                        label={formData.offerType === 'RENT' ? 'Rent Price (per day) *' : 'Price *'}
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Enter amount"
                        required
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message *
                    </label>
                    <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe what you're offering, its condition, availability, etc."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos (Optional)
                    </label>
                    <div className="flex gap-3">
                        {photoPreview.map((preview, idx) => (
                            <div key={idx} className="relative w-20 h-20">
                                <img
                                    src={preview}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(idx)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}

                        {photoPreview.length < 3 && (
                            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                <Upload size={18} className="text-gray-400 mb-1" />
                                <span className="text-xs text-gray-400">Add</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                    multiple
                                />
                            </label>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Add up to 3 photos of your item</p>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                    <Button 
                        type="button" 
                        variant="secondary" 
                        className="flex-1"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1"
                        loading={isOfferLoading}
                    >
                        Submit Offer
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
