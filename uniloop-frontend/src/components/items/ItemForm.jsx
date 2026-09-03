import { useState } from 'react';
import { Input, Select, Button } from '../ui';
import { Upload, X, Zap, Shield, Clock, MapPin } from 'lucide-react';

const categories = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Books', label: 'Books' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Clothing', label: 'Clothing' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Kitchen', label: 'Kitchen' },
    { value: 'Other', label: 'Other' },
];

const modes = [
    { value: 'RENT', label: 'For Rent' },
    { value: 'SELL', label: 'For Sale' },
    { value: 'GIVE', label: 'Give Away (Free)' },
];

const conditions = [
    { value: 'NEW', label: 'New - Never used' },
    { value: 'LIKE_NEW', label: 'Like New - Barely used' },
    { value: 'GOOD', label: 'Good - Minor wear' },
    { value: 'FAIR', label: 'Fair - Visible wear' },
    { value: 'POOR', label: 'Poor - Heavy wear' },
];

const availabilityOptions = [
    { value: 'weekdays', label: 'Weekdays (9am-6pm)' },
    { value: 'weekends', label: 'Weekends only' },
    { value: 'evenings', label: 'Evenings (6pm-9pm)' },
    { value: 'flexible', label: 'Flexible' },
    { value: 'custom', label: 'Custom (specify below)' },
];

export default function ItemForm({ initialData, onSubmit, isLoading }) {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || '',
        mode: initialData?.mode || '',
        price: initialData?.price || '',
        condition: initialData?.condition || '',
        instantClaim: initialData?.instantClaim || false,
        maxClaimers: initialData?.maxClaimers || 1,
        minRentalDays: initialData?.minRentalDays || '',
        maxRentalDays: initialData?.maxRentalDays || '',
        depositRequired: initialData?.depositRequired || false,
        depositAmount: initialData?.depositAmount || '',
        pickupLocation: initialData?.pickupLocation || '',
        availabilitySchedule: initialData?.availabilitySchedule || '',
    });
    const [photos, setPhotos] = useState([]);
    const [previews, setPreviews] = useState(initialData?.photos || []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(prev => [...prev, ...files]);
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviews(prev => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                data.append(key, value);
            }
        });
        photos.forEach(photo => {
            data.append('photos', photo);
        });
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="What are you sharing?"
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your item, its condition, and any details..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={categories}
                    placeholder="Select category"
                    required
                />

                <Select
                    label="Condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    options={conditions}
                    placeholder="Select condition"
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Mode"
                    name="mode"
                    value={formData.mode}
                    onChange={handleChange}
                    options={modes}
                    placeholder="Select mode"
                    required
                />

                {formData.mode !== 'GIVE' && (
                    <Input
                        label={formData.mode === 'RENT' ? 'Price per day ($)' : 'Price ($)'}
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        required={formData.mode !== 'GIVE'}
                    />
                )}
            </div>

            {/* Free item options */}
            {formData.mode === 'GIVE' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-green-800 flex items-center gap-2">
                        <Zap size={16} />
                        Free Item Options
                    </h4>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="instantClaim"
                            checked={formData.instantClaim}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div>
                            <span className="font-medium text-gray-900">Enable Instant Claim</span>
                            <p className="text-sm text-gray-500">First come, first serve - no approval needed</p>
                        </div>
                    </label>

                    {formData.instantClaim && (
                        <Input
                            label="Maximum Claimers"
                            name="maxClaimers"
                            type="number"
                            min="1"
                            max="100"
                            value={formData.maxClaimers}
                            onChange={handleChange}
                            helperText="How many people can claim this item?"
                        />
                    )}
                </div>
            )}

            {/* Rental options */}
            {formData.mode === 'RENT' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-blue-800 flex items-center gap-2">
                        <Clock size={16} />
                        Rental Options
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Minimum Days"
                            name="minRentalDays"
                            type="number"
                            min="1"
                            value={formData.minRentalDays}
                            onChange={handleChange}
                            placeholder="1"
                        />
                        <Input
                            label="Maximum Days"
                            name="maxRentalDays"
                            type="number"
                            min={formData.minRentalDays || 1}
                            value={formData.maxRentalDays}
                            onChange={handleChange}
                            placeholder="30"
                        />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="depositRequired"
                            checked={formData.depositRequired}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <span className="font-medium text-gray-900 flex items-center gap-1">
                                <Shield size={14} />
                                Require Deposit
                            </span>
                            <p className="text-sm text-gray-500">Collect a refundable security deposit</p>
                        </div>
                    </label>

                    {formData.depositRequired && (
                        <Input
                            label="Deposit Amount ($)"
                            name="depositAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.depositAmount}
                            onChange={handleChange}
                            required={formData.depositRequired}
                        />
                    )}
                </div>
            )}

            {/* Pickup Location */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    <MapPin size={16} />
                    Pickup Details
                </h4>
                
                <Input
                    label="Pickup Location"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    placeholder="e.g., Downtown Library, 123 Main St"
                />

                <Select
                    label="Availability Schedule"
                    name="availabilitySchedule"
                    value={formData.availabilitySchedule}
                    onChange={handleChange}
                    options={availabilityOptions}
                    placeholder="When can people pick this up?"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (up to 5)
                </label>
                <div className="flex flex-wrap gap-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative w-24 h-24">
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {previews.length < 5 && (
                        <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                            <Upload size={24} className="text-gray-400" />
                            <span className="text-xs text-gray-400 mt-1">Add</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">
                {initialData ? 'Update Item' : 'Create Listing'}
            </Button>
        </form>
    );
}
