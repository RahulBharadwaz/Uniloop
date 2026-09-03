import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, MapPin } from 'lucide-react';
import { Button, Badge, Loader } from '../../components/ui';
import ClaimChatBox from '../../components/lostfound/ClaimChatBox';
import ClaimChatList from '../../components/lostfound/ClaimChatList';
import api from '../../lib/axios';

export default function ClaimChat() {
    const { claimId } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showList, setShowList] = useState(!claimId);

    useEffect(() => {
        if (claimId) {
            fetchClaim();
            setShowList(false);
        }
    }, [claimId]);

    const fetchClaim = async () => {
        if (!claimId) return;
        
        setIsLoading(true);
        try {
            const response = await api.get(`/lost-found/claims/${claimId}`);
            setClaim(response.data.data);
        } catch (error) {
            console.error('Failed to fetch claim:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectChat = (selectedClaimId, chat) => {
        navigate(`/lost-found/chat/${selectedClaimId}`);
        setClaim(chat?.claim || null);
    };

    const handleBack = () => {
        if (window.innerWidth < 768) {
            setShowList(true);
        } else {
            navigate('/lost-found/chat');
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'APPROVED': return 'success';
            case 'REJECTED': return 'danger';
            case 'COMPLETED': return 'primary';
            default: return 'secondary';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex h-[calc(100vh-64px)]">
                    {/* Left Sidebar - Chat List */}
                    <div className={`
                        w-full md:w-80 lg:w-96 bg-white border-r flex-shrink-0
                        ${claimId && !showList ? 'hidden md:block' : 'block'}
                    `}>
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                                <Link to="/lost-found" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <ArrowLeft size={20} />
                                </Link>
                                <h1 className="text-xl font-semibold">Claim Chats</h1>
                            </div>
                        </div>
                        <div className="overflow-y-auto h-[calc(100%-73px)]">
                            <ClaimChatList 
                                onSelectChat={handleSelectChat}
                                selectedClaimId={claimId}
                            />
                        </div>
                    </div>

                    {/* Right Main - Chat Box */}
                    <div className={`
                        flex-1 flex flex-col
                        ${!claimId || showList ? 'hidden md:flex' : 'flex'}
                    `}>
                        {claimId ? (
                            <>
                                {/* Context Bar */}
                                <div className="bg-white border-b p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleBack}
                                                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <ArrowLeft size={20} />
                                            </button>
                                            {claim?.post?.images?.[0] && (
                                                <img 
                                                    src={claim.post.images[0]} 
                                                    alt="" 
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            )}
                                            <div>
                                                <h2 className="font-semibold">
                                                    {claim?.post?.title || 'Loading...'}
                                                </h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {claim?.status && (
                                                        <Badge variant={getStatusVariant(claim.status)} size="sm">
                                                            {claim.status}
                                                        </Badge>
                                                    )}
                                                    {claim?.post?.type && (
                                                        <span className="text-sm text-gray-500">
                                                            {claim.post.type === 'LOST' ? 'Lost Item' : 'Found Item'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {claim?.post?._id && (
                                                <Link to={`/lost-found/${claim.post._id}`}>
                                                    <Button variant="secondary" size="sm">
                                                        <Eye size={16} className="mr-1" />
                                                        View Post
                                                    </Button>
                                                </Link>
                                            )}
                                            {claim?.meetup && (
                                                <Button variant="secondary" size="sm">
                                                    <MapPin size={16} className="mr-1" />
                                                    Meetup Details
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Box */}
                                <div className="flex-1 p-4 overflow-hidden">
                                    {isLoading ? (
                                        <div className="h-full flex items-center justify-center">
                                            <Loader />
                                        </div>
                                    ) : (
                                        <ClaimChatBox claimId={claimId} claim={claim} />
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Empty State */
                            <div className="flex-1 flex items-center justify-center bg-gray-50">
                                <div className="text-center px-4">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                        Select a conversation
                                    </h2>
                                    <p className="text-gray-500">
                                        Choose a claim chat from the list to start messaging.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
