import { useState } from 'react';
import { Button, Modal } from '../ui';
import { Gift, Users, Check } from 'lucide-react';

export default function InstantClaimButton({ item, onClaim, isLoading, userClaim }) {
    const [showConfirm, setShowConfirm] = useState(false);
    
    const claimedCount = item.claimedCount || 0;
    const maxClaimers = item.maxClaimers || 1;
    const availableSlots = maxClaimers - claimedCount;
    const isFullyClaimed = availableSlots <= 0;

    const handleConfirmClaim = async () => {
        await onClaim();
        setShowConfirm(false);
    };

    if (userClaim) {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="text-green-600" size={20} />
                    <div>
                        <p className="font-medium text-green-800">You've claimed this item!</p>
                        <p className="text-sm text-green-600">
                            Queue position: #{userClaim.queuePosition || 1}
                        </p>
                    </div>
                </div>
                {userClaim.status === 'PENDING' && (
                    <p className="text-sm text-gray-500">
                        Waiting for owner confirmation...
                    </p>
                )}
            </div>
        );
    }

    if (isFullyClaimed) {
        return (
            <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
                <Users className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="font-medium text-gray-600">Fully Claimed</p>
                <p className="text-sm text-gray-500">All {maxClaimers} slots have been taken</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => setShowConfirm(true)}
                    disabled={isLoading}
                >
                    <Gift size={20} />
                    {availableSlots === maxClaimers ? 'Claim Now - Free!' : 'Join Queue'}
                </Button>
                <p className="text-sm text-gray-500 text-center">
                    <Users size={14} className="inline mr-1" />
                    {claimedCount}/{maxClaimers} claimed
                </p>
            </div>

            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                title="Confirm Claim"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        You're about to claim "{item.title}" for free. 
                        {claimedCount > 0 && ` You'll be #${claimedCount + 1} in the queue.`}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                            By claiming, you commit to picking up this item at the agreed location and time.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            onClick={handleConfirmClaim} 
                            loading={isLoading}
                            className="flex-1"
                        >
                            Confirm Claim
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowConfirm(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
