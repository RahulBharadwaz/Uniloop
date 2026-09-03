export default function TrustScore({ score, size = 'md' }) {
    const resolvedScore = typeof score === 'number' ? score : 50;

    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-base'
    };

    const getColor = (s) => {
        if (s >= 80) return 'text-green-600 border-green-500 bg-green-50';
        if (s >= 60) return 'text-blue-600 border-blue-500 bg-blue-50';
        if (s >= 40) return 'text-yellow-600 border-yellow-500 bg-yellow-50';
        return 'text-red-600 border-red-500 bg-red-50';
    };

    return (
        <div className="flex flex-col items-center">
            <div 
                className={`
                    ${sizes[size]} 
                    ${getColor(resolvedScore)}
                    rounded-full border-2 flex items-center justify-center font-bold
                `}
                title={`Trust Score: ${resolvedScore}/100 — Based on successful transactions. Higher is more reliable.`}
            >
                {resolvedScore}
            </div>
            <span className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-0.5`}>
                Trust
            </span>
        </div>
    );
}
