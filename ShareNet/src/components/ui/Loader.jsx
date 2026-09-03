export default function Loader({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader size="lg" />
        </div>
    );
}
