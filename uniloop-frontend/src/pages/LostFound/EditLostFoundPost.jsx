import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Input, Loader } from '../../components/ui';
import { 
    Upload, X, ArrowLeft, Check,
    MapPin, Calendar, AlertCircle, Gift, Shield,
    Smartphone, Shirt, Key, FileText, Briefcase, Package,
    MessageSquare, Phone, Mail
} from 'lucide-react';
import useLostFoundStore from '../../stores/lostFoundStore';

const CATEGORIES = [
    { value: 'Electronics', label: 'Electronics', icon: Smartphone },
    { value: 'Clothing', label: 'Clothing', icon: Shirt },
    { value: 'Keys', label: 'Keys', icon: Key },
    { value: 'Documents', label: 'Documents', icon: FileText },
    { value: 'Bags', label: 'Bags & Wallets', icon: Briefcase },
    { value: 'Accessories', label: 'Accessories', icon: Package },
    { value: 'Other', label: 'Other', icon: Package }
];

const URGENCY_LEVELS = [
    { value: 'LOW', label: 'Low', description: 'Not urgent', activeClasses: 'border-gray-500 bg-gray-50 text-gray-700', hoverClasses: 'hover:border-gray-300' },
    { value: 'MEDIUM', label: 'Medium', description: 'Would like to find it soon', activeClasses: 'border-yellow-500 bg-yellow-50 text-yellow-700', hoverClasses: 'hover:border-yellow-300' },
    { value: 'HIGH', label: 'High', description: 'Need it back urgently', activeClasses: 'border-orange-500 bg-orange-50 text-orange-700', hoverClasses: 'hover:border-orange-300' },
    { value: 'CRITICAL', label: 'Critical', description: 'Essential item', activeClasses: 'border-red-500 bg-red-50 text-red-700', hoverClasses: 'hover:border-red-300' }
];

const CONTACT_METHODS = [
    { value: 'CHAT', label: 'In-App Chat', icon: MessageSquare },
    { value: 'PHONE', label: 'Phone', icon: Phone },
    { value: 'EMAIL', label: 'Email', icon: Mail }
];

