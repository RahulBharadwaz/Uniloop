import React from 'react';

export default function UniLoopLogo({
    variant = 'horizontal', // 'horizontal' | 'vertical' | 'icon' | 'text'
    size = 'md',            // 'sm' | 'md' | 'lg' | 'xl'
    showSlogan = false,
    className = '',
    dark = false,
}) {
    // Sizing maps
    const iconSizeMap = {
        sm: 'w-7 h-5',
        md: 'w-9 h-6',
        lg: 'w-14 h-9',
        xl: 'w-20 h-14',
    };

    const textSizeMap = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-4xl',
        xl: 'text-5xl',
    };

    const sloganSizeMap = {
        sm: 'text-[9px] tracking-[0.2em]',
        md: 'text-[10px] tracking-[0.25em]',
        lg: 'text-xs tracking-[0.3em]',
        xl: 'text-sm tracking-[0.35em]',
    };

    // Vector Infinity Ribbon
    const IconSvg = (
        <svg
            viewBox="0 22 100 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${iconSizeMap[size]} transition-transform duration-200 group-hover:scale-105 flex-shrink-0`}
        >
            <defs>
                <linearGradient id="uniloop-dynamic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#181B80" />
                    <stop offset="100%" stopColor="#181ED9" />
                </linearGradient>
            </defs>
            <path
                d="M99.7 50c0 3.1-.6 6.1-1.7 8.9-1.2 2.9-2.9 5.6-5.2 7.8-2.3 2.3-4.9 4-7.8 5.2-2.8 1.2-5.8 1.7-8.9 1.7s-6.1-.6-8.9-1.7c-2.9-1.2-5.6-2.9-7.8-5.2L42.5 50l-9.2-9.2C30.8 38.3 27.5 37 24 37s-6.8 1.4-9.2 3.8C12.3 43.2 11 46.5 11 50s1.4 6.8 3.8 9.2c2.5 2.5 5.7 3.8 9.2 3.8s6.8-1.4 9.2-3.8l1.6-1.6 7.5 7.5-1.6 1.6c-2.3 2.3-4.9 4-7.8 5.2-2.8 1.2-5.8 1.7-8.9 1.7s-6.1-.6-8.9-1.7c-2.9-1.2-5.6-2.9-7.8-5.2-2.3-2.3-4-4.9-5.2-7.8C.9 56.1.4 53.1.4 50s.6-6.1 1.7-8.9c1.2-2.9 2.9-5.6 5.2-7.8 2.3-2.3 4.9-4 7.8-5.2 2.8-1.2 5.8-1.7 8.9-1.7s6.1.6 8.9 1.7c2.9 1.2 5.6 2.9 7.8 5.2L63 55.5l3.7 3.7c2.5 2.5 5.7 3.8 9.2 3.8s6.8-1.4 9.2-3.8c2.5-2.5 3.8-5.7 3.8-9.2s-1.4-6.8-3.8-9.2C82.7 38.3 79.5 37 76 37s-6.8 1.4-9.2 3.8l-1.9 1.9-7.5-7.5 1.9-1.9c2.3-2.3 4.9-4 7.8-5.2 2.8-1.2 5.8-1.7 8.9-1.7s6.1.6 8.9 1.7c2.9 1.2 5.6 2.9 7.8 5.2 2.3 2.3 4 4.9 5.2 7.8 1.2 2.8 1.8 5.8 1.8 8.9"
                fill="url(#uniloop-dynamic-grad)"
            />
        </svg>
    );

    if (variant === 'icon') {
        return <div className={`inline-flex items-center justify-center ${className}`}>{IconSvg}</div>;
    }

    const brandTextColor = dark ? 'text-white' : 'text-[#090A35]';
    const sloganTextColor = dark ? 'text-gray-300' : 'text-[#1D1E49]/80';

    if (variant === 'text') {
        return (
            <div className={`inline-flex flex-col ${className}`}>
                <span className={`font-black ${textSizeMap[size]} ${brandTextColor} tracking-tight font-['Montserrat',sans-serif]`}>
                    UniLoop
                </span>
                {showSlogan && (
                    <span className={`font-medium ${sloganSizeMap[size]} ${sloganTextColor} uppercase font-['Fanwood_Text',serif]`}>
                        Loop More. Spend Less.
                    </span>
                )}
            </div>
        );
    }

    if (variant === 'vertical') {
        return (
            <div className={`inline-flex flex-col items-center text-center gap-2 group ${className}`}>
                {IconSvg}
                <div className="flex flex-col items-center">
                    <span className={`font-black ${textSizeMap[size]} ${brandTextColor} tracking-tight font-['Montserrat',sans-serif]`}>
                        UniLoop
                    </span>
                    {showSlogan && (
                        <span className={`font-medium ${sloganSizeMap[size]} ${sloganTextColor} uppercase font-['Fanwood_Text',serif] mt-1`}>
                            Loop More. Spend Less.
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Default 'horizontal'
    return (
        <div className={`inline-flex items-center gap-2.5 group ${className}`}>
            {IconSvg}
            <div className="flex flex-col leading-none">
                <span className={`font-black ${textSizeMap[size]} ${brandTextColor} tracking-tight font-['Montserrat',sans-serif]`}>
                    UniLoop
                </span>
                {showSlogan && (
                    <span className={`font-medium ${sloganSizeMap[size]} ${sloganTextColor} uppercase font-['Fanwood_Text',serif] mt-0.5`}>
                        Loop More. Spend Less.
                    </span>
                )}
            </div>
        </div>
    );
}
