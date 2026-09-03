import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, Input, Select, Loader, Avatar } from '../components/ui';
import { MapPin, Plus, Check, Trash2, Upload, Search as SearchIcon } from 'lucide-react';
import useLostFoundStore from '../stores/lostFoundStore';

export default function LostFound() {
    const { posts, myPosts, isLoading, filter, setFilter, fetchPosts, fetchMyPosts, createPost, markResolved, deletePost } = useLostFoundStore();
    const [tab, setTab] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        type: 'LOST',
        title: '',
        description: '',
        location: ''
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (tab === 'mine') {
            fetchMyPosts();
        } else {
            fetchPosts();
        }
    }, [tab, filter]);

    const handleFilterChange = (key, value) => {
        setFilter({ [key]: value });
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const data = new FormData();
            data.append('type', formData.type);
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('location', formData.location);
            if (photo) data.append('photo', photo);

            await createPost(data);
            toast.success('Post created successfully!');
            setShowCreateModal(false);
            setFormData({ type: 'LOST', title: '', description: '', location: '' });
            setPhoto(null);
            setPhotoPreview(null);
            fetchPosts();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (id) => {
        setActionLoading(id);
        try {
            await markResolved(id);
            toast.success('Marked as resolved');
        } catch (error) {
            toast.error('Failed to mark as resolved');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        setActionLoading(id);
        try {
            await deletePost(id);
            toast.success('Post deleted');
        } catch (error) {
            toast.error('Failed to delete post');
        } finally {
            setActionLoading(null);
        }
    };

    const displayPosts = tab === 'mine' ? myPosts : posts;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} />
                    Create Post
                </Button>
            </div>

            {/* Tabs and Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex gap-2">
                    <Button
                        variant={tab === 'all' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setTab('all')}
                    >
                        All Posts
                    </Button>
                    <Button
                        variant={tab === 'mine' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setTab('mine')}
                    >
                        My Posts
                    </Button>
                </div>

                {tab === 'all' && (
                    <div className="flex gap-2 ml-auto">
                        <Select
                            options={[
                                { value: 'LOST', label: 'Lost Items' },
                                { value: 'FOUND', label: 'Found Items' }
                            ]}
                            placeholder="All Types"
                            value={filter.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="w-36"
                        />
                        <Select
                            options={[
                                { value: 'false', label: 'Active' },
                                { value: 'true', label: 'Resolved' }
                            ]}
                            placeholder="All Status"
                            value={filter.resolved}
                            onChange={(e) => handleFilterChange('resolved', e.target.value)}
                            className="w-32"
                        />
                    </div>
                )}
            </div>

            {/* Posts Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : displayPosts.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-12">
                        <SearchIcon size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No posts found</p>
                    </Card.Body>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayPosts.map(post => (
                        <Card key={post._id} className={post.isResolved ? 'opacity-60' : ''}>
                            {post.photo && (
                                <div className="aspect-video bg-gray-100">
                                    <img
                                        src={post.photo}
                                        alt={post.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <Card.Body>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-semibold">{post.title}</h3>
                                    <Badge variant={post.type === 'LOST' ? 'danger' : 'success'}>
                                        {post.type}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                    {post.description}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                                    <MapPin size={14} />
                                    {post.location}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar src={post.user?.avatar} name={post.user?.fullName} size="sm" />
                                        <span className="text-sm text-gray-500">
                                            {format(new Date(post.createdAt), 'MMM d')}
                                        </span>
                                    </div>
                                    {post.isResolved && (
                                        <Badge variant="gray">Resolved</Badge>
                                    )}
                                </div>
                            </Card.Body>
                            {tab === 'mine' && !post.isResolved && (
                                <Card.Footer className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => handleResolve(post._id)}
                                        loading={actionLoading === post._id}
                                        className="flex-1"
                                    >
                                        <Check size={14} />
                                        Resolve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleDelete(post._id)}
                                        loading={actionLoading === post._id}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </Card.Footer>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Post"
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <label className={`
                            flex-1 py-3 rounded-lg border-2 text-center cursor-pointer transition-colors
                            ${formData.type === 'LOST' 
                                ? 'border-red-500 bg-red-50 text-red-700' 
                                : 'border-gray-200 hover:border-gray-300'}
                        `}>
                            <input
                                type="radio"
                                name="type"
                                value="LOST"
                                checked={formData.type === 'LOST'}
                                onChange={handleFormChange}
                                className="hidden"
                            />
                            I Lost Something
                        </label>
                        <label className={`
                            flex-1 py-3 rounded-lg border-2 text-center cursor-pointer transition-colors
                            ${formData.type === 'FOUND' 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-200 hover:border-gray-300'}
                        `}>
                            <input
                                type="radio"
                                name="type"
                                value="FOUND"
                                checked={formData.type === 'FOUND'}
                                onChange={handleFormChange}
                                className="hidden"
                            />
                            I Found Something
                        </label>
                    </div>

                    <Input
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleFormChange}
                        placeholder="e.g., Black wallet, iPhone 14..."
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleFormChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe the item in detail..."
                            required
                        />
                    </div>

                    <Input
                        label="Location"
                        name="location"
                        value={formData.location}
                        onChange={handleFormChange}
                        placeholder="e.g., Library 2nd floor, Main cafeteria..."
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo (Optional)
                        </label>
                        {photoPreview ? (
                            <div className="relative w-32 h-32">
                                <img
                                    src={photoPreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPhoto(null);
                                        setPhotoPreview(null);
                                    }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <label className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                                <Upload size={24} className="text-gray-400" />
                                <span className="text-xs text-gray-400 mt-1">Add Photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    <Button type="submit" loading={isSubmitting} className="w-full">
                        Create Post
                    </Button>
                </form>
            </Modal>
        </div>
    );
}
