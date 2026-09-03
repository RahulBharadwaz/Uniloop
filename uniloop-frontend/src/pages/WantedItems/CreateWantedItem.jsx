import { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, Button, Input, Select } from '../../components/ui';
import { 
    Upload, X, Gift, DollarSign, Tag, Clock,
    Smartphone, Sofa, Shirt, Book, Dumbbell, UtensilsCrossed, Wrench, Package
} from 'lucide-react';
import useWantedItemStore from '../../stores/wantedItemStore';

const CATEGORIES = [
    { value: 'electronics', label: 'Electronics', icon: Smartphone },
    { value: 'furniture', label: 'Furniture', icon: Sofa },
    { value: 'clothing', label: 'Clothing', icon: Shirt },
    { value: 'books', label: 'Books', icon: Book },
    { value: 'sports', label: 'Sports', icon: Dumbbell },
    { value: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed },
    { value: 'tools', label: 'Tools', icon: Wrench },
    { value: 'other', label: 'Other', icon: Package }
];

const URGENCY_LEVELS = [
    { value: 'low', label: 'Low', description: 'No rush, whenever available', activeClasses: 'border-gray-500 bg-gray-50 text-gray-700', hoverClasses: 'hover:border-gray-300' },
    { value: 'medium', label: 'Medium', description: 'Need it within a week', activeClasses: 'border-blue-500 bg-blue-50 text-blue-700', hoverClasses: 'hover:border-blue-300' },
    { value: 'high', label: 'High', description: 'Need it in a few days', activeClasses: 'border-orange-500 bg-orange-50 text-orange-700', hoverClasses: 'hover:border-orange-300' },
    { value: 'urgent', label: 'Urgent', description: 'Need it ASAP', activeClasses: 'border-red-500 bg-red-50 text-red-700', hoverClasses: 'hover:border-red-300' }
];

const BUDGET_TYPES = [
    { value: 'ANY', label: 'Any', description: 'Open to any price', icon: Tag },
    { value: 'FREE_ONLY', label: 'Free Only', description: 'Only looking for free items', icon: Gift },
    { value: 'MAX_PRICE', label: 'Max Price', description: 'Set a maximum budget', icon: DollarSign }
];

const CONDITIONS = [
    { value: 'any', label: 'Any Condition' },
    { value: 'new', label: 'New Only' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
];

export default function CreateWantedItem({ isOpen, onClose, onSuccess }) {
    const { createItem } = useWantedItemStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        referenceImage: null,
        budgetType: 'ANY',
        maxPrice: '',
        urgency: 'medium',
        quantity: 1,
        preferredCondition: 'any',
        expiresAt: ''
    });

    const [imagePreview, setImagePreview] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, referenceImage: file });
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData({ ...formData, referenceImage: null });
        setImagePreview(null);
    };

    const validateForm = () => {
        if (!formData.title.trim()) return 'Title is required';
        if (!formData.description.trim()) return 'Description is required';
        if (!formData.category) return 'Category is required';
        if (formData.budgetType === 'MAX_PRICE' && !formData.maxPrice) return 'Max price is required';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            toast.error(error);
            return;
        }

        setIsSubmitting(true);
        try {
            // Map category to backend format (capitalize)
            const categoryMap = {
                electronics: 'Electronics',
                furniture: 'Furniture',
                clothing: 'Clothing',
                books: 'Books',
                sports: 'Sports',
                kitchen: 'Kitchen',
                tools: 'Tools',
                other: 'Other'
            };

            // Map condition to backend format (uppercase with underscore)
            const conditionMap = {
                any: 'ANY',
                new: 'NEW',
                like_new: 'LIKE_NEW',
                good: 'GOOD',
                fair: 'FAIR'
            };

            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', categoryMap[formData.category] || 'Other');
            
            // Send budget as JSON object
            const budget = {
                type: formData.budgetType,
                maxAmount: formData.budgetType === 'MAX_PRICE' ? parseFloat(formData.maxPrice) : undefined
            };
            data.append('budget', JSON.stringify(budget));
            
            data.append('urgency', formData.urgency.toUpperCase());
            data.append('quantity', formData.quantity);
            data.append('preferredCondition', conditionMap[formData.preferredCondition] || 'ANY');
            if (formData.expiresAt) data.append('expiresAt', formData.expiresAt);
            if (formData.referenceImage) {
                data.append('referenceImage', formData.referenceImage);
            }

            await createItem(data);
            toast.success('Request posted successfully!');
            resetForm();
            onSuccess?.();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create request';
            toast.error(errorMsg);
            console.error('Create wanted item error:', error.response?.data || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: '',
            referenceImage: null,
            budgetType: 'ANY',
            maxPrice: '',
            urgency: 'medium',
            quantity: 1,
            preferredCondition: 'any',
            expiresAt: ''
        });
        setImagePreview(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Post What You Need"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Title *"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="What are you looking for?"
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe what you need and why..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                className={`
                                    p-3 rounded-lg border-2 transition-all text-center
                                    ${formData.category === cat.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'}
                                `}
                            >
                                <cat.icon size={20} className="mx-auto mb-1" />
                                <span className="text-xs font-medium">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Image (Optional)
                    </label>
                    {imagePreview ? (
                        <div className="relative w-32 h-32">
                            <img
                                src={imagePreview}
                                alt="Reference"
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                            <Upload size={24} className="text-gray-400 mb-2" />
                            <span className="text-xs text-gray-400">Add Image</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Add an image of what you're looking for</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {BUDGET_TYPES.map(budget => (
                            <button
                                key={budget.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, budgetType: budget.value, maxPrice: '' })}
                                className={`
                                    p-3 rounded-lg border-2 transition-all text-center
                                    ${formData.budgetType === budget.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'}
                                `}
                            >
                                <budget.icon size={20} className="mx-auto mb-1" />
                                <span className="text-sm font-medium">{budget.label}</span>
                                <p className="text-xs text-gray-500 mt-1">{budget.description}</p>
                            </button>
                        ))}
                    </div>

                    {formData.budgetType === 'MAX_PRICE' && (
                        <Input
                            className="mt-3"
                            label="Maximum Price *"
                            type="number"
                            name="maxPrice"
                            min="0"
                            step="0.01"
                            value={formData.maxPrice}
                            onChange={handleChange}
                            placeholder="Enter max budget"
                            required
                        />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgency
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {URGENCY_LEVELS.map(level => (
                            <button
                                key={level.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, urgency: level.value })}
                                className={`
                                    p-2 rounded-lg border-2 transition-all text-center
                                    ${formData.urgency === level.value
                                        ? level.activeClasses
                                        : `border-gray-200 ${level.hoverClasses}`}
                                `}
                            >
                                <span className="text-sm font-medium">{level.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Quantity Needed"
                        type="number"
                        name="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={handleChange}
                    />
                    <Select
                        label="Preferred Condition"
                        name="preferredCondition"
                        value={formData.preferredCondition}
                        onChange={handleChange}
                        options={CONDITIONS}
                    />
                </div>

                <Input
                    label="Expiry Date (Optional)"
                    type="date"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                />

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
                        loading={isSubmitting}
                    >
                        Post Request
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
