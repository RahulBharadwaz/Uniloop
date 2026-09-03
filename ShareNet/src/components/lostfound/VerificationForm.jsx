import { useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { Button, Input } from '../ui';

export default function VerificationForm({ questions, onSubmit, isLoading }) {
    const [answers, setAnswers] = useState(
        questions?.reduce((acc, q, index) => ({ ...acc, [index]: '' }), {}) || {}
    );

    const handleChange = (index, value) => {
        setAnswers(prev => ({ ...prev, [index]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formattedAnswers = questions.map((q, index) => ({
            question: q.question,
            answer: answers[index]
        }));
        onSubmit(formattedAnswers);
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg text-yellow-700">
                <AlertCircle size={20} />
                <span>No verification questions set by the owner.</span>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700">
                <ShieldCheck size={20} />
                <span className="text-sm">Answer these questions to verify your claim</span>
            </div>

            {questions.map((q, index) => (
                <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {index + 1}. {q.question}
                    </label>
                    <Input
                        value={answers[index]}
                        onChange={(e) => handleChange(index, e.target.value)}
                        placeholder="Your answer..."
                        required
                    />
                </div>
            ))}

            <Button type="submit" loading={isLoading} className="w-full">
                Submit Answers
            </Button>
        </form>
    );
}
