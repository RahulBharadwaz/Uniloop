import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Input, Select, Loader, Avatar } from '../../components/ui';
import { 
    MapPin, Plus, Search, Calendar, Award, Users, 
    CheckCircle, Clock, Filter, X, Eye, MessageSquare,
    TrendingUp, AlertCircle, Gift
} from 'lucide-react';
import useLostFoundStore from '../../stores/lostFoundStore';
import useAuthStore from '../../stores/authStore';
import CreateLostFoundPost from './CreateLostFoundPost';

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'documents', label: 'Documents' },
    { value: 'keys', label: 'Keys' },
    { value: 'bags', label: 'Bags & Wallets' },
    { value: 'other', label: 'Other' }
];

const URGENCY_LEVELS = [
    { value: '', label: 'All Urgency' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
];

const urgencyBadgeVariant = {
    low: 'gray',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
};

const urgencyLabel = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
};

export default function LostFoundIndex() {
    const navigate = useNavigate();
    const { posts, myPosts, isLoading, filter, setFilter, fetchPosts, fetchMyPosts } = useLostFoundStore();
    const { isAuthenticated, user } = useAuthStore();
    
    const [activeTab, setActiveTab] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        urgency: '',
        location: '',
        dateFrom: '',
        dateTo: ''
    });

    useEffect(() => {
        if (activeTab === 'myPosts') {
            fetchMyPosts();
        } else {
            fetchPosts();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'myPosts') {
            const typeFilter = activeTab === 'lost' ? 'LOST' : activeTab === 'found' ? 'FOUND' : '';
            if (filter.type !== typeFilter) {
                setFilter({ type: typeFilter });
            }
        }
    }, [activeTab]);

    // Ensure posts and myPosts are always arrays
    const safePosts = Array.isArray(posts) ? posts : [];
    const safeMyPosts = Array.isArray(myPosts) ? myPosts : [];

    const stats = {
        itemsFound: safePosts.filter(p => p.type === 'FOUND').length,
        itemsReturned: safePosts.filter(p => p.isResolved).length,
        successRate: safePosts.length > 0 
            ? Math.round((safePosts.filter(p => p.isResolved).length / safePosts.length) * 100) 
            : 0
    };

    const filteredPosts = (activeTab === 'myPosts' ? safeMyPosts : safePosts).filter(post => {
        if (searchQuery && !post.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !post.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.category && post.category !== filters.category) return false;
        if (filters.urgency && post.urgency !== filters.urgency) return false;
        if (filters.location && !post.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
        return true;
    });

    const handleClearFilters = () => {
        setFilters({
            category: '',
            urgency: '',
            location: '',
            dateFrom: '',
            dateTo: ''
        });
        setSearchQuery('');
    };

    const tabs = [
        { id: 'all', label: 'All Posts', count: safePosts.length },
        { id: 'lost', label: 'Lost Items', count: safePosts.filter(p => p.type === 'LOST').length },
        { id: 'found', label: 'Found Items', count: safePosts.filter(p => p.type === 'FOUND').length },
        { id: 'myPosts', label: 'My Posts', count: safeMyPosts.length }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section with Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 mb-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-2xl font-bold mb-4">Lost & Found</h1>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3" title="Total items reported as found by the community">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Eye size={20} />
                                <span className="text-2xl font-bold">{stats.itemsFound}</span>
                            </div>
                            <p className="text-blue-100 text-xs">Items Found</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3" title="Items successfully returned to their owners">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <CheckCircle size={20} />
                                <span className="text-2xl font-bold">{stats.itemsReturned}</span>
                            </div>
                            <p className="text-blue-100 text-xs">Items Returned</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-3" title="Percentage of posts that have been resolved">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <TrendingUp size={20} />
                                <span className="text-2xl font-bold">{stats.successRate}%</span>
                            </div>
                            <p className="text-blue-100 text-xs">Success Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2
                            ${activeTab === tab.id 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                        `}
                    >
                        {tab.label}
                        <span className={`
                            text-xs px-2 py-0.5 rounded-full
                            ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}
                        `}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                    >
                        <Filter size={18} />
                        Filters
                        {Object.values(filters).some(v => v) && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                    </Button>

                    {isAuthenticated && (
                        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                            <Plus size={18} />
                            Report Item
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Select
                                options={CATEGORIES}
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                placeholder="Category"
                            />
                            <Select
                                options={URGENCY_LEVELS}
                                value={filters.urgency}
                                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                                placeholder="Urgency"
                            />
                            <Input
                                placeholder="Location"
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            />
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                placeholder="From Date"
                            />
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                placeholder="To Date"
                            />
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                                <X size={16} />
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Posts Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : filteredPosts.length === 0 ? (
                <Card className="text-center py-16">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Search size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No items found</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            {activeTab === 'myPosts' 
                                ? "You haven't posted any lost or found items yet."
                                : "Try adjusting your filters or search criteria."}
                        </p>
                        {isAuthenticated && (
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus size={18} />
                                Report an Item
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPosts.map(post => (
                        <PostCard key={post._id} post={post} currentUser={user} />
                    ))}
                </div>
            )}

            {/* Floating Action Button (Mobile) */}
            {isAuthenticated && (
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors lg:hidden z-40"
                >
                    <Plus size={24} />
                </button>
            )}

            {/* Create Post Modal */}
            <CreateLostFoundPost
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchPosts();
                }}
            />
        </div>
    );
}

function PostCard({ post, currentUser }) {
    const navigate = useNavigate();
    const isOwner = currentUser?._id === post.user?._id;

    return (
        <Card 
            hover 
            className="overflow-hidden group"
            onClick={() => navigate(`/lost-found/${post._id}`)}
        >
            {/* Photo */}
            <div className="relative aspect-video bg-gray-100">
                {post.photo || post.photos?.[0] ? (
                    <img
                        src={post.photo || post.photos[0]}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Search size={32} />
                    </div>
                )}
                
                {/* Type Badge */}
                <Badge 
                    variant={post.type === 'LOST' ? 'danger' : 'success'}
                    className="absolute top-3 left-3"
                >
                    {post.type}
                </Badge>

                {/* Urgency Badge */}
                {post.urgency && (
                    <Badge 
                        variant={urgencyBadgeVariant[post.urgency]} 
                        className="absolute top-3 right-3 text-xs"
                    >
                        {urgencyLabel[post.urgency]}
                    </Badge>
                )}

                {/* Reward Badge */}
                {post.reward?.offered && (
                    <div className="absolute bottom-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Gift size={12} />
                        Reward
                    </div>
                )}
            </div>

            <Card.Body>
                <h3 className="font-semibold text-gray-900 truncate mb-1">{post.title}</h3>
                
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <MapPin size={14} />
                    <span className="truncate">{post.location}</span>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
                    <Calendar size={14} />
                    <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar src={post.user?.avatar} name={post.user?.fullName} size="sm" />
                        <span className="text-sm text-gray-600 truncate max-w-[100px]">
                            {post.user?.fullName}
                        </span>
                    </div>

                    {post.claimsCount > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MessageSquare size={14} />
                            <span>{post.claimsCount}</span>
                        </div>
                    )}
                </div>

                {/* Status Badges */}
                {post.isResolved && (
                    <Badge variant="gray" className="mt-3">
                        <CheckCircle size={12} className="mr-1" />
                        Resolved
                    </Badge>
                )}
            </Card.Body>

            {!post.isResolved && !isOwner && (
                <Card.Footer className="pt-0">
                    <Button 
                        size="sm" 
                        className="w-full"
                        variant={post.type === 'LOST' ? 'success' : 'primary'}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lost-found/${post._id}?action=claim`);
                        }}
                    >
                        {post.type === 'LOST' ? 'I Found It' : 'This is Mine'}
                    </Button>
                </Card.Footer>
            )}
        </Card>
    );
}
