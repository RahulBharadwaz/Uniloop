import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, Button, Badge, Avatar, TrustScore, Modal, Loader } from '../components/ui';
import { TransactionStatus, AgreementForm, AgreementDetails } from '../components/transactions';
import { ChatBox } from '../components/chat';
import useTransactionStore from '../stores/transactionStore';
import useAuthStore from '../stores/authStore';

const statusColors = {
    PENDING: 'gray',
    ACCEPTED: 'primary',
    AGREEMENT_PROPOSED: 'warning',
    ACTIVE: 'success',
    RETURN_PENDING: 'warning',
    COMPLETED: 'success',
    DISPUTED: 'danger',
    CANCELLED: 'gray'
};

export default function TransactionDetail() {
    const { id } = useParams();
    const { currentTransaction, isLoading, fetchTransaction, proposeAgreement, confirmAgreement, markReturnPending, confirmReturn, raiseDispute } = useTransactionStore();
    const { user } = useAuthStore();
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchTransaction(id);
    }, [id]);

    const isOwner = user?._id === currentTransaction?.owner?._id;
    const otherParty = isOwner ? currentTransaction?.requester : currentTransaction?.owner;
    const canChat = ['ACCEPTED', 'AGREEMENT_PROPOSED', 'ACTIVE', 'RETURN_PENDING', 'DISPUTED'].includes(currentTransaction?.status);
    const hasAgreement = currentTransaction?.status && ['AGREEMENT_PROPOSED', 'ACTIVE', 'RETURN_PENDING', 'COMPLETED', 'DISPUTED'].includes(currentTransaction.status);

    const handleProposeAgreement = async (data) => {
        setActionLoading(true);
        try {
            await proposeAgreement(id, data);
            setShowAgreementModal(false);
            toast.success('Agreement proposed!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to propose agreement');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmAgreement = async () => {
        setActionLoading(true);
        try {
            await confirmAgreement(id);
            toast.success('Agreement confirmed! Transaction is now active.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to confirm agreement');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkReturned = async () => {
        setActionLoading(true);
        try {
            await markReturnPending(id);
            toast.success('Marked as returned. Waiting for owner confirmation.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark as returned');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmReturn = async () => {
        setActionLoading(true);
        try {
            await confirmReturn(id);
            toast.success('Return confirmed! Transaction completed.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to confirm return');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDispute = async () => {
        if (!disputeReason.trim()) {
            toast.error('Please provide a reason for the dispute');
            return;
        }
        setActionLoading(true);
        try {
            await raiseDispute(id, disputeReason);
            setShowDisputeModal(false);
            toast.success('Dispute raised');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to raise dispute');
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading || !currentTransaction) {
        return (
            <div className="flex justify-center py-12">
                <Loader size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Status Progress */}
            <Card>
                <Card.Body>
                    <TransactionStatus status={currentTransaction.status} />
                </Card.Body>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Item & Parties */}
                <div className="space-y-6">
                    {/* Item Card */}
                    <Card>
                        <Card.Header>
                            <h3 className="font-semibold">Item Details</h3>
                        </Card.Header>
                        <Card.Body className="flex gap-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {currentTransaction.item?.photos?.[0] ? (
                                    <img
                                        src={currentTransaction.item.photos[0]}
                                        alt={currentTransaction.item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No image
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold">{currentTransaction.item?.title}</h4>
                                <Badge variant={currentTransaction.item?.mode === 'RENT' ? 'primary' : 'success'}>
                                    {currentTransaction.item?.mode}
                                </Badge>
                                {currentTransaction.item?.price > 0 && (
                                    <p className="text-blue-600 font-medium mt-1">
                                        ${currentTransaction.item.price}
                                        {currentTransaction.item.mode === 'RENT' && '/day'}
                                    </p>
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Other Party */}
                    <Card>
                        <Card.Header>
                            <h3 className="font-semibold">{isOwner ? 'Requester' : 'Owner'}</h3>
                        </Card.Header>
                        <Card.Body className="flex items-center gap-4">
                            <Avatar src={otherParty?.avatar} name={otherParty?.fullName} size="lg" />
                            <div className="flex-1">
                                <h4 className="font-semibold">{otherParty?.fullName}</h4>
                                <p className="text-gray-500 text-sm">@{otherParty?.username}</p>
                            </div>
                            <TrustScore score={otherParty?.trustScore} />
                        </Card.Body>
                    </Card>

                    {/* Agreement */}
                    {hasAgreement ? (
                        <AgreementDetails
                            transaction={currentTransaction}
                            isOwner={isOwner}
                            onConfirm={handleConfirmAgreement}
                            isLoading={actionLoading}
                        />
                    ) : (
                        isOwner && currentTransaction.status === 'ACCEPTED' && (
                            <Card>
                                <Card.Body className="text-center py-6">
                                    <p className="text-gray-500 mb-4">Propose terms for this transaction</p>
                                    <Button onClick={() => setShowAgreementModal(true)}>
                                        Propose Agreement
                                    </Button>
                                </Card.Body>
                            </Card>
                        )
                    )}

                    {/* Actions */}
                    {(() => {
                        const mode = currentTransaction.item?.mode;
                        const status = currentTransaction.status;
                        const showMarkReturned = !isOwner && status === 'ACTIVE' && mode === 'RENT';
                        const showConfirmReturn = isOwner && status === 'RETURN_PENDING' && mode === 'RENT';
                        const showDispute = ['ACTIVE', 'RETURN_PENDING'].includes(status);
                        const hasActions = showMarkReturned || showConfirmReturn || showDispute;

                        if (!hasActions) return null;

                        return (
                            <Card>
                                <Card.Body className="space-y-2">
                                    {showMarkReturned && (
                                        <Button 
                                            onClick={handleMarkReturned} 
                                            loading={actionLoading}
                                            className="w-full"
                                        >
                                            Mark as Returned
                                        </Button>
                                    )}
                                    {showConfirmReturn && (
                                        <Button 
                                            onClick={handleConfirmReturn} 
                                            loading={actionLoading}
                                            variant="success"
                                            className="w-full"
                                        >
                                            Confirm Return
                                        </Button>
                                    )}
                                    {showDispute && (
                                        <Button 
                                            variant="danger"
                                            onClick={() => setShowDisputeModal(true)}
                                            className="w-full"
                                        >
                                            Raise Dispute
                                        </Button>
                                    )}
                                </Card.Body>
                            </Card>
                        );
                    })()}
                </div>

                {/* Chat */}
                <div>
                    <Card>
                        <Card.Header>
                            <h3 className="font-semibold">Chat</h3>
                        </Card.Header>
                        {canChat ? (
                            <ChatBox transactionId={id} />
                        ) : (
                            <Card.Body className="text-center py-8 text-gray-500">
                                Chat is available after the request is accepted
                            </Card.Body>
                        )}
                    </Card>
                </div>
            </div>

            {/* Agreement Modal */}
            <Modal
                isOpen={showAgreementModal}
                onClose={() => setShowAgreementModal(false)}
                title="Propose Agreement"
            >
                <AgreementForm
                    item={currentTransaction.item}
                    onSubmit={handleProposeAgreement}
                    isLoading={actionLoading}
                />
            </Modal>

            {/* Dispute Modal */}
            <Modal
                isOpen={showDisputeModal}
                onClose={() => setShowDisputeModal(false)}
                title="Raise Dispute"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Please explain the issue with this transaction. This will be reviewed by administrators.
                    </p>
                    <textarea
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe the issue..."
                    />
                    <div className="flex gap-4">
                        <Button 
                            variant="danger"
                            onClick={handleDispute}
                            loading={actionLoading}
                            className="flex-1"
                        >
                            Submit Dispute
                        </Button>
                        <Button 
                            variant="secondary"
                            onClick={() => setShowDisputeModal(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
