import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`
                    w-full px-4 py-2 border rounded-lg transition-colors bg-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${error ? 'border-red-500' : 'border-gray-300'}
                    ${className}
                `}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
    );
});

Select.displayName = 'Select';
export default Select;
