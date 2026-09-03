import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, Input, Loader, Avatar, TrustScore } from '../../components/ui';
import { 
    MapPin, Calendar, ArrowLeft, Edit, Trash2, Check, X, 
    MessageSquare, Clock, Gift, AlertCircle, Shield, 
    ChevronLeft, ChevronRight, User, Phone, Mail, CheckCircle,
    Eye, XCircle, Send
} from 'lucide-react';
import useLostFoundStore from '../../stores/lostFoundStore';
import useAuthStore from '../../stores/authStore';
import api from '../../lib/axios';

const urgencyLabels = {
    low: { label: 'Low Priority', color: 'gray' },
    medium: { label: 'Medium Priority', color: 'warning' },
    high: { label: 'High Priority', color: 'danger' },
    critical: { label: 'Critical', color: 'danger' }
};

const statusColors = {
    PENDING: 'warning',
    VERIFICATION: 'primary',
    VERIFIED: 'success',
    REJECTED: 'danger'
};

export default function LostFoundDetail() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { posts, myPosts, fetchPosts, markResolved, deletePost } = useLostFoundStore();
    
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Claim form state
    const [claimData, setClaimData] = useState({
        message: '',
        contactMethod: 'chat',
        phone: '',
        verificationAnswers: []
    });

    // Claims from API
    const [claims, setClaims] = useState([]);
    const [claimsLoading, setClaimsLoading] = useState(false);

    useEffect(() => {
        loadPost();
        if (searchParams.get('action') === 'claim') {
            setShowClaimModal(true);
        }
    }, [id]);

    const loadPost = async () => {
        setIsLoading(true);
        try {
            // Fetch post detail from API
            const response = await api.get(`/lost-found/${id}`);
            const postData = response.data?.data?.post || response.data?.data;
            if (postData) {
                setPost(postData);
                // If user is owner, fetch claims
                if (postData.user?._id === user?._id || postData.user === user?._id) {
                    fetchPostClaims();
                }
            }
        } catch (error) {
            console.error('Failed to load post:', error);
            toast.error('Failed to load post');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPostClaims = async () => {
        setClaimsLoading(true);
        try {
            const response = await api.get(`/lost-found/${id}/claims`);
            const claimsData = response.data?.data?.claims || response.data?.data || [];
            setClaims(Array.isArray(claimsData) ? claimsData : []);
        } catch (error) {
            console.error('Failed to load claims:', error);
            setClaims([]);
        } finally {
            setClaimsLoading(false);
        }
    };

    const isOwner = user?._id === post?.user?._id;
    const photos = post?.photos || (post?.photo ? [post.photo] : []);

    const handleResolve = async () => {
        setActionLoading(true);
        try {
            await markResolved(id);
            toast.success('Marked as resolved');
            setPost({ ...post, isResolved: true });
        } catch (error) {
            toast.error('Failed to mark as resolved');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await deletePost(id);
            toast.success('Post deleted');
            navigate('/lost-found');
        } catch (error) {
            toast.error('Failed to delete post');
        } finally {
            setActionLoading(false);
            setShowDeleteModal(false);
        }
    };

    const handleSubmitClaim = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post(`/lost-found/${id}/claim`, {
                message: claimData.message,
                contactPreference: claimData.contactMethod,
                phone: claimData.phone,
                verificationAnswers: claimData.verificationAnswers
            });
            toast.success('Claim submitted successfully!');
            setShowClaimModal(false);
            setClaimData({ message: '', contactMethod: 'chat', phone: '', verificationAnswers: [] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit claim');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClaimAction = async (claimId, action) => {
        setActionLoading(true);
        try {
            if (action === 'verify') {
                await api.patch(`/lost-found/claims/${claimId}/start-verification`);
            } else if (action === 'approve') {
                await api.patch(`/lost-found/claims/${claimId}/verify`);
            } else if (action === 'reject') {
                await api.patch(`/lost-found/claims/${claimId}/reject`, { reason: 'Rejected by owner' });
            }
            toast.success(`Claim ${action === 'reject' ? 'rejected' : action === 'verify' ? 'sent for verification' : 'approved'}`);
            fetchPostClaims(); // Refresh claims list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    if (!post) {
        return (
            <Card className="text-center py-12">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Post not found</h3>
                <p className="text-gray-500 mb-4">This post may have been deleted or doesn't exist.</p>
                <Button onClick={() => navigate('/lost-found')}>
                    <ArrowLeft size={18} />
                    Back to Lost & Found
                </Button>
            </Card>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate('/lost-found')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Lost & Found
            </button>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Photo Gallery */}
                    <Card className="overflow-hidden">
                        <div className="relative aspect-video bg-gray-100">
                            {photos.length > 0 ? (
                                <>
                                    <img
                                        src={photos[currentImageIndex]}
                                        alt={post.title}
                                        className="w-full h-full object-contain"
                                    />
                                    {photos.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setCurrentImageIndex(i => (i - 1 + photos.length) % photos.length)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                            >
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button
                                                onClick={() => setCurrentImageIndex(i => (i + 1) % photos.length)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                            >
                                                <ChevronRight size={24} />
                                            </button>
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                {photos.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={`w-2 h-2 rounded-full transition-colors ${
                                                            idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Eye size={64} />
                                </div>
                            )}
                        </div>

                        {/* Photo Thumbnails */}
                        {photos.length > 1 && (
                            <div className="p-4 flex gap-2 overflow-x-auto">
                                {photos.map((photo, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                                            idx === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                                        }`}
                                    >
                                        <img src={photo} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Post Info */}
                    <Card>
                        <Card.Body>
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge variant={post.type === 'LOST' ? 'danger' : 'success'} className="text-sm px-3 py-1">
                                            {post.type}
                                        </Badge>
                                        {post.urgency && (
                                            <Badge variant={urgencyLabels[post.urgency]?.color || 'gray'}>
                                                {urgencyLabels[post.urgency]?.label || post.urgency}
                                            </Badge>
                                        )}
                                        {post.isResolved && (
                                            <Badge variant="gray">
                                                <CheckCircle size={12} className="mr-1" />
                                                Resolved
                                            </Badge>
                                        )}
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6 whitespace-pre-wrap">{post.description}</p>

                            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                {post.category && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Category</p>
                                            <p className="font-medium capitalize">{post.category}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Location</p>
                                        <p className="font-medium">{post.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Date {post.type === 'LOST' ? 'Lost' : 'Found'}</p>
                                        <p className="font-medium">{format(new Date(post.createdAt), 'MMMM d, yyyy')}</p>
                                    </div>
                                </div>
                                {post.dateLostFound && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs">Last Seen</p>
                                            <p className="font-medium">{format(new Date(post.dateLostFound), 'MMMM d, yyyy')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Reward Section */}
                    {post.reward?.offered && (
                        <Card className="border-yellow-200 bg-yellow-50">
                            <Card.Body className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center">
                                    <Gift size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Reward Offered</h3>
                                    <p className="text-gray-600">
                                        {post.reward.amount ? `$${post.reward.amount}` : ''}
                                        {post.reward.amount && post.reward.description ? ' - ' : ''}
                                        {post.reward.description || 'Contact for details'}
                                    </p>
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Verification Questions (Owner View Only) */}
                    {isOwner && post.verificationQuestions?.length > 0 && (
                        <Card>
                            <Card.Header>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Shield size={18} />
                                    Verification Questions
                                </h3>
                            </Card.Header>
                            <Card.Body className="space-y-3">
                                {post.verificationQuestions.map((q, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Question {idx + 1}</p>
                                        <p className="font-medium">{q.question}</p>
                                        <p className="text-sm text-green-600 mt-1">Answer: {q.answer}</p>
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Claims List (Owner View) */}
                    {isOwner && (
                        <Card>
                            <Card.Header>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <MessageSquare size={18} />
                                    Claims ({claims.length})
                                </h3>
                            </Card.Header>
                            <Card.Body className="space-y-4">
                                {claimsLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader />
                                    </div>
                                ) : claims.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No claims yet</p>
                                ) : (
                                    claims.map(claim => (
                                        <div key={claim._id} className="border border-gray-100 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <Avatar src={claim.claimant?.avatar} name={claim.claimant?.fullName} size="md" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">{claim.claimant?.fullName || 'Unknown'}</span>
                                                        {claim.claimant?.trustScore && <TrustScore score={claim.claimant.trustScore} size="sm" />}
                                                        <Badge variant={statusColors[claim.status]}>{claim.status}</Badge>
                                                    </div>
                                                    <p className="text-gray-600 text-sm mb-2">{claim.message}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {format(new Date(claim.createdAt), 'MMM d, yyyy h:mm a')}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                                {claim.status === 'PENDING' && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            variant="primary"
                                                            onClick={() => handleClaimAction(claim._id, 'verify')}
                                                        >
                                                            <Shield size={14} />
                                                            Verify
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="danger"
                                                            onClick={() => handleClaimAction(claim._id, 'reject')}
                                                        >
                                                            <X size={14} />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {claim.status === 'VERIFICATION' && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            variant="success"
                                                            onClick={() => handleClaimAction(claim._id, 'approve')}
                                                        >
                                                            <Check size={14} />
                                                            Approve
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="danger"
                                                            onClick={() => handleClaimAction(claim._id, 'reject')}
                                                        >
                                                            <X size={14} />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {claim.status === 'VERIFIED' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="primary"
                                                        onClick={() => navigate(`/lost-found/chat/${claim._id}`)}
                                                    >
                                                        <MessageSquare size={14} />
                                                        Chat
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    {/* Timeline */}
                    <Card>
                        <Card.Header>
                            <h3 className="font-semibold">Timeline</h3>
                        </Card.Header>
                        <Card.Body>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Send size={14} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Posted</p>
                                        <p className="text-sm text-gray-500">
                                            {format(new Date(post.createdAt), 'MMM d, yyyy h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                {claims.length > 0 && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <MessageSquare size={14} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{claims.length} claim(s) received</p>
                                        </div>
                                    </div>
                                )}
                                {post.isResolved && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                            <CheckCircle size={14} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Resolved</p>
                                            {post.resolvedAt && (
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(post.resolvedAt), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Owner Info Card */}
                    <Card>
                        <Card.Body>
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar src={post.user?.avatar} name={post.user?.fullName} size="lg" />
                                <div>
                                    <p className="font-semibold text-gray-900">{post.user?.fullName}</p>
                                    <p className="text-sm text-gray-500">Posted by</p>
                                </div>
                            </div>
                            
                            {post.user?.trustScore && (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
                                    <span className="text-gray-600">Trust Score</span>
                                    <TrustScore score={post.user.trustScore} size="md" />
                                </div>
                            )}

                            {!isOwner && !post.isResolved && (
                                <Button 
                                    className="w-full" 
                                    onClick={() => setShowClaimModal(true)}
                                    variant={post.type === 'LOST' ? 'success' : 'primary'}
                                >
                                    {post.type === 'LOST' ? 'I Found This Item' : 'This is My Item'}
                                </Button>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Owner Actions */}
                    {isOwner && !post.isResolved && (
                        <Card>
                            <Card.Body className="space-y-3">
                                <Button 
                                    variant="secondary" 
                                    className="w-full"
                                    onClick={() => navigate(`/lost-found/${id}/edit`)}
                                >
                                    <Edit size={18} />
                                    Edit Post
                                </Button>
                                <Button 
                                    variant="success" 
                                    className="w-full"
                                    onClick={handleResolve}
                                    loading={actionLoading}
                                >
                                    <CheckCircle size={18} />
                                    Mark as Resolved
                                </Button>
                                <Button 
                                    variant="danger" 
                                    className="w-full"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <Trash2 size={18} />
                                    Delete Post
                                </Button>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Contact Info */}
                    {post.contactPreference && (
                        <Card>
                            <Card.Header>
                                <h3 className="font-semibold">Contact Preference</h3>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-gray-600 capitalize">{post.contactPreference}</p>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </div>

            {/* Claim Modal */}
            <Modal
                isOpen={showClaimModal}
                onClose={() => setShowClaimModal(false)}
                title={post.type === 'LOST' ? 'Report Found Item' : 'Claim This Item'}
                size="md"
            >
                <form onSubmit={handleSubmitClaim} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Message *
                        </label>
                        <textarea
                            value={claimData.message}
                            onChange={(e) => setClaimData({ ...claimData, message: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={post.type === 'LOST' 
                                ? "Describe where and when you found this item..."
                                : "Describe how you can prove this item is yours..."
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Contact Method
                        </label>
                        <div className="flex gap-3">
                            {['chat', 'phone', 'email'].map(method => (
                                <label 
                                    key={method}
                                    className={`
                                        flex-1 py-3 px-4 rounded-lg border-2 text-center cursor-pointer transition-colors capitalize
                                        ${claimData.contactMethod === method 
                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                            : 'border-gray-200 hover:border-gray-300'}
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="contactMethod"
                                        value={method}
                                        checked={claimData.contactMethod === method}
                                        onChange={(e) => setClaimData({ ...claimData, contactMethod: e.target.value })}
                                        className="hidden"
                                    />
                                    {method === 'chat' && <MessageSquare size={18} className="mx-auto mb-1" />}
                                    {method === 'phone' && <Phone size={18} className="mx-auto mb-1" />}
                                    {method === 'email' && <Mail size={18} className="mx-auto mb-1" />}
                                    {method}
                                </label>
                            ))}
                        </div>
                    </div>

                    {claimData.contactMethod === 'phone' && (
                        <Input
                            label="Phone Number"
                            type="tel"
                            value={claimData.phone}
                            onChange={(e) => setClaimData({ ...claimData, phone: e.target.value })}
                            placeholder="Your phone number"
                            required
                        />
                    )}

                    {/* Verification Questions for claiming */}
                    {post.verificationQuestions?.length > 0 && post.type === 'FOUND' && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Answer Verification Questions
                            </label>
                            {post.verificationQuestions.map((q, idx) => (
                                <Input
                                    key={idx}
                                    label={q.question}
                                    value={claimData.verificationAnswers[idx] || ''}
                                    onChange={(e) => {
                                        const newAnswers = [...claimData.verificationAnswers];
                                        newAnswers[idx] = e.target.value;
                                        setClaimData({ ...claimData, verificationAnswers: newAnswers });
                                    }}
                                    placeholder="Your answer..."
                                />
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => setShowClaimModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1"
                            loading={actionLoading}
                        >
                            Submit Claim
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Post"
                size="sm"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} className="text-red-600" />
                    </div>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete this post? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <Button 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="danger" 
                            className="flex-1"
                            onClick={handleDelete}
                            loading={actionLoading}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
