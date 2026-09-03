import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, MapPin } from 'lucide-react';
import { Button, Badge, Loader } from '../../components/ui';
import OfferChatBox from '../../components/wanted/OfferChatBox';
import api from '../../lib/axios';

export default function OfferChat() {
    const { offerId } = useParams();
    const navigate = useNavigate();
    const [offer, setOffer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (offerId) {
            fetchOffer();
        }
    }, [offerId]);

    const fetchOffer = async () => {
        if (!offerId) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get(`/wanted-items/offers/${offerId}`);
            setOffer(response.data.data);
        } catch (error) {
            console.error('Failed to fetch offer:', error);
            setError('Failed to load offer details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/wanted');
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'ACCEPTED': return 'success';
            case 'REJECTED': return 'danger';
            case 'COMPLETED': return 'primary';
            default: return 'secondary';
        }
    };

    const getOfferTypeLabel = (type) => {
        switch (type) {
            case 'FREE': return 'Free';
            case 'SELL': return 'For Sale';
            case 'RENT': return 'For Rent';
            default: return type;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={handleBack}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col h-[calc(100vh-64px)]">
                    <div className="bg-white border-b p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBack}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                {offer?.wantedItem?.images?.[0] && (
                                    <img 
                                        src={offer.wantedItem.images[0]} 
                                        alt="" 
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                )}
                                <div>
                                    <h2 className="font-semibold">
                                        {offer?.wantedItem?.title || 'Wanted Item'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        {offer?.status && (
                                            <Badge variant={getStatusVariant(offer.status)} size="sm">
                                                {offer.status}
                                            </Badge>
                                        )}
                                        {offer?.offerType && (
                                            <span className="text-sm text-gray-500">
                                                {getOfferTypeLabel(offer.offerType)}
                                            </span>
                                        )}
                                        {offer?.price > 0 && (
                                            <span className="text-sm font-medium text-gray-700">
                                                ${offer.price}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {offer?.wantedItem?._id && (
                                    <Link to={`/wanted/${offer.wantedItem._id}`}>
                                        <Button variant="secondary" size="sm">
                                            <Eye size={16} className="mr-1" />
                                            View Item
                                        </Button>
                                    </Link>
                                )}
                                {offer?.meetup && (
                                    <Button variant="secondary" size="sm">
                                        <MapPin size={16} className="mr-1" />
                                        Meetup Details
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-hidden">
                        <OfferChatBox offerId={offerId} offer={offer} />
                    </div>
                </div>
            </div>
        </div>
    );
}
