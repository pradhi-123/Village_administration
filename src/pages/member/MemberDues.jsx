import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MockDB } from '../../services/mockDatabase';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DebugErrorBoundary from '../../components/common/DebugErrorBoundary';

const MemberDuesContent = ({ user: propUser, isCashierView = false }) => {
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

    // Smart Pay State
    const [smartAmount, setSmartAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [paymentMode, setPaymentMode] = useState(isCashierView ? 'CASH' : 'UPI');
    const [distributionPlan, setDistributionPlan] = useState(null);

    // Manual Pay State
    const [payMode, setPayMode] = useState('SMART'); // 'SMART' | 'MANUAL'
    const [selectedFunds, setSelectedFunds] = useState(new Set());

    const toggleFundSelection = (fundId) => {
        setSelectedFunds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fundId)) newSet.delete(fundId);
            else newSet.add(fundId);
            return newSet;
        });
    };

    // Removed old manual logic in favor of unified Smart Preview flow with filtering

    useEffect(() => {
        if (!user) return;
        setFunds(MockDB.getFunds());
        setTransactions(MockDB.getTransactions().filter(tx => tx.familyId === user.id));
    }, [user]);

    // Auto-calculate removed as per user request to allow manual entry
    // User must enter amount and select funds manually.

    useEffect(() => {
        if (isCashierView) setPaymentMode('CASH');
        else setPaymentMode('UPI');
    }, [isCashierView]);

    const handleSmartPreview = () => {
        if (!user || !smartAmount || isNaN(smartAmount) || smartAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        if (payMode === 'MANUAL' && selectedFunds.size === 0) {
            alert("Please select at least one fund to pay.");
            return;
        }

        try {
            const allowedIds = payMode === 'MANUAL' ? Array.from(selectedFunds) : null;
            const plan = MockDB.distributePayment(user.id, parseInt(smartAmount), null, allowedIds);
            setDistributionPlan(plan);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSmartSubmit = () => {
        if (!distributionPlan) return;
        try {
            if (paymentMode === 'UPI' && !upiId.trim()) {
                alert("Please enter a valid UPI ID for online payment.");
                return;
            }
            if (paymentMode === 'CASH' && !isCashierView) {
                alert("Only authorized Cashiers can record Cash payments.");
                return;
            }

            const allowedIds = payMode === 'MANUAL' ? Array.from(selectedFunds) : null;
            MockDB.distributePayment(user.id, parseInt(smartAmount), paymentMode === 'UPI' ? upiId : null, allowedIds);

            // Immediate Refresh
            const updatedTransactions = MockDB.getTransactions().filter(tx => tx.familyId === user.id);
            setTransactions(updatedTransactions);

            // Clear inputs
            setSmartAmount('');
            setUpiId('');
            setDistributionPlan(null);
            setSelectedFunds(new Set()); // Clear selection

            alert(`Payment Successful via ${paymentMode}!`);
        } catch (error) {
            alert(error.message);
        }
    };

    if (!user) return <div>Loading...</div>;

    const paidFundIds = new Set(transactions.map(tx => tx.fundId));

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All'); // 'All', 'Mandatory', 'Optional'
    const [sortOrder, setSortOrder] = useState('Date'); // 'Date', 'Amount'

    const pendingFunds = funds.filter(fund => !paidFundIds.has(fund.id));
    let filteredFunds = [...pendingFunds];

    // Apply Search
    if (searchTerm) {
        filteredFunds = filteredFunds.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply Type Filter
    if (filterType !== 'All') {
        filteredFunds = filteredFunds.filter(f => {
            if (filterType === 'Mandatory') return f.isMandatory;
            if (filterType === 'Optional') return !f.isMandatory;
            if (filterType === 'Monthly') return f.type === 'Monthly';
            if (filterType === 'Death Fund') return f.classification === 'Death Fund' || f.title.toLowerCase().includes('death');
            if (filterType === 'Donation') return f.type === 'Donation';
            if (filterType === 'Event') return f.type === 'OneTime' || f.type === 'Event';
            return true;
        });
    }

    // Apply Sort
    filteredFunds.sort((a, b) => {
        if (sortOrder === 'Amount') {
            // High to Low
            return (b.amount || 0) - (a.amount || 0);
        } else {
            // Date: Oldest First (Earliest Deadline or Created Date)
            const dateA = new Date(a.deadline || a.createdDate || '2999-12-31').getTime();
            const dateB = new Date(b.deadline || b.createdDate || '2999-12-31').getTime();
            return dateA - dateB;
        }
    });

    const totalDue = filteredFunds.reduce((sum, f) => sum + f.amount, 0);
    // Note: totalDue here reflects the FILTERED view, which might be what user wants for manual selection of specific things,
    // but typically "Total Due" in the Smart Input placeholder should probably be GLOBAL. 
    // However, if I filter, maybe I only want to pay those? 
    // Let's keep the placeholder showing the *Filtered* total to be dynamic.

    return (
        <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={handleBack}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', marginBottom: '12px', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <ArrowLeft size={24} color="#374151" /> <span style={{ marginLeft: '8px', color: '#6b7280', fontWeight: '500' }}>Back to Dashboard</span>
                </button>
            </div>

            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '16px', border: '1px solid #bae6fd', marginBottom: '24px' }}>

                {/* Header & Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.5rem' }}>⚡</span> Actions
                    </h3>
                    {/* Mode Toggle */}
                    <div style={{ display: 'flex', background: 'white', border: '1px solid #bae6fd', borderRadius: '8px', overflow: 'hidden' }}>
                        <button
                            onClick={() => {
                                setPayMode('SMART');
                                setDistributionPlan(null);
                                setSelectedFunds(new Set());
                            }}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                background: payMode === 'SMART' ? '#0ea5e9' : 'transparent',
                                color: payMode === 'SMART' ? 'white' : '#64748b',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}>
                            Smart Auto
                        </button>
                        <button
                            onClick={() => { setPayMode('MANUAL'); setDistributionPlan(null); }}
                            style={{
                                padding: '6px 12px',
                                border: 'none',
                                background: payMode === 'MANUAL' ? '#0ea5e9' : 'transparent',
                                color: payMode === 'MANUAL' ? 'white' : '#64748b',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}>
                            Manual Select
                        </button>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <Input
                            placeholder="🔍 Search funds..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ margin: 0 }}
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                    >
                        <option value="All">All Types</option>
                        <option value="Mandatory">Mandatory</option>
                        <option value="Optional">Optional</option>
                        <option value="Monthly">Monthly Fund</option>
                        <option value="Death Fund">Death Fund</option>
                        <option value="Event">Events / Festivals</option>
                        <option value="Donation">Donation</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                    >
                        <option value="Date">Sort by Date</option>
                        <option value="Amount">Sort by Amount</option>
                    </select>
                </div>

                <p style={{ color: '#5b6b7c', fontSize: '0.9rem', marginBottom: '16px' }}>
                    {payMode === 'SMART'
                        ? (isCashierView ? "Enter total received. AI auto-allocates to oldest/urgent dues." : "Enter amount. We prioritize oldest dues.")
                        : "Select specific funds from the list below to pay."
                    }
                </p>

                {isCashierView && (
                    <div style={{ marginBottom: '12px', gap: '8px', background: '#e0f2fe', padding: '4px', borderRadius: '8px', display: 'inline-flex' }}>
                        <button onClick={() => setPaymentMode('CASH')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: paymentMode === 'CASH' ? 'white' : 'transparent', color: paymentMode === 'CASH' ? '#0369a1' : '#64748b', fontWeight: '600', boxShadow: paymentMode === 'CASH' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>Cash</button>
                        <button onClick={() => setPaymentMode('UPI')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: paymentMode === 'UPI' ? 'white' : 'transparent', color: paymentMode === 'UPI' ? '#0369a1' : '#64748b', fontWeight: '600', boxShadow: paymentMode === 'UPI' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>UPI / Online</button>
                    </div>
                )}

                {payMode === 'MANUAL' && (
                    <div style={{ marginBottom: '16px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981', color: '#047857', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>Manual Mode Active:</strong> Select funds below & enter amount.</span>
                        {selectedFunds.size > 0 && <span>{selectedFunds.size} Selected</span>}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <Input
                        type="number"
                        value={smartAmount}
                        onChange={(e) => setSmartAmount(e.target.value)}
                        placeholder={payMode === 'SMART' ? `Total Due: ₹${totalDue || 0}` : `Enter Amount (e.g. ₹500)`}
                        style={{ margin: 0, flex: 1 }}
                    />
                    <Button onClick={handleSmartPreview} disabled={!smartAmount || parseInt(smartAmount) <= 0}>
                        {isCashierView ? 'Calculate' : 'Preview Pay'}
                    </Button>
                </div>

                {distributionPlan && (
                    <div className="animate-fade-in" style={{ marginTop: '16px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>Payment Summary:</div>
                        <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', color: '#15803d' }}>
                            {distributionPlan.allocation.map((item, idx) => (
                                <li key={idx}>
                                    <strong>₹{item.amount}</strong> for {item.fundName}
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '6px' }}>({item.status})</span>
                                </li>
                            ))}
                        </ul>

                        {paymentMode === 'UPI' && (
                            <div style={{ marginTop: '16px', marginBottom: '12px' }}>
                                <Input placeholder="Enter UPI ID / Transaction Ref" value={upiId} onChange={(e) => setUpiId(e.target.value)} style={{ width: '100%' }} />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="secondary" onClick={() => setDistributionPlan(null)} fullWidth>Cancel</Button>
                            <Button variant="primary" onClick={handleSmartSubmit} fullWidth>
                                Confirm
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {(!filteredFunds || filteredFunds.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '24px' }}>
                    <CheckCircle size={60} color="#10b981" style={{ marginBottom: '16px' }} />
                    <h3>{pendingFunds.length === 0 ? "No Pending Dues!" : "No funds match your filter."}</h3>
                    <p style={{ color: '#6b7280' }}>
                        {pendingFunds.length === 0 ? "You are all caught up." : "Try adjusting your search filters."}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {filteredFunds.map(fund => (
                        <div key={fund.id}
                            onClick={() => {
                                if (payMode === 'MANUAL') toggleFundSelection(fund.id);
                            }}
                            style={{
                                padding: '20px',
                                borderLeft: `6px solid ${payMode === 'MANUAL' && selectedFunds.has(fund.id) ? '#10b981' : '#ef4444'}`,
                                background: payMode === 'MANUAL' && selectedFunds.has(fund.id) ? '#f0fdf4' : 'white',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                marginBottom: '16px',
                                cursor: payMode === 'MANUAL' ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                border: payMode === 'MANUAL' && selectedFunds.has(fund.id) ? '2px solid #10b981' : '1px solid #e5e7eb'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {payMode === 'MANUAL' && (
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '4px',
                                            border: `2px solid ${selectedFunds.has(fund.id) ? '#10b981' : '#d1d5db'}`,
                                            background: selectedFunds.has(fund.id) ? '#10b981' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {selectedFunds.has(fund.id) && <span style={{ color: 'white', fontSize: '14px' }}>✓</span>}
                                        </div>
                                    )}
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{fund.title}</span>
                                </div>
                                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>₹{fund.amount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#6b7280', paddingLeft: payMode === 'MANUAL' ? '32px' : '0' }}>
                                <span>Due: {fund.deadline || 'ASAP'}</span>
                                <span style={{ color: '#ef4444' }}>Unpaid: ₹{fund.amount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

    );
};

// Wrapped for robustness
const MemberDues = (props) => (
    <DebugErrorBoundary>
        <MemberDuesContent {...props} />
    </DebugErrorBoundary>
);

export default MemberDues;
