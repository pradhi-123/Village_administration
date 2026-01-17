import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MockDB } from '../../services/mockDatabase';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Clock, PieChart, Search, Filter, ArrowUpDown, ArrowLeft } from 'lucide-react';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

const MemberHistory = ({ user: propUser, isCashierView = false }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user: authUser } = useAuth();

    // Determine the target user: propUser -> URL param ID (Cashier View) -> authUser (Member View)
    const [user, setUser] = useState(propUser || (!isCashierView ? authUser : null));

    useEffect(() => {
        if (isCashierView && id && !propUser) {
            const foundUser = MockDB.getFamilies().find(f => f.id === id);
            setUser(foundUser);
        } else if (!isCashierView && !propUser) {
            setUser(authUser);
        }
    }, [isCashierView, id, authUser, propUser]);

    const handleBack = () => {
        if (isCashierView) {
            navigate(`/cashier/member/${user?.id || id}`);
        } else {
            navigate('/member');
        }
    };

    const [funds, setFunds] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PARTIAL, FULL
    const [sortOrder, setSortOrder] = useState('DATE_DESC'); // DATE_DESC, DATE_ASC, AMOUNT_DESC

    useEffect(() => {
        if (!user) return;
        setFunds(MockDB.getFunds());
        setTransactions(MockDB.getTransactions().filter(tx => tx.familyId === user.id));
    }, [user]);

    if (!user) return <div>Loading...</div>;

    // Derived Logic
    const getFundDetails = (fundId) => funds.find(f => f.id === fundId);

    const processedTransactions = transactions
        .map(tx => {
            const fund = getFundDetails(tx.fundId);
            const isPartial = fund && tx.amount < fund.amount;
            return { ...tx, fundTitle: fund ? fund.title : 'Unknown Fund', isPartial, totalDue: fund ? fund.amount : 0 };
        })
        .filter(tx => {
            const safeTitle = (tx.fundTitle || '').toString().toLowerCase();
            const safeId = (tx.fundId || '').toString().toLowerCase();
            const term = searchTerm.toLowerCase();

            const matchesSearch = safeTitle.includes(term) || safeId.includes(term);
            const matchesStatus = statusFilter === 'ALL'
                ? true
                : statusFilter === 'PARTIAL' ? tx.isPartial : !tx.isPartial;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortOrder === 'DATE_DESC') return new Date(b.date) - new Date(a.date);
            if (sortOrder === 'DATE_ASC') return new Date(a.date) - new Date(b.date);
            if (sortOrder === 'AMOUNT_DESC') return b.amount - a.amount;
            return 0;
        });

    return (
        <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header / Controls */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <button
                        onClick={handleBack}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <ArrowLeft size={24} color="#374151" />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1f2937' }}>
                        {isCashierView ? 'Transaction History' : 'My Payment History'}
                    </h2>
                </div>

                {/* Filter Bar */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <Input
                            placeholder="Search by Fund Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white' }}
                    >
                        <option value="ALL">All Status</option>
                        <option value="FULL">Fully Paid</option>
                        <option value="PARTIAL">Partially Paid</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white' }}
                    >
                        <option value="DATE_DESC">Newest First</option>
                        <option value="DATE_ASC">Oldest First</option>
                        <option value="AMOUNT_DESC">Highest Amount</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {processedTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', background: '#f9fafb', borderRadius: '16px' }}>
                        <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No transactions found matching your filters.</p>
                    </div>
                ) : (
                    processedTransactions.map((tx, idx) => (
                        <Card key={idx} style={{
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: tx.isPartial ? '4px solid #f59e0b' : '4px solid #10b981'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    background: tx.isPartial ? '#fef3c7' : '#ecfdf5',
                                    padding: '12px',
                                    borderRadius: '50%',
                                    color: tx.isPartial ? '#d97706' : '#10b981'
                                }}>
                                    {tx.isPartial ? <PieChart size={24} /> : <CheckCircle size={24} />}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#374151' }}>{tx.fundTitle}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#6b7280', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <Clock size={12} /> {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString()}
                                    </div>
                                    {tx.isPartial && (
                                        <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}>
                                            PARTIAL PAYMENT (Due: ₹{tx.totalDue})
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: tx.isPartial ? '#d97706' : '#10b981' }}>
                                    ₹{tx.amount}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                                    {tx.paymentMode || 'CASH'}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default MemberHistory;
