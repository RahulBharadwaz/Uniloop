import { Input, Select, Button } from '../ui';

const categories = [
    { value: 'Electronics', label: 'Electronics' },
    { value: 'Books', label: 'Books' },
    { value: 'Furniture', label: 'Furniture' },
    { value: 'Clothing', label: 'Clothing' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Kitchen', label: 'Kitchen' },
    { value: 'Other', label: 'Other' },
];

const modes = [
    { value: 'RENT', label: 'For Rent' },
    { value: 'SELL', label: 'For Sale' },
    { value: 'GIVE', label: 'Free / Give Away' },
];

export default function ItemFilters({ filters, onChange, onReset }) {
    const handleChange = (key, value) => {
        onChange({ [key]: value });
    };

    const showPrice = filters.mode !== 'GIVE';
    const gridCols = showPrice ? 'md:grid-cols-5' : 'md:grid-cols-4';

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
            <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
                <Input
                    placeholder="Search items..."
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                />
                <Select
                    placeholder="All Categories"
                    options={categories}
                    value={filters.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                />
                <Select
                    placeholder="All Modes"
                    options={modes}
                    value={filters.mode}
                    onChange={(e) => handleChange('mode', e.target.value)}
                />
                {showPrice && (
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Min $"
                            value={filters.priceMin}
                            onChange={(e) => handleChange('priceMin', e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Max $"
                            value={filters.priceMax}
                            onChange={(e) => handleChange('priceMax', e.target.value)}
                        />
                    </div>
                )}
                <Button variant="secondary" onClick={onReset}>
                    Reset
                </Button>
            </div>
        </div>
    );
}
