import { useState } from 'react';
import { MapPin, Calendar, FileText, CheckCircle } from 'lucide-react';
import { Card, Input, Button } from '../ui';

export default function MeetupProposal({ claim, onPropose, onAccept, isProposer }) {
    const [formData, setFormData] = useState({
        location: claim?.meetup?.location || '',
        dateTime: claim?.meetup?.dateTime 
            ? new Date(claim.meetup.dateTime).toISOString().slice(0, 16) 
            : '',
        instructions: claim?.meetup?.instructions || ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const hasMeetup = claim?.meetup?.location && claim?.meetup?.dateTime;
    const isPending = claim?.status === 'MEETUP_PROPOSED';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onPropose({
                location: formData.location,
                dateTime: new Date(formData.dateTime).toISOString(),
                instructions: formData.instructions
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async () => {
        setIsLoading(true);
        try {
            await onAccept();
        } finally {
            setIsLoading(false);
        }
    };

    if (hasMeetup && !isProposer) {
        return (
            <Card>
                <Card.Header>
                    <div className="flex items-center gap-2">
                        <MapPin className="text-blue-600" size={20} />
                        <h3 className="font-semibold">Meetup Proposal</h3>
                    </div>
                </Card.Header>
                <Card.Body className="space-y-3">
                    <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">{claim.meetup.location}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Date & Time</p>
                            <p className="font-medium">
                                {new Date(claim.meetup.dateTime).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    {claim.meetup.instructions && (
                        <div className="flex items-start gap-3">
                            <FileText size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Instructions</p>
                                <p className="font-medium">{claim.meetup.instructions}</p>
                            </div>
                        </div>
                    )}

                    {isPending && (
                        <Button 
                            variant="success" 
                            className="w-full mt-4" 
                            onClick={handleAccept}
                            loading={isLoading}
                        >
                            <CheckCircle size={18} />
                            Accept Meetup
                        </Button>
                    )}
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card>
            <Card.Header>
                <div className="flex items-center gap-2">
                    <MapPin className="text-blue-600" size={20} />
                    <h3 className="font-semibold">
                        {hasMeetup ? 'Update Meetup' : 'Propose Meetup'}
                    </h3>
                </div>
            </Card.Header>
            <Card.Body>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Meeting Location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Coffee shop at Main Street"
                        required
                    />

                    <Input
                        label="Date & Time"
                        name="dateTime"
                        type="datetime-local"
                        value={formData.dateTime}
                        onChange={handleChange}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions (optional)
                        </label>
                        <textarea
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Any specific instructions for the meetup..."
                        />
                    </div>

                    <Button type="submit" loading={isLoading} className="w-full">
                        {hasMeetup ? 'Update Proposal' : 'Propose Meetup'}
                    </Button>
                </form>
            </Card.Body>
        </Card>
    );
}
