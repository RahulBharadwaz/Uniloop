import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={`
                    w-full px-4 py-2 border rounded-lg transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${error ? 'border-red-500' : 'border-gray-300'}
                    ${className}
                `}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';
export default Input;
