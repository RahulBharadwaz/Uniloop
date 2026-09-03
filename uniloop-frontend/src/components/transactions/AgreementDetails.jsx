import { format } from 'date-fns';
import { Card, Button, Badge } from '../ui';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function AgreementDetails({ transaction, isOwner, onConfirm, isLoading }) {
    const canConfirm = !isOwner && transaction.status === 'AGREEMENT_PROPOSED';
    const status = transaction.status;

    let helperText = null;
    let helperIcon = null;
    let helperColor = '';

    if (status === 'AGREEMENT_PROPOSED') {
        if (isOwner) {
            helperText = 'Waiting for the requester to review and confirm these terms.';
            helperIcon = <Clock size={16} className="text-amber-500 flex-shrink-0" />;
            helperColor = 'bg-amber-50 border-amber-200 text-amber-700';
        } else {
            helperText = 'Please review the terms below and confirm to proceed.';
            helperIcon = <Clock size={16} className="text-blue-500 flex-shrink-0" />;
            helperColor = 'bg-blue-50 border-blue-200 text-blue-700';
        }
    } else if (status === 'ACTIVE') {
        helperText = 'Agreement confirmed. Transaction is active.';
        helperIcon = <CheckCircle size={16} className="text-green-500 flex-shrink-0" />;
        helperColor = 'bg-green-50 border-green-200 text-green-700';
    } else if (status === 'RETURN_PENDING') {
        helperText = isOwner
            ? 'Item marked as returned. Please confirm the return.'
            : 'Return marked. Waiting for owner to confirm.';
        helperIcon = <Clock size={16} className="text-amber-500 flex-shrink-0" />;
        helperColor = 'bg-amber-50 border-amber-200 text-amber-700';
    } else if (status === 'COMPLETED') {
        helperText = 'Transaction completed successfully.';
        helperIcon = <CheckCircle size={16} className="text-green-500 flex-shrink-0" />;
        helperColor = 'bg-green-50 border-green-200 text-green-700';
    } else if (status === 'DISPUTED') {
        helperText = 'This transaction is currently disputed.';
        helperIcon = <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />;
        helperColor = 'bg-red-50 border-red-200 text-red-700';
    }

    return (
        <Card>
            <Card.Header>
                <h3 className="font-semibold">Agreement Details</h3>
            </Card.Header>
            <Card.Body className="space-y-4">
                {helperText && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${helperColor}`}>
                        {helperIcon}
                        <span>{helperText}</span>
                    </div>
                )}

                {transaction.agreedPrice > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Agreed Price</span>
                        <span className="font-bold text-lg">${transaction.agreedPrice}</span>
                    </div>
                )}

                {transaction.mode === 'GIVE' && (
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Price</span>
                        <span className="font-bold text-lg text-green-600">Free</span>
                    </div>
                )}

                {transaction.agreedDuration && (
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium">{transaction.agreedDuration} days</span>
                    </div>
                )}

                {transaction.startDate && (
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Start Date</span>
                        <span className="font-medium">
                            {format(new Date(transaction.startDate), 'MMMM d, yyyy')}
                        </span>
                    </div>
                )}

                {transaction.endDate && (
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">End Date</span>
                        <span className="font-medium">
                            {format(new Date(transaction.endDate), 'MMMM d, yyyy')}
                        </span>
                    </div>
                )}

                {transaction.terms && (
                    <div>
                        <span className="text-gray-600 text-sm">Terms</span>
                        <p className="mt-1 text-gray-800">{transaction.terms}</p>
                    </div>
                )}

                {canConfirm && (
                    <Button 
                        onClick={onConfirm} 
                        loading={isLoading}
                        className="w-full"
                        variant="success"
                    >
                        Confirm Agreement
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
}
