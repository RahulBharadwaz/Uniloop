import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, Button, Modal, Input, Select } from '../../components/ui';
import { 
    Upload, X, ChevronLeft, ChevronRight, Check, 
    MapPin, Calendar, AlertCircle, Gift, Shield,
    Smartphone, Shirt, Key, FileText, Briefcase, Package,
    MessageSquare, Phone, Mail
} from 'lucide-react';
import useLostFoundStore from '../../stores/lostFoundStore';

const CATEGORIES = [
    { value: 'electronics', label: 'Electronics', icon: Smartphone },
    { value: 'clothing', label: 'Clothing', icon: Shirt },
    { value: 'keys', label: 'Keys', icon: Key },
    { value: 'documents', label: 'Documents', icon: FileText },
    { value: 'bags', label: 'Bags & Wallets', icon: Briefcase },
    { value: 'accessories', label: 'Accessories', icon: Package },
    { value: 'other', label: 'Other', icon: Package }
];

const URGENCY_LEVELS = [
    { value: 'low', label: 'Low', description: 'Not urgent, can wait a few days', activeClasses: 'border-gray-500 bg-gray-50 text-gray-700', dotColor: 'bg-gray-500', hoverClasses: 'hover:border-gray-300' },
    { value: 'medium', label: 'Medium', description: 'Would like to find it soon', activeClasses: 'border-yellow-500 bg-yellow-50 text-yellow-700', dotColor: 'bg-yellow-500', hoverClasses: 'hover:border-yellow-300' },
    { value: 'high', label: 'High', description: 'Need it back urgently', activeClasses: 'border-orange-500 bg-orange-50 text-orange-700', dotColor: 'bg-orange-500', hoverClasses: 'hover:border-orange-300' },
    { value: 'critical', label: 'Critical', description: 'Essential item, need it immediately', activeClasses: 'border-red-500 bg-red-50 text-red-700', dotColor: 'bg-red-500', hoverClasses: 'hover:border-red-300' }
];

const STEPS = [
    { id: 1, title: 'Type', description: 'Lost or Found?' },
    { id: 2, title: 'Details', description: 'Item information' },
    { id: 3, title: 'Photos', description: 'Add images' },
    { id: 4, title: 'Verification', description: 'Security questions' },
    { id: 5, title: 'Reward', description: 'Optional reward' },
    { id: 6, title: 'Contact', description: 'How to reach you' }
];

