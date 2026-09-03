import { useEffect, useState } from 'react';
import { Loader, Button } from '../components/ui';
import { TransactionCard } from '../components/transactions';
import useTransactionStore from '../stores/transactionStore';

export default function Transactions() {
    const { transactions, isLoading, fetchTransactions } = useTransactionStore();
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'active') {
            return ['ACCEPTED', 'AGREEMENT_PROPOSED', 'ACTIVE', 'RETURN_PENDING'].includes(t.status);
        }
        if (filter === 'completed') {
            return t.status === 'COMPLETED';
        }
        if (filter === 'disputed') {
            return t.status === 'DISPUTED';
        }
        return true;
    });

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
        { key: 'disputed', label: 'Disputed' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Transactions</h1>

            <div className="flex gap-2 mb-6">
                {filters.map(f => (
                    <Button
                        key={f.key}
                        variant={filter === f.key ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </Button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader size="lg" />
                </div>
            ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No transactions found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTransactions.map(transaction => (
                        <TransactionCard key={transaction._id} transaction={transaction} />
                    ))}
                </div>
            )}
        </div>
    );
}
