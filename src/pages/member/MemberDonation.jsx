import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MockDB } from '../../services/mockDatabase';
import { HeartHandshake, ArrowLeft, CheckCircle } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const MemberDonation = ({ user: propUser, isCashierView = false }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user: authUser } = useAuth();

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
        const basePath = isCashierView ? `/cashier/member/${user?.id || id}` : '/member';
        navigate(basePath);
    };

    const [donations, setDonations] = useState([]);
    const [transactions, setTransactions] = useState([]);

    // Payment State
    const [selectedFund, setSelectedFund] = useState(null);
    const [amount, setAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [paymentMode, setPaymentMode] = useState(isCashierView ? 'CASH' : 'UPI');

    const refreshData = () => {
        if (!user) return;
        const allFunds = MockDB.getFunds();
        const userTx = MockDB.getTransactions().filter(tx => tx.familyId === user.id);

        // Filter for Donations only (and public)
        const donationFunds = allFunds.filter(f => f.type === 'Donation' && f.isPublic === true);

        setDonations(donationFunds);
        setTransactions(userTx);
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    useEffect(() => {
        if (isCashierView) setPaymentMode('CASH');
        else setPaymentMode('UPI');
    }, [isCashierView]);

    const handleDonate = () => {
        if (!user || !selectedFund || !amount || isNaN(amount) || parseInt(amount) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        if (paymentMode === 'UPI' && !upiId.trim()) {
            alert("Please enter UPI ID.");
            return;
        }

        try {
            MockDB.addTransaction({
                familyId: user.id,
                fundId: selectedFund.id,
                amount: parseInt(amount),
                method: paymentMode,
                details: paymentMode === 'UPI' ? `Donation UPI: ${upiId}` : 'Donation Cash',
                type: 'Donation'
            });

            alert("Thank you for your generous donation!");
            setSelectedFund(null);
            setAmount('');
            setUpiId('');
            refreshData();
        } catch (error) {
            alert(error.message);
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px' }}>
                <button
                    onClick={handleBack}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', marginBottom: '12px', display: 'flex', alignItems: 'center' }}
                >
                    <ArrowLeft size={24} color="#374151" /> <span style={{ marginLeft: '8px', color: '#6b7280', fontWeight: '500' }}>Back to Dashboard</span>
                </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <HeartHandshake size={40} color="#16a34a" />
                </div>
                <h2 style={{ margin: 0, color: '#166534' }}>Community Donations</h2>
                <p style={{ color: '#15803d' }}>Contribute to the welfare of our village.</p>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
                {donations.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No active donation drives at the moment.</div>
                ) : (
                    donations.map(fund => {
                        // Calculate total donated by this user to this fund
                        const myTotal = transactions
                            .filter(t => t.fundId === fund.id)
                            .reduce((sum, t) => sum + parseInt(t.amount), 0);

                        const isSelected = selectedFund?.id === fund.id;

                        return (
                            <Card key={fund.id} style={{
                                padding: '20px',
                                border: isSelected ? '2px solid #16a34a' : '1px solid #e5e7eb',
                                background: isSelected ? '#f0fdf4' : 'white',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1f2937' }}>{fund.title}</h3>
                                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>{fund.description || "Open Donation"}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>You Donated</div>
                                        <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '1.1rem' }}>₹{myTotal}</div>
                                    </div>
                                </div>

                                {isSelected ? (
                                    <div className="animate-fade-in" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #bbf7d0' }}>
                                        {isCashierView && (
                                            <div style={{ marginBottom: '12px', gap: '8px', display: 'flex' }}>
                                                <button onClick={() => setPaymentMode('CASH')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #16a34a', background: paymentMode === 'CASH' ? '#16a34a' : 'transparent', color: paymentMode === 'CASH' ? 'white' : '#16a34a', cursor: 'pointer' }}>Cash</button>
                                                <button onClick={() => setPaymentMode('UPI')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #16a34a', background: paymentMode === 'UPI' ? '#16a34a' : 'transparent', color: paymentMode === 'UPI' ? 'white' : '#16a34a', cursor: 'pointer' }}>UPI</button>
                                            </div>
                                        )}

                                        <Input
                                            label="Donation Amount (₹)"
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Enter amount..."
                                            autoFocus
                                        />

                                        {paymentMode === 'UPI' && (
                                            <Input
                                                label="UPI Reference / ID"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                placeholder="e.g. 1234567890"
                                            />
                                        )}

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                            <Button variant="secondary" onClick={() => setSelectedFund(null)} fullWidth>Cancel</Button>
                                            <Button onClick={handleDonate} fullWidth style={{ background: '#16a34a', border: 'none' }}>Confirm Donation</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => { setSelectedFund(fund); setAmount(''); }}
                                        style={{ width: '100%', background: 'white', color: '#16a34a', border: '1px solid #16a34a' }}
                                    >
                                        Donate Now
                                    </Button>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MemberDonation;
