import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { Button, Loader } from '../components/ui';
import { ItemCard, ItemFilters } from '../components/items';
import useItemStore from '../stores/itemStore';
import useAuthStore from '../stores/authStore';

export default function Items() {
    const { items, isLoading, filters, setFilters, fetchItems, recommendations, fetchRecommendations } = useItemStore();
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        fetchItems();
    }, [filters]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRecommendations();
        }
    }, [isAuthenticated]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleReset = () => {
        setFilters({
            category: '',
            mode: '',
            priceMin: '',
            priceMax: '',
            search: ''
        });
    };

    const recommendedIds = new Set((recommendations || []).map(r => r._id));
    const hasRecommendations = isAuthenticated && recommendations.length > 0;
    const filteredItems = hasRecommendations
        ? items.filter(i => !recommendedIds.has(i._id))
        : items;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Browse Items</h1>
                {isAuthenticated && (
                    <Link to="/my-items/new">
                        <Button>
                            <Plus size={18} />
                            List Item
                        </Button>
                    </Link>
                )}
            </div>

            <ItemFilters 
                filters={filters} 
                onChange={handleFilterChange} 
                onReset={handleReset}
            />

            {hasRecommendations && (
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-200">
                            <Sparkles className="text-white" size={17} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Picked for You</h2>
                            <p className="text-xs text-gray-400">Based on your activity and interests</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-3 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-violet-50 rounded-2xl -z-10" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-3">
                            {recommendations.map(item => (
                                <div key={item._id} className="relative">
                                    <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                                        <Sparkles size={10} />
                                        Recommended
                                    </div>
                                    <ItemCard item={item} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {hasRecommendations && (
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-gray-200" />
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">All Items</h2>
                    <div className="h-px flex-1 bg-gray-200" />
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No items found</p>
                    <p className="text-gray-400 mt-2">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <ItemCard key={item._id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
