export default function Card({ children, className = '', onClick, hover = false }) {
    return (
        <div 
            className={`
                bg-white rounded-xl shadow-sm border border-gray-100
                ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
                ${className}
            `}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

Card.Header = function CardHeader({ children, className = '' }) {
    return <div className={`p-4 border-b border-gray-100 ${className}`}>{children}</div>;
};

Card.Body = function CardBody({ children, className = '' }) {
    return <div className={`p-4 ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
    return <div className={`p-4 border-t border-gray-100 ${className}`}>{children}</div>;
};