export default function CreateLostFoundPost({ isOpen, onClose, onSuccess }) {
    const { createPost } = useLostFoundStore();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        description: '',
        category: '',
        location: '',
        dateLostFound: '',
        urgency: 'medium',
        photos: [],
        verificationQuestions: [{ question: '', answer: '' }],
        reward: '',
        rewardDescription: '',
        contactPreference: 'chat',
        phone: ''
    });

    const [photoPreview, setPhotoPreview] = useState([]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        const newPhotos = [...formData.photos, ...files].slice(0, 5);
        setFormData({ ...formData, photos: newPhotos });

        const newPreviews = [...photoPreview];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                newPreviews.push(e.target.result);
                setPhotoPreview([...newPreviews].slice(0, 5));
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

    const addVerificationQuestion = () => {
        if (formData.verificationQuestions.length < 3) {
            setFormData({
                ...formData,
                verificationQuestions: [...formData.verificationQuestions, { question: '', answer: '' }]
            });
        }
    };

    const updateVerificationQuestion = (index, field, value) => {
        const newQuestions = [...formData.verificationQuestions];
        newQuestions[index][field] = value;
        setFormData({ ...formData, verificationQuestions: newQuestions });
    };

    const removeVerificationQuestion = (index) => {
        const newQuestions = formData.verificationQuestions.filter((_, i) => i !== index);
        setFormData({ ...formData, verificationQuestions: newQuestions });
    };

    const validateStep = () => {
        switch (currentStep) {
            case 1:
                return !!formData.type;
            case 2:
                return formData.title && formData.description && formData.category && formData.location;
            case 3:
                return true; // Photos optional
            case 4:
                return true; // Verification optional
            case 5:
                return true; // Reward optional
            case 6:
                return formData.contactPreference && (formData.contactPreference !== 'phone' || formData.phone);
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(s => Math.min(s + 1, STEPS.length));
        } else {
            toast.error('Please fill in all required fields');
        }
    };

    const prevStep = () => {
        setCurrentStep(s => Math.max(s - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('type', formData.type.toUpperCase());
            data.append('title', formData.title);
            data.append('description', formData.description);
            
            // Map category to backend format (capitalize first letter)
            const categoryMap = {
                electronics: 'Electronics',
                clothing: 'Clothing',
                keys: 'Keys',
                documents: 'Documents',
                bags: 'Bags',
                accessories: 'Accessories',
                other: 'Other'
            };
            data.append('category', categoryMap[formData.category] || 'Other');
            data.append('location', formData.location);
            if (formData.dateLostFound) data.append('lastSeenDate', formData.dateLostFound);
            data.append('urgency', formData.urgency.toUpperCase());
            data.append('contactPreference', formData.contactPreference.toUpperCase());
            if (formData.phone) data.append('phone', formData.phone);
            
            // Handle reward properly
            if (formData.reward) {
                data.append('reward', JSON.stringify({
                    offered: true,
                    amount: parseFloat(formData.reward.replace(/[^0-9.]/g, '')) || 0,
                    description: formData.rewardDescription || formData.reward
                }));
            }
            
            // Add verification questions
            const validQuestions = formData.verificationQuestions.filter(q => q.question && q.answer);
            if (validQuestions.length > 0) {
                data.append('verificationQuestions', JSON.stringify(validQuestions));
            }

            // Add first photo only (backend expects single 'photo')
            if (formData.photos.length > 0) {
                data.append('photo', formData.photos[0]);
            }

            await createPost(data);
            toast.success('Post created successfully!');
            resetForm();
            onSuccess?.();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to create post';
            toast.error(errorMsg);
            console.error('Create post error:', error.response?.data || error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setCurrentStep(1);
        setFormData({
            type: '',
            title: '',
            description: '',
            category: '',
            location: '',
            dateLostFound: '',
            urgency: 'medium',
            photos: [],
            verificationQuestions: [{ question: '', answer: '' }],
            reward: '',
            rewardDescription: '',
            contactPreference: 'chat',
            phone: ''
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
            title="Report Lost or Found Item"
            size="lg"
        >
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 px-4">
                {STEPS.map((step, idx) => (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
                                ${currentStep > step.id 
                                    ? 'bg-green-500 text-white' 
                                    : currentStep === step.id 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-200 text-gray-500'}
                            `}>
                                {currentStep > step.id ? <Check size={20} /> : step.id}
                            </div>
                            <span className={`text-xs mt-1 hidden sm:block ${
                                currentStep === step.id ? 'text-blue-600 font-medium' : 'text-gray-500'
                            }`}>
                                {step.title}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`w-8 sm:w-16 h-1 mx-1 rounded ${
                                currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                            }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[300px]">
                {/* Step 1: Type Selection */}
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-center mb-6">What would you like to report?</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'LOST' })}
                                className={`
                                    p-8 rounded-2xl border-2 transition-all text-center
                                    ${formData.type === 'LOST'
                                        ? 'border-red-500 bg-red-50 text-red-700 shadow-lg scale-105'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                                `}
                            >
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-red-500" />
                                </div>
                                <h4 className="text-xl font-bold mb-2">I Lost Something</h4>
                                <p className="text-sm text-gray-500">Report an item you've lost and need help finding</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, type: 'FOUND' })}
                                className={`
                                    p-8 rounded-2xl border-2 transition-all text-center
                                    ${formData.type === 'FOUND'
                                        ? 'border-green-500 bg-green-50 text-green-700 shadow-lg scale-105'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                                `}
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check size={32} className="text-green-500" />
                                </div>
                                <h4 className="text-xl font-bold mb-2">I Found Something</h4>
                                <p className="text-sm text-gray-500">Report an item you've found and want to return</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Item Details */}
                {currentStep === 2 && (
                    <div className="space-y-4">
                        <Input
                            label="Title *"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Black iPhone 14 Pro, Blue Wallet..."
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
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Describe the item in detail (color, size, distinguishing features...)"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {CATEGORIES.map(cat => {
                                    const Icon = cat.icon;
                                    return (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: cat.value })}
                                            className={`
                                                p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1
                                                ${formData.category === cat.value
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300'}
                                            `}
                                        >
                                            <Icon size={20} />
                                            <span className="text-xs">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Location *"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., Library 2nd floor"
                                required
                            />
                            <Input
                                label={`Date ${formData.type === 'LOST' ? 'Lost' : 'Found'}`}
                                name="dateLostFound"
                                type="date"
                                value={formData.dateLostFound}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Urgency Level
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {URGENCY_LEVELS.map(level => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, urgency: level.value })}
                                        className={`
                                            p-3 rounded-lg border-2 transition-colors text-center
                                            ${formData.urgency === level.value
                                                ? level.activeClasses
                                                : `border-gray-200 ${level.hoverClasses}`}
                                        `}
                                    >
                                        <div className={`w-3 h-3 rounded-full ${level.dotColor} mx-auto mb-1`} />
                                        <span className="text-sm font-medium">{level.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Photos */}
                {currentStep === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-2">Add Photos (Optional)</h3>
                        <p className="text-gray-500 text-sm mb-4">Add up to 5 photos to help identify the item</p>

                        <div className="grid grid-cols-5 gap-4">
                            {photoPreview.map((preview, idx) => (
                                <div key={idx} className="relative aspect-square">
                                    <img
                                        src={preview}
                                        alt={`Preview ${idx + 1}`}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(idx)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {photoPreview.length < 5 && (
                                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-400">Add Photo</span>
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

                        {photoPreview.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                <Upload size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-2">No photos added yet</p>
                                <label className="inline-block">
                                    <span className="text-blue-600 hover:underline cursor-pointer">Click to upload</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                        multiple
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 4: Verification Questions */}
                {currentStep === 4 && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl mb-4">
                            <Shield size={24} className="text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold text-blue-900">Verification Questions</h4>
                                <p className="text-sm text-blue-700">
                                    Add questions only the true owner would know. This helps verify legitimate claims.
                                </p>
                            </div>
                        </div>

                        {formData.verificationQuestions.map((q, idx) => (
                            <div key={idx} className="p-4 border border-gray-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Question {idx + 1}</span>
                                    {formData.verificationQuestions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeVerificationQuestion(idx)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                                <Input
                                    placeholder="e.g., What stickers are on the laptop?"
                                    value={q.question}
                                    onChange={(e) => updateVerificationQuestion(idx, 'question', e.target.value)}
                                />
                                <Input
                                    placeholder="Expected answer (only you will see this)"
                                    value={q.answer}
                                    onChange={(e) => updateVerificationQuestion(idx, 'answer', e.target.value)}
                                />
                            </div>
                        ))}

                        {formData.verificationQuestions.length < 3 && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addVerificationQuestion}
                                className="w-full"
                            >
                                + Add Another Question
                            </Button>
                        )}

                        <p className="text-sm text-gray-500 text-center">
                            Skip this step if you don't want to add verification questions
                        </p>
                    </div>
                )}

                {/* Step 5: Reward */}
                {currentStep === 5 && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl mb-4">
                            <Gift size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-semibold text-yellow-900">Offer a Reward (Optional)</h4>
                                <p className="text-sm text-yellow-700">
                                    Offering a reward may encourage more people to help find your item
                                </p>
                            </div>
                        </div>

                        <Input
                            label="Reward Amount"
                            name="reward"
                            value={formData.reward}
                            onChange={handleChange}
                            placeholder="e.g., $20, Coffee & snacks, Gift card..."
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reward Description
                            </label>
                            <textarea
                                name="rewardDescription"
                                value={formData.rewardDescription}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Any additional details about the reward..."
                            />
                        </div>

                        <p className="text-sm text-gray-500 text-center">
                            Leave empty if you don't want to offer a reward
                        </p>
                    </div>
                )}

                {/* Step 6: Contact Preference */}
                {currentStep === 6 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-2">How should people contact you?</h3>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: 'chat', label: 'In-App Chat', icon: MessageSquare, desc: 'Chat within the app' },
                                { value: 'phone', label: 'Phone', icon: Phone, desc: 'Share your number' },
                                { value: 'email', label: 'Email', icon: Mail, desc: 'Use your email' }
                            ].map(method => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, contactPreference: method.value })}
                                    className={`
                                        p-4 rounded-xl border-2 transition-all text-center
                                        ${formData.contactPreference === method.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'}
                                    `}
                                >
                                    <method.icon size={32} className="mx-auto mb-2" />
                                    <h4 className="font-medium">{method.label}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{method.desc}</p>
                                </button>
                            ))}
                        </div>

                        {formData.contactPreference === 'phone' && (
                            <Input
                                label="Phone Number *"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Your phone number"
                                required
                            />
                        )}

                        {/* Review Summary */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                            <h4 className="font-semibold mb-3">Review Your Post</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-gray-500">Type:</span> {formData.type}</div>
                                <div><span className="text-gray-500">Category:</span> {formData.category}</div>
                                <div className="col-span-2"><span className="text-gray-500">Title:</span> {formData.title}</div>
                                <div><span className="text-gray-500">Location:</span> {formData.location}</div>
                                <div><span className="text-gray-500">Urgency:</span> {formData.urgency}</div>
                                <div><span className="text-gray-500">Photos:</span> {formData.photos.length} uploaded</div>
                                <div><span className="text-gray-500">Reward:</span> {formData.reward || 'None'}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                {currentStep > 1 ? (
                    <Button type="button" variant="secondary" onClick={prevStep}>
                        <ChevronLeft size={18} />
                        Back
                    </Button>
                ) : (
                    <Button type="button" variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                )}

                {currentStep < STEPS.length ? (
                    <Button type="button" onClick={nextStep} disabled={!validateStep()}>
                        Next
                        <ChevronRight size={18} />
                    </Button>
                ) : (
                    <Button 
                        type="button" 
                        onClick={handleSubmit} 
                        loading={isSubmitting}
                        disabled={!validateStep()}
                    >
                        <Check size={18} />
                        Submit Post
                    </Button>
                )}
            </div>
        </Modal>
    );
}
