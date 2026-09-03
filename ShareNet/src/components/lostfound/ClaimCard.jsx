import { format } from 'date-fns';
import { 
    MessageSquare, 
    CheckCircle, 
    XCircle, 
    MapPin, 
    Clock,
    User,
    ShieldCheck,
    Calendar
} from 'lucide-react';
import { Card, Badge, Avatar, Button } from '../ui';

const statusConfig = {
    SUBMITTED: { color: 'gray', label: 'Submitted', icon: Clock },
    VERIFICATION_PENDING: { color: 'warning', label: 'Verification Pending', icon: ShieldCheck },
    VERIFIED: { color: 'success', label: 'Verified', icon: CheckCircle },
    REJECTED: { color: 'danger', label: 'Rejected', icon: XCircle },
    MEETUP_PROPOSED: { color: 'primary', label: 'Meetup Proposed', icon: MapPin },
    MEETUP_ACCEPTED: { color: 'success', label: 'Meetup Scheduled', icon: Calendar },
    RESOLVED: { color: 'success', label: 'Resolved', icon: CheckCircle }
};

const progressSteps = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'VERIFICATION_PENDING', label: 'Verification' },
    { key: 'VERIFIED', label: 'Verified' },
    { key: 'MEETUP_PROPOSED', label: 'Meetup' },
    { key: 'RESOLVED', label: 'Resolved' }
];

function getStepIndex(status) {
    const stepMap = {
        SUBMITTED: 0,
        VERIFICATION_PENDING: 1,
        VERIFIED: 2,
        MEETUP_PROPOSED: 3,
        MEETUP_ACCEPTED: 3,
        RESOLVED: 4,
        REJECTED: -1
    };
    return stepMap[status] ?? 0;
}

export default function ClaimCard({ 
    claim, 
    onVerify, 
    onReject, 
    onChat, 
    onProposeMeetup, 
    isOwner 
}) {
    const config = statusConfig[claim.status] || statusConfig.SUBMITTED;
    const StatusIcon = config.icon;
    const currentStep = getStepIndex(claim.status);
    const isRejected = claim.status === 'REJECTED';

    return (
        <Card className="overflow-hidden">
            <Card.Body>
                <div className="flex items-start gap-3">
                    <Avatar 
                        src={claim.claimant?.avatar} 
                        name={claim.claimant?.fullName} 
                        size="md" 
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-gray-400" />
                                <span className="font-medium text-gray-900">
                                    {claim.claimant?.fullName}
                                </span>
                            </div>
                            <Badge variant={config.color}>
                                <StatusIcon size={12} className="mr-1" />
                                {config.label}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(claim.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                    </div>
                </div>

                <p className="mt-3 text-gray-700 line-clamp-3">{claim.message}</p>

                {!isRejected && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            {progressSteps.map((step, index) => (
                                <div key={step.key} className="flex flex-col items-center flex-1">
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                                        ${index <= currentStep 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-200 text-gray-500'}
                                    `}>
                                        {index < currentStep ? (
                                            <CheckCircle size={14} />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <span className={`
                                        text-xs mt-1 text-center
                                        ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'}
                                    `}>
                                        {step.label}
                                    </span>
                                    {index < progressSteps.length - 1 && (
                                        <div className={`
                                            absolute h-0.5 w-full top-3 left-1/2
                                            ${index < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                                        `} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {claim.meetup && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700">
                            <MapPin size={16} />
                            <span className="font-medium">Meetup Details</span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">{claim.meetup.location}</p>
                        <p className="text-sm text-blue-600">
                            {format(new Date(claim.meetup.dateTime), 'MMM d, yyyy h:mm a')}
                        </p>
                        {claim.meetup.instructions && (
                            <p className="text-sm text-blue-500 mt-1">{claim.meetup.instructions}</p>
                        )}
                    </div>
                )}
            </Card.Body>

            <Card.Footer className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => onChat?.(claim)}>
                    <MessageSquare size={16} />
                    Chat
                </Button>

                {isOwner && claim.status === 'SUBMITTED' && (
                    <Button variant="primary" size="sm" onClick={() => onVerify?.(claim)}>
                        <ShieldCheck size={16} />
                        Start Verification
                    </Button>
                )}

                {isOwner && claim.status === 'VERIFIED' && (
                    <Button variant="success" size="sm" onClick={() => onProposeMeetup?.(claim)}>
                        <MapPin size={16} />
                        Propose Meetup
                    </Button>
                )}

                {isOwner && !['RESOLVED', 'REJECTED'].includes(claim.status) && (
                    <Button variant="danger" size="sm" onClick={() => onReject?.(claim)}>
                        <XCircle size={16} />
                        Reject
                    </Button>
                )}
            </Card.Footer>
        </Card>
    );
}
