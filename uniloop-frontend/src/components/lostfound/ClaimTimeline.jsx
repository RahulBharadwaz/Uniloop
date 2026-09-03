import { format } from 'date-fns';
import { 
    FileText, 
    ShieldCheck, 
    CheckCircle, 
    XCircle, 
    MapPin, 
    Calendar,
    MessageSquare,
    User,
    Clock
} from 'lucide-react';

const actionIcons = {
    CLAIM_SUBMITTED: FileText,
    VERIFICATION_STARTED: ShieldCheck,
    VERIFICATION_SUBMITTED: ShieldCheck,
    CLAIM_VERIFIED: CheckCircle,
    CLAIM_REJECTED: XCircle,
    MEETUP_PROPOSED: MapPin,
    MEETUP_ACCEPTED: Calendar,
    POST_RESOLVED: CheckCircle,
    MESSAGE_SENT: MessageSquare
};

const actionColors = {
    CLAIM_SUBMITTED: 'bg-gray-500',
    VERIFICATION_STARTED: 'bg-yellow-500',
    VERIFICATION_SUBMITTED: 'bg-yellow-500',
    CLAIM_VERIFIED: 'bg-green-500',
    CLAIM_REJECTED: 'bg-red-500',
    MEETUP_PROPOSED: 'bg-blue-500',
    MEETUP_ACCEPTED: 'bg-blue-600',
    POST_RESOLVED: 'bg-green-600',
    MESSAGE_SENT: 'bg-gray-400'
};

const actionLabels = {
    CLAIM_SUBMITTED: 'Claim Submitted',
    VERIFICATION_STARTED: 'Verification Started',
    VERIFICATION_SUBMITTED: 'Verification Answers Submitted',
    CLAIM_VERIFIED: 'Claim Verified',
    CLAIM_REJECTED: 'Claim Rejected',
    MEETUP_PROPOSED: 'Meetup Proposed',
    MEETUP_ACCEPTED: 'Meetup Accepted',
    POST_RESOLVED: 'Item Returned',
    MESSAGE_SENT: 'Message Sent'
};

export default function ClaimTimeline({ timeline }) {
    if (!timeline || timeline.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p>No activity yet</p>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-6">
                {timeline.map((item, index) => {
                    const Icon = actionIcons[item.action] || Clock;
                    const color = actionColors[item.action] || 'bg-gray-400';
                    const label = actionLabels[item.action] || item.action;

                    return (
                        <div key={index} className="relative flex gap-4 pl-10">
                            <div className={`
                                absolute left-2 w-5 h-5 rounded-full ${color}
                                flex items-center justify-center
                            `}>
                                <Icon size={12} className="text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                        {label}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                </div>

                                {item.user && (
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                        <User size={14} />
                                        <span>{item.user.fullName || item.user}</span>
                                    </div>
                                )}

                                {item.details && (
                                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                                        {item.details}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
