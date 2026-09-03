import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Loader } from '../components/ui';
import useItemStore from '../stores/itemStore';

const modeColors = {
    RENT: 'primary',
    SELL: 'success',
    GIVE: 'warning'
};

export default function MyItems() {
    const { myItems, isLoading, fetchMyItems, deleteItem, toggleAvailability } = useItemStore();

    useEffect(() => {
        fetchMyItems();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await deleteItem(id);
            toast.success('Item deleted');
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    const handleToggleAvailability = async (id) => {
        try {
            await toggleAvailability(id);
            toast.success('Availability updated');
        } catch (error) {
            toast.error('Failed to update availability');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Items</h1>
                <Link to="/my-items/new">
                    <Button>
                        <Plus size={18} />
                        Add Item
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : myItems.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-12">
                        <p className="text-gray-500 text-lg mb-4">You haven't listed any items yet</p>
                        <Link to="/my-items/new">
                            <Button>Create Your First Listing</Button>
                        </Link>
                    </Card.Body>
                </Card>
            ) : (
                <div className="space-y-4">
                    {myItems.map(item => (
                        <Card key={item._id}>
                            <Card.Body className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.photos?.[0] ? (
                                        <img 
                                            src={item.photos[0]} 
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            No image
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{item.title}</h3>
                                        <Badge variant={modeColors[item.mode]}>{item.mode}</Badge>
                                        {!item.isAvailable && (
                                            <Badge variant="gray">Unavailable</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500">{item.category}</p>
                                    {item.price > 0 && (
                                        <p className="text-blue-600 font-medium">
                                            ${item.price}{item.mode === 'RENT' && '/day'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleAvailability(item._id)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                                    >
                                        {item.isAvailable ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <Link
                                        to={`/my-items/${item._id}/edit`}
                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    >
                                        <Edit2 size={18} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
