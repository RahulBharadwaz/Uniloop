import { Check, Clock, AlertTriangle, XCircle } from 'lucide-react';

const steps = [
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'AGREEMENT_PROPOSED', label: 'Agreement' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'RETURN_PENDING', label: 'Return' },
    { key: 'COMPLETED', label: 'Completed' }
];

const getStepIndex = (status) => {
    if (status === 'DISPUTED') return -1;
    if (status === 'CANCELLED') return -1;
    return steps.findIndex(s => s.key === status);
};

export default function TransactionStatus({ status }) {
    const currentIndex = getStepIndex(status);

    if (status === 'DISPUTED') {
        return (
            <div className="flex items-center justify-center gap-2 p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="text-red-500" size={24} />
                <span className="font-medium text-red-700">Transaction Disputed</span>
            </div>
        );
    }

    if (status === 'CANCELLED') {
        return (
            <div className="flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-lg">
                <XCircle className="text-gray-500" size={24} />
                <span className="font-medium text-gray-700">Transaction Cancelled</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="flex justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                ${isCompleted ? 'bg-green-500 text-white' : 
                                  isCurrent ? 'bg-blue-500 text-white' : 
                                  'bg-gray-200 text-gray-400'}
                            `}>
                                {isCompleted ? <Check size={16} /> : 
                                 isCurrent ? <Clock size={16} /> : 
                                 index + 1}
                            </div>
                            <span className={`
                                text-xs mt-2 text-center
                                ${isCurrent ? 'font-medium text-blue-600' : 'text-gray-500'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
            <div 
                className="absolute top-4 left-0 h-0.5 bg-green-500 -z-10 transition-all"
                style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
            />
        </div>
    );
}
