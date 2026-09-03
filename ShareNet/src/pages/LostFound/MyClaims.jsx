import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Modal, Input, Loader, Avatar } from '../../components/ui';
import { 
    ArrowLeft, MessageSquare, MapPin, Calendar, Check, X, 
    Clock, AlertCircle, CheckCircle, XCircle, Eye, Send,
    ChevronRight, Shield
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import useLostFoundStore from '../../stores/lostFoundStore';

const STATUS_CONFIG = {
    PENDING: { 
        label: 'Pending', 
        color: 'warning', 
        icon: Clock,
        description: 'Waiting for response from the owner'
    },
    VERIFICATION: { 
        label: 'Verification', 
        color: 'primary', 
        icon: Shield,
        description: 'Verification questions sent'
    },
    VERIFIED: { 
        label: 'Verified', 
        color: 'success', 
        icon: CheckCircle,
        description: 'Claim verified - You can now chat!'
    },
    REJECTED: { 
        label: 'Rejected', 
        color: 'danger', 
        icon: XCircle,
        description: 'Claim was rejected'
    }
};

const PROGRESS_STEPS = [
    { id: 'submitted', label: 'Submitted' },
    { id: 'reviewing', label: 'Reviewing' },
    { id: 'verification', label: 'Verification' },
    { id: 'verified', label: 'Verified' }
];

export default function MyClaims() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { 
        myClaims, 
        receivedClaims, 
        isClaimLoading,
        fetchMyClaims, 
        fetchReceivedClaims,
        submitVerification,
        verifyClaim,
        rejectClaim,
        proposeMeetup
    } = useLostFoundStore();
    
    const [activeTab, setActiveTab] = useState('made');
    const [showMeetupModal, setShowMeetupModal] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meetupData, setMeetupData] = useState({
        location: '',
        date: '',
        time: '',
        notes: ''
    });

    useEffect(() => {
        fetchMyClaims();
        fetchReceivedClaims();
    }, [fetchMyClaims, fetchReceivedClaims]);

    const handleVerificationSubmit = async (claimId, answers) => {
        setIsSubmitting(true);
        try {
            await submitVerification(claimId, answers);
            toast.success('Verification answers submitted!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit answers');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClaimAction = async (claimId, action) => {
        setIsSubmitting(true);
        try {
            if (action === 'approve') {
                await verifyClaim(claimId);
                toast.success('Claim approved');
            } else {
                await rejectClaim(claimId, 'Rejected by owner');
                toast.success('Claim rejected');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetMeetup = async () => {
        if (!selectedClaim || !meetupData.location || !meetupData.date || !meetupData.time) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await proposeMeetup(selectedClaim._id, meetupData);
            toast.success('Meetup scheduled!');
            setShowMeetupModal(false);
            setSelectedClaim(null);
            setMeetupData({ location: '', date: '', time: '', notes: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to schedule meetup');
        } finally {
            setIsSubmitting(false);
        }
    };

    const claims = activeTab === 'made' ? myClaims : receivedClaims;

    if (isClaimLoading && myClaims.length === 0 && receivedClaims.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/lost-found')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <Button
                    variant={activeTab === 'made' ? 'primary' : 'secondary'}
                    onClick={() => setActiveTab('made')}
                >
                    Claims I Made ({myClaims.length})
                </Button>
                <Button
                    variant={activeTab === 'received' ? 'primary' : 'secondary'}
                    onClick={() => setActiveTab('received')}
                >
                    Claims Received ({receivedClaims.length})
                </Button>
            </div>

            {/* Claims List */}
            {claims.length === 0 ? (
                <Card className="text-center py-12">
                    <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No claims yet</h3>
                    <p className="text-gray-500 mb-4">
                        {activeTab === 'made' 
                            ? "You haven't made any claims yet."
                            : "You haven't received any claims yet."}
                    </p>
                    <Button onClick={() => navigate('/lost-found')}>
                        Browse Lost & Found
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {claims.map(claim => (
                        <ClaimCard
                            key={claim._id}
                            claim={claim}
                            type={activeTab}
                            onAction={handleClaimAction}
                            onVerificationSubmit={handleVerificationSubmit}
                            onSetMeetup={() => {
                                setSelectedClaim(claim);
                                setShowMeetupModal(true);
                            }}
                            isSubmitting={isSubmitting}
                        />
                    ))}
                </div>
            )}

            {/* Meetup Modal */}
            <Modal
                isOpen={showMeetupModal}
                onClose={() => {
                    setShowMeetupModal(false);
                    setSelectedClaim(null);
                }}
                title="Schedule Meetup"
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Location *"
                        value={meetupData.location}
                        onChange={(e) => setMeetupData({ ...meetupData, location: e.target.value })}
                        placeholder="e.g., Main Library Entrance"
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Date *"
                            type="date"
                            value={meetupData.date}
                            onChange={(e) => setMeetupData({ ...meetupData, date: e.target.value })}
                            required
                        />
                        <Input
                            label="Time *"
                            type="time"
                            value={meetupData.time}
                            onChange={(e) => setMeetupData({ ...meetupData, time: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Notes
                        </label>
                        <textarea
                            value={meetupData.notes}
                            onChange={(e) => setMeetupData({ ...meetupData, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., I'll be wearing a red jacket"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button 
                            variant="secondary" 
                            className="flex-1"
                            onClick={() => {
                                setShowMeetupModal(false);
                                setSelectedClaim(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="flex-1" 
                            onClick={handleSetMeetup}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader size="sm" /> : 'Schedule Meetup'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function ClaimCard({ claim, type, onAction, onVerificationSubmit, onSetMeetup, isSubmitting }) {
    const navigate = useNavigate();
    // Verification questions come from the post, not the claim
    const questions = claim.post?.verificationQuestions || [];
    const [verificationAnswers, setVerificationAnswers] = useState(
        questions.map(() => '')
    );
    const [showVerification, setShowVerification] = useState(false);
    const [isSubmittingAnswers, setIsSubmittingAnswers] = useState(false);

    const getProgressStep = (status) => {
        switch (status) {
            case 'PENDING': return 1;
            case 'VERIFICATION': return 2;
            case 'VERIFIED': return 4;
            case 'REJECTED': return -1;
            default: return 0;
        }
    };

    const handleSubmitVerification = async () => {
        setIsSubmittingAnswers(true);
        await onVerificationSubmit(claim._id, verificationAnswers);
        setIsSubmittingAnswers(false);
        setShowVerification(false);
    };

    const StatusIcon = STATUS_CONFIG[claim.status]?.icon || Clock;
    const progressStep = type === 'made' ? getProgressStep(claim.status) : -1;

    return (
        <Card className={claim.status === 'REJECTED' ? 'opacity-60' : ''}>
            <Card.Body>
                {/* Post Preview */}
                <div 
                    className="flex items-start gap-4 mb-4 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                    onClick={() => claim.post?._id && navigate(`/lost-found/${claim.post._id}`)}
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {claim.post?.photo ? (
                            <img
                                src={claim.post.photo}
                                alt={claim.post?.title || 'Item'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Eye size={24} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={claim.post?.type === 'LOST' ? 'danger' : 'success'}>
                                {claim.post?.type || 'ITEM'}
                            </Badge>
                            <span className="font-semibold truncate">{claim.post?.title || 'Unknown Item'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin size={14} />
                            {claim.post?.location || 'Unknown Location'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Avatar 
                                src={type === 'made' ? (claim.post?.user?.avatar || claim.postOwner?.avatar) : claim.claimant?.avatar} 
                                name={type === 'made' ? (claim.post?.user?.fullName || claim.postOwner?.fullName) : claim.claimant?.fullName} 
                                size="sm" 
                            />
                            <span className="text-sm text-gray-500">
                                {type === 'made' ? (claim.post?.user?.fullName || claim.postOwner?.fullName) : claim.claimant?.fullName}
                            </span>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                </div>

                {/* Claim Message */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-600">{claim.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(claim.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Badge variant={STATUS_CONFIG[claim.status]?.color}>
                            <StatusIcon size={14} className="mr-1" />
                            {STATUS_CONFIG[claim.status]?.label}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{STATUS_CONFIG[claim.status]?.description}</p>
                </div>

                {/* Progress Steps (for claims made) */}
                {type === 'made' && claim.status !== 'REJECTED' && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            {PROGRESS_STEPS.map((step, idx) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                        ${progressStep > idx 
                                            ? 'bg-green-500 text-white' 
                                            : progressStep === idx + 1 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-gray-200 text-gray-500'}
                                    `}>
                                        {progressStep > idx ? <Check size={16} /> : idx + 1}
                                    </div>
                                    {idx < PROGRESS_STEPS.length - 1 && (
                                        <div className={`w-12 h-1 mx-1 ${
                                            progressStep > idx + 1 ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-1">
                            {PROGRESS_STEPS.map(step => (
                                <span key={step.id} className="text-xs text-gray-500 w-16 text-center">
                                    {step.label}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Verification Questions (for claims made) */}
                {type === 'made' && claim.status === 'VERIFICATION' && questions.length > 0 && (
                    <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield size={18} className="text-blue-600" />
                            <span className="font-medium text-blue-900">Answer Verification Questions</span>
                        </div>
                        
                        {showVerification ? (
                            <div className="space-y-3">
                                {questions.map((q, idx) => (
                                    <div key={idx}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {q.question}
                                        </label>
                                        <input
                                            type="text"
                                            value={verificationAnswers[idx] || ''}
                                            onChange={(e) => {
                                                const newAnswers = [...verificationAnswers];
                                                newAnswers[idx] = e.target.value;
                                                setVerificationAnswers(newAnswers);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Your answer..."
                                            disabled={isSubmittingAnswers}
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-2 pt-2">
                                    <Button 
                                        size="sm" 
                                        variant="secondary"
                                        onClick={() => setShowVerification(false)}
                                        disabled={isSubmittingAnswers}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        size="sm"
                                        onClick={handleSubmitVerification}
                                        disabled={isSubmittingAnswers}
                                    >
                                        {isSubmittingAnswers ? <Loader size="sm" /> : (
                                            <>
                                                <Send size={14} />
                                                Submit Answers
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button size="sm" onClick={() => setShowVerification(true)}>
                                Answer Questions
                            </Button>
                        )}
                    </div>
                )}

                {/* Meetup Details */}
                {claim.meetupDetails && claim.meetupDetails.status !== 'NOT_SET' && (
                    <div className="border border-green-100 bg-green-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar size={18} className="text-green-600" />
                            <span className="font-medium text-green-900">Meetup {claim.meetupDetails.status === 'PROPOSED' ? 'Proposed' : 'Scheduled'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500">Location:</span> {claim.meetupDetails.agreedLocation || claim.meetupDetails.proposedLocation}
                            </div>
                            {(claim.meetupDetails.agreedTime || claim.meetupDetails.proposedTime) && (
                                <div>
                                    <span className="text-gray-500">Date:</span> {format(new Date(claim.meetupDetails.agreedTime || claim.meetupDetails.proposedTime), 'MMM d, yyyy h:mm a')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {type === 'made' && claim.status === 'VERIFIED' && (
                        <>
                            <Button 
                                size="sm" 
                                variant="primary" 
                                className="flex-1"
                                onClick={() => navigate(`/lost-found/chat/${claim._id}`)}
                            >
                                <MessageSquare size={14} />
                                Chat
                            </Button>
                            {(!claim.meetupDetails || claim.meetupDetails.status === 'NOT_SET') && (
                                <Button size="sm" variant="secondary" onClick={onSetMeetup}>
                                    <Calendar size={14} />
                                    Schedule Meetup
                                </Button>
                            )}
                        </>
                    )}

                    {type === 'received' && claim.status === 'PENDING' && (
                        <>
                            <Button 
                                size="sm" 
                                variant="success" 
                                className="flex-1"
                                onClick={() => onAction(claim._id, 'approve')}
                                disabled={isSubmitting}
                            >
                                <Check size={14} />
                                Approve
                            </Button>
                            <Button 
                                size="sm" 
                                variant="danger"
                                onClick={() => onAction(claim._id, 'reject')}
                                disabled={isSubmitting}
                            >
                                <X size={14} />
                                Reject
                            </Button>
                        </>
                    )}

                    {type === 'received' && claim.status === 'VERIFIED' && (
                        <Button 
                            size="sm" 
                            variant="primary" 
                            className="flex-1"
                            onClick={() => navigate(`/lost-found/chat/${claim._id}`)}
                        >
                            <MessageSquare size={14} />
                            Chat with Claimant
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}
