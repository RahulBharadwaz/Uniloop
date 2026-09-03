import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Input, Select, Loader } from '../../components/ui';
import { WantedItemCard, OfferModal } from '../../components/wanted';
import { 
    Plus, Search, Filter, X, TrendingUp, 
    Package, CheckCircle, Gift, Tag
} from 'lucide-react';
import useWantedItemStore from '../../stores/wantedItemStore';
import useAuthStore from '../../stores/authStore';
import CreateWantedItem from './CreateWantedItem';

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'sports', label: 'Sports' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'tools', label: 'Tools' },
    { value: 'other', label: 'Other' }
];

const BUDGET_TYPES = [
    { value: '', label: 'All Budgets' },
    { value: 'FREE_ONLY', label: 'Free Only' },
    { value: 'MAX_PRICE', label: 'Has Budget' },
    { value: 'ANY', label: 'Any Budget' }
];

const URGENCY_LEVELS = [
    { value: '', label: 'All Urgency' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
];

export default function WantedItemsIndex() {
    const navigate = useNavigate();
    const { items, myItems, isLoading, fetchItems, fetchMyItems } = useWantedItemStore();
    const { isAuthenticated, user } = useAuthStore();
    
    const [activeTab, setActiveTab] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        budgetType: '',
        urgency: ''
    });

    useEffect(() => {
        if (activeTab === 'myRequests') {
            fetchMyItems();
        } else if (activeTab === 'myOffers') {
            navigate('/wanted/my-offers');
        } else {
            fetchItems();
        }
    }, [activeTab]);

    // Ensure items and myItems are always arrays
    const safeItems = Array.isArray(items) ? items : [];
    const safeMyItems = Array.isArray(myItems) ? myItems : [];

    const stats = {
        totalRequests: safeItems.length,
        fulfilled: safeItems.filter(i => i.status === 'FULFILLED').length,
        successRate: safeItems.length > 0 
            ? Math.round((safeItems.filter(i => i.status === 'FULFILLED').length / safeItems.length) * 100) 
            : 0
    };

    const filteredItems = (activeTab === 'myRequests' ? safeMyItems : safeItems).filter(item => {
        if (searchQuery && 
            !item.title?.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.category && item.category !== filters.category) return false;
        if (filters.budgetType && item.budgetType !== filters.budgetType) return false;
        if (filters.urgency && item.urgency !== filters.urgency) return false;
        return true;
    });

    const handleClearFilters = () => {
        setFilters({ category: '', budgetType: '', urgency: '' });
        setSearchQuery('');
    };

    const handleMakeOffer = (item) => {
        if (!isAuthenticated) {
            toast.error('Please login to make an offer');
            navigate('/login');
            return;
        }
        setSelectedItem(item);
        setShowOfferModal(true);
    };

    const tabs = [
        { id: 'all', label: 'All Requests', count: safeItems.length },
        { id: 'myRequests', label: 'My Requests', count: safeMyItems.length },
        { id: 'myOffers', label: 'My Offers', count: 0 }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-2xl p-8 mb-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">Wanted Items</h1>
                    <p className="text-purple-100 mb-8">
                        Looking for something? Post what you need and let others help you find it!
                    </p>
                    
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Package size={24} />
                                <span className="text-3xl font-bold">{stats.totalRequests}</span>
                            </div>
                            <p className="text-purple-100 text-sm">Active Requests</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <CheckCircle size={24} />
                                <span className="text-3xl font-bold">{stats.fulfilled}</span>
                            </div>
                            <p className="text-purple-100 text-sm">Requests Fulfilled</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <TrendingUp size={24} />
                                <span className="text-3xl font-bold">{stats.successRate}%</span>
                            </div>
                            <p className="text-purple-100 text-sm">Success Rate</p>
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
                                ? 'bg-purple-600 text-white' 
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
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                            <span className="w-2 h-2 bg-purple-600 rounded-full" />
                        )}
                    </Button>

                    {isAuthenticated && (
                        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                            <Plus size={18} />
                            Post Request
                        </Button>
                    )}
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select
                                options={CATEGORIES}
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                placeholder="Category"
                            />
                            <Select
                                options={BUDGET_TYPES}
                                value={filters.budgetType}
                                onChange={(e) => setFilters({ ...filters, budgetType: e.target.value })}
                                placeholder="Budget Type"
                            />
                            <Select
                                options={URGENCY_LEVELS}
                                value={filters.urgency}
                                onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                                placeholder="Urgency"
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

            {/* Items Grid */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : filteredItems.length === 0 ? (
                <Card className="text-center py-16">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Tag size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No requests found</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            {activeTab === 'myRequests' 
                                ? "You haven't posted any requests yet."
                                : "Try adjusting your filters or search criteria."}
                        </p>
                        {isAuthenticated && (
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus size={18} />
                                Post a Request
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <WantedItemCard 
                            key={item._id} 
                            item={item} 
                            currentUser={user}
                            onMakeOffer={handleMakeOffer}
                        />
                    ))}
                </div>
            )}

            {/* Floating Action Button (Mobile) */}
            {isAuthenticated && (
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors lg:hidden z-40"
                >
                    <Plus size={24} />
                </button>
            )}

            {/* Create Modal */}
            <CreateWantedItem
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchItems();
                }}
            />

            {/* Offer Modal */}
            {selectedItem && (
                <OfferModal
                    isOpen={showOfferModal}
                    onClose={() => {
                        setShowOfferModal(false);
                        setSelectedItem(null);
                    }}
                    item={selectedItem}
                    onSuccess={() => {
                        fetchItems();
                    }}
                />
            )}
        </div>
    );
}