export default function EditLostFoundPost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentPost, fetchPostDetail, updatePost, isLoading } = useLostFoundStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        dateLostFound: '',
        urgency: 'MEDIUM',
        photo: null,
        verificationQuestions: [{ question: '', answer: '' }],
        reward: '',
        rewardDescription: '',
        contactPreference: 'CHAT',
        phone: ''
    });

    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        fetchPostDetail(id);
    }, [id]);

    useEffect(() => {
        if (currentPost && (currentPost._id === id) && !loaded) {
            setFormData({
                title: currentPost.title || '',
                description: currentPost.description || '',
                category: currentPost.category || '',
                location: currentPost.location || '',
                dateLostFound: currentPost.lastSeenDate ? new Date(currentPost.lastSeenDate).toISOString().split('T')[0] : '',
                urgency: currentPost.urgency || 'MEDIUM',
                photo: null,
                verificationQuestions: currentPost.verificationQuestions?.length > 0
                    ? currentPost.verificationQuestions.map(q => ({ question: q.question || '', answer: q.answer || '' }))
                    : [{ question: '', answer: '' }],
                reward: currentPost.reward?.amount?.toString() || '',
                rewardDescription: currentPost.reward?.description || '',
                contactPreference: currentPost.contactPreference || 'CHAT',
                phone: ''
            });

            if (currentPost.photo) {
                setPhotoPreview(currentPost.photo);
            }
            setLoaded(true);
        }
    }, [currentPost, id, loaded]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, photo: file });
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setFormData({ ...formData, photo: null });
        setPhotoPreview(null);
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) { toast.error('Title is required'); return; }
        if (!formData.description.trim()) { toast.error('Description is required'); return; }
        if (!formData.category) { toast.error('Category is required'); return; }
        if (!formData.location.trim()) { toast.error('Location is required'); return; }

        setIsSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('category', formData.category);
            data.append('location', formData.location);
            data.append('urgency', formData.urgency);
            data.append('contactPreference', formData.contactPreference);

            if (formData.dateLostFound) data.append('lastSeenDate', formData.dateLostFound);

            if (formData.reward) {
                data.append('reward', JSON.stringify({
                    offered: true,
                    amount: parseFloat(formData.reward.replace(/[^0-9.]/g, '')) || 0,
                    description: formData.rewardDescription || formData.reward
                }));
            }

            const validQuestions = formData.verificationQuestions.filter(q => q.question && q.answer);
            if (validQuestions.length > 0) {
                data.append('verificationQuestions', JSON.stringify(validQuestions));
            }

            if (formData.photo instanceof File) {
                data.append('photo', formData.photo);
            }

            await updatePost(id, data);
            toast.success('Post updated successfully!');
            navigate(`/lost-found/${id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update post');
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
                onClick={() => navigate(`/lost-found/${id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft size={20} />
                Back to Post
            </button>

            <Card>
                <Card.Header>
                    <h1 className="text-xl font-bold">Edit Lost & Found Post</h1>
                </Card.Header>
                <Card.Body>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Title *"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="What was lost or found?"
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
                                placeholder="Describe the item in detail..."
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

                        <Input
                            label="Location *"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Where was it lost/found?"
                            required
                            icon={<MapPin size={16} />}
                        />

                        <Input
                            label="Date Lost/Found"
                            type="date"
                            name="dateLostFound"
                            value={formData.dateLostFound}
                            onChange={handleChange}
                            icon={<Calendar size={16} />}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                            <div className="grid grid-cols-4 gap-2">
                                {URGENCY_LEVELS.map(level => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, urgency: level.value })}
                                        className={`p-2 rounded-lg border-2 transition-all text-center ${formData.urgency === level.value ? level.activeClasses : `border-gray-200 ${level.hoverClasses}`}`}
                                    >
                                        <span className="text-sm font-medium">{level.label}</span>
                                        <p className="text-xs mt-0.5 opacity-70">{level.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                            {photoPreview ? (
                                <div className="relative w-32 h-32">
                                    <img src={photoPreview} alt="Item" className="w-full h-full object-cover rounded-lg" />
                                    <button type="button" onClick={removePhoto} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50">
                                    <Upload size={24} className="text-gray-400 mb-2" />
                                    <span className="text-xs text-gray-400">Add Photo</span>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Shield size={18} className="text-blue-600" />
                                <label className="text-sm font-medium text-gray-700">Verification Questions</label>
                            </div>
                            {formData.verificationQuestions.map((q, idx) => (
                                <div key={idx} className="p-3 border border-gray-200 rounded-lg space-y-2 mb-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Question {idx + 1}</span>
                                        {formData.verificationQuestions.length > 1 && (
                                            <button type="button" onClick={() => removeVerificationQuestion(idx)} className="text-red-500 hover:text-red-600">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <Input
                                        placeholder="e.g., What stickers are on the laptop?"
                                        value={q.question}
                                        onChange={(e) => updateVerificationQuestion(idx, 'question', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Expected answer"
                                        value={q.answer}
                                        onChange={(e) => updateVerificationQuestion(idx, 'answer', e.target.value)}
                                    />
                                </div>
                            ))}
                            {formData.verificationQuestions.length < 3 && (
                                <Button type="button" variant="secondary" size="sm" onClick={addVerificationQuestion}>
                                    + Add Question
                                </Button>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Gift size={18} className="text-yellow-600" />
                                <label className="text-sm font-medium text-gray-700">Reward (Optional)</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    name="reward"
                                    value={formData.reward}
                                    onChange={handleChange}
                                    placeholder="e.g., $20"
                                />
                                <Input
                                    name="rewardDescription"
                                    value={formData.rewardDescription}
                                    onChange={handleChange}
                                    placeholder="Reward details..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Preference</label>
                            <div className="grid grid-cols-3 gap-3">
                                {CONTACT_METHODS.map(method => (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, contactPreference: method.value })}
                                        className={`p-3 rounded-lg border-2 transition-all text-center ${formData.contactPreference === method.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <method.icon size={20} className="mx-auto mb-1" />
                                        <span className="text-xs font-medium">{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate(`/lost-found/${id}`)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" loading={isSubmitting}>
                                <Check size={18} />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card.Body>
            </Card>
        </div>
    );
}
