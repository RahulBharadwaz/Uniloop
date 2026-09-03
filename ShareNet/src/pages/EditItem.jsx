import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Loader } from '../components/ui';
import { ItemForm } from '../components/items';
import useItemStore from '../stores/itemStore';

export default function EditItem() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentItem, isLoading: isFetching, fetchItem, updateItem } = useItemStore();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchItem(id);
    }, [id]);

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            await updateItem(id, formData);
            toast.success('Item updated successfully!');
            navigate('/my-items');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update item');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching || !currentItem) {
        return (
            <div className="flex justify-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Item</h1>
            <Card>
                <Card.Body>
                    <ItemForm 
                        initialData={currentItem}
                        onSubmit={handleSubmit} 
                        isLoading={isLoading} 
                    />
                </Card.Body>
            </Card>
        </div>
    );
}
