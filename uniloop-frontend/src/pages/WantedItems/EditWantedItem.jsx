import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Input, Select, Loader } from '../../components/ui';
import { 
    Upload, X, Gift, DollarSign, Tag, ArrowLeft,
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
    { value: 'low', label: 'Low', description: 'No rush', color: 'gray' },
    { value: 'medium', label: 'Medium', description: 'Within a week', color: 'blue' },
    { value: 'high', label: 'High', description: 'Few days', color: 'orange' },
    { value: 'urgent', label: 'Urgent', description: 'ASAP', color: 'red' }
];

const BUDGET_TYPES = [
    { value: 'ANY', label: 'Any', description: 'Open to any price', icon: Tag },
    { value: 'FREE_ONLY', label: 'Free Only', description: 'Only free items', icon: Gift },
    { value: 'MAX_PRICE', label: 'Max Price', description: 'Set a max budget', icon: DollarSign }
];

const CONDITIONS = [
    { value: 'any', label: 'Any Condition' },
    { value: 'new', label: 'New Only' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
];

export default function EditWantedItem() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentItem, fetchItemDetail, updateItem, isLoading } = useWantedItemStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loaded, setLoaded] = useState(false);

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

    useEffect(() => {
        fetchItemDetail(id);
    }, [id]);

    useEffect(() => {
        if (currentItem && currentItem._id === id && !loaded) {
            const catMap = {
                'Electronics': 'electronics', 'Furniture': 'furniture', 'Clothing': 'clothing',
                'Books': 'books', 'Sports': 'sports', 'Kitchen': 'kitchen', 'Tools': 'tools', 'Other': 'other'
            };
            const condMap = {
                'ANY': 'any', 'NEW': 'new', 'LIKE_NEW': 'like_new', 'GOOD': 'good', 'FAIR': 'fair'
            };
            const urgencyMap = {
                'LOW': 'low', 'MEDIUM': 'medium', 'HIGH': 'high', 'URGENT': 'urgent'
            };

            setFormData({
                title: currentItem.title || '',
                description: currentItem.description || '',
                category: catMap[currentItem.category] || currentItem.category?.toLowerCase() || '',
                referenceImage: null,
                budgetType: currentItem.budgetType || currentItem.budget?.type || 'ANY',
                maxPrice: currentItem.maxPrice || currentItem.budget?.maxAmount || '',
                urgency: urgencyMap[currentItem.urgency] || currentItem.urgency?.toLowerCase() || 'medium',
                quantity: currentItem.quantity || 1,
                preferredCondition: condMap[currentItem.preferredCondition] || currentItem.preferredCondition?.toLowerCase() || 'any',
                expiresAt: currentItem.expiresAt ? new Date(currentItem.expiresAt).toISOString().split('T')[0] : ''
            });

            if (currentItem.referenceImage) {
                setImagePreview(currentItem.referenceImage);
            }
            setLoaded(true);
        }
    }, [currentItem, id, loaded]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) { toast.error('Title is required'); return; }
        if (!formData.description.trim()) { toast.error('Description is required'); return; }
        if (!formData.category) { toast.error('Category is required'); return; }

        setIsSubmitting(true);
        try {
            const categoryMap = {
                electronics: 'Electronics', furniture: 'Furniture', clothing: 'Clothing',
                books: 'Books', sports: 'Sports', kitchen: 'Kitchen', tools: 'Tools', other: 'Other'
            };
            const conditionMap = {
                any: 'ANY', new: 'NEW', like_new: 'LIKE_NEW', good: 'GOOD', fair: 'FAIR'
            };

            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', categoryMap[formData.category] || 'Other');

            const budget = {
                type: formData.budgetType,
                maxAmount: formData.budgetType === 'MAX_PRICE' ? parseFloat(formData.maxPrice) : undefined
            };
            data.append('budget', JSON.stringify(budget));

            data.append('urgency', formData.urgency.toUpperCase());
            data.append('quantity', formData.quantity);
            data.append('preferredCondition', conditionMap[formData.preferredCondition] || 'ANY');
            if (formData.expiresAt) data.append('expiresAt', formData.expiresAt);
            if (formData.referenceImage instanceof File) {
                data.append('referenceImage', formData.referenceImage);
            }

            await updateItem(id, data);
            toast.success('Request updated!');
            navigate(`/wanted/${id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && !loaded) {
        return (
            <div className="flex justify-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate(`/wanted/${id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={20} />
                Back to Request
            </button>

            <Card>
                <Card.Header>
                    <h1 className="text-xl font-bold">Edit Request</h1>
                </Card.Header>
                <Card.Body>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe what you need..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                            <div className="grid grid-cols-4 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: cat.value })}
                                        className={`p-3 rounded-lg border-2 transition-all text-center ${formData.category === cat.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <cat.icon size={20} className="mx-auto mb-1" />
                                        <span className="text-xs font-medium">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reference Image</label>
                            {imagePreview ? (
                                <div className="relative w-32 h-32">
                                    <img src={imagePreview} alt="Reference" className="w-full h-full object-cover rounded-lg" />
                                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-400">Add Image</span>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                            <div className="grid grid-cols-3 gap-3">
                                {BUDGET_TYPES.map(budget => (
                                    <button
                                        key={budget.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, budgetType: budget.value, maxPrice: '' })}
                                        className={`p-3 rounded-lg border-2 transition-all text-center ${formData.budgetType === budget.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <budget.icon size={20} className="mx-auto mb-1" />
                                        <span className="text-sm font-medium">{budget.label}</span>
                                    </button>
                                ))}
                            </div>
                            {formData.budgetType === 'MAX_PRICE' && (
                                <Input className="mt-3" label="Maximum Price *" type="number" name="maxPrice" min="0" step="0.01" value={formData.maxPrice} onChange={handleChange} required />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                            <div className="grid grid-cols-4 gap-2">
                                {URGENCY_LEVELS.map(level => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, urgency: level.value })}
                                        className={`p-2 rounded-lg border-2 transition-all text-center ${formData.urgency === level.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <span className="text-sm font-medium">{level.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Quantity" type="number" name="quantity" min="1" value={formData.quantity} onChange={handleChange} />
                            <Select label="Preferred Condition" name="preferredCondition" value={formData.preferredCondition} onChange={handleChange} options={CONDITIONS} />
                        </div>

                        <Input label="Expiry Date (Optional)" type="date" name="expiresAt" value={formData.expiresAt} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />

                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(`/wanted/${id}`)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" loading={isSubmitting}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card.Body>
            </Card>
        </div>
    );
}
