import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '../components/ui';
import { ItemForm } from '../components/items';
import useItemStore from '../stores/itemStore';

export default function CreateItem() {
    const [isLoading, setIsLoading] = useState(false);
    const { createItem } = useItemStore();
    const navigate = useNavigate();

    const handleSubmit = async (formData) => {
        setIsLoading(true);
        try {
            await createItem(formData);
            toast.success('Item listed successfully!');
            navigate('/my-items');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create item');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">List a New Item</h1>
            <Card>
                <Card.Body>
                    <ItemForm onSubmit={handleSubmit} isLoading={isLoading} />
                </Card.Body>
            </Card>
        </div>
    );
}
