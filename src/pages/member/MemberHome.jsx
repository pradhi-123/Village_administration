import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ... (skipping some imports for brevity if they are unchanged, but I must replace contiguous block)
// I will target the imports and the start of component

import { MockDB } from '../../services/mockDatabase';
import { Wallet, History, Users, AlertTriangle, HeartHandshake, ArrowRight, CheckCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DebugErrorBoundary from '../../components/common/DebugErrorBoundary';

const DashboardIcon = ({ icon: Icon, label, color, onClick, description }) => (
    <div
        onClick={onClick}
        className="clickable animate-scale"
        style={{
            background: 'white',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            cursor: 'pointer',
            textAlign: 'center',
            height: '100%',
            border: '2px solid transparent',
            transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = color;
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = 'transparent';
        }}
    >
        <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `${color}20`, // 20% opacity
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px'
        }}>
            <Icon size={40} />
        </div>
        <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', color: '#1f2937' }}>{label}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.4 }}>{description}</p>
        </div>
    </div>
);

const MemberHomeContent = ({ isCashierView = false, memberId = null }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user: authUser } = useAuth();

    // If Cashier View, we need to fetch the specific member. Otherwise use authUser.
    const [activeUser, setActiveUser] = useState(isCashierView ? null : authUser);
    const [loading, setLoading] = useState(isCashierView);
    const [notFound, setNotFound] = useState(false);

    const [totalDue, setTotalDue] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [deathFunds, setDeathFunds] = useState([]); // Added state for death funds
    const [donations, setDonations] = useState([]); // Added state for donations
    const [announcements, setAnnouncements] = useState([]); // Added state for announcements

    useEffect(() => {
        const fetchData = () => {
            try {
                // Fetch Data Safe
                const allFunds = MockDB.getFunds() || [];
                const allFamilies = MockDB.getFamilies() || [];
                const allTransactions = MockDB.getTransactions() || [];

                // Determine correct user ID
                let currentUserId = isCashierView ? id : authUser?.id;

                // Handle Cashier View finding logic
                if (isCashierView) {
                    setLoading(true);
                    const foundFamily = allFamilies.find(f => f.id === id);
                    if (foundFamily) {
                        setActiveUser(foundFamily);
                        setNotFound(false);
                    } else {
                        setNotFound(true);
                    }
                    setLoading(false);
                } else {
                    // Member View
                    if (!currentUserId && activeUser) currentUserId = activeUser.id;
                    if (!currentUserId) return;

                    // Calculate Dues Safe
                    if (Array.isArray(allTransactions) && Array.isArray(allFunds)) {
                        const userTransactions = allTransactions.filter(t => t.familyId === currentUserId);
                        const paidFundIds = new Set(userTransactions.map(t => t.fundId));

                        const unpaidFunds = allFunds.filter(f => !paidFundIds.has(f.id));
                        const dueAmount = unpaidFunds.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

                        setTotalDue(dueAmount);
                        setPendingCount(unpaidFunds.length);

                        // Active Death Funds (Only Unpaid)
                        const unpaidDeathFunds = unpaidFunds
                            .filter(f => f.classification === 'Death Fund' && f.isPublic === true)
                            .map(f => {
                                const family = f.affectedFamilyId ? allFamilies.find(fam => fam.id === f.affectedFamilyId) : null;
                                return { ...f, beneficiaryName: family ? family.headName : 'Unknown Family' };
                            });

                        // Donations (Keep all public donations as they are optional)
                        const activeDonations = allFunds.filter(f => f.classification !== 'Death Fund' && f.type === 'Donation' && f.isPublic === true);

                        setDeathFunds(unpaidDeathFunds);
                        setDonations(activeDonations);
                    }
                    setAnnouncements([]);
                }

            } catch (error) {
                console.error("Dashboard Data Error:", error);
                // Fallback to avoid crash loop
                setTotalDue(0);
                setDeathFunds([]);
                setDonations([]);
            }
        };

        fetchData();

    }, [isCashierView, id, authUser, activeUser?.id]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Member Profile...</div>;
    if (notFound) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Family Not Found (ID: {id})</div>;
    if (!activeUser) return <div style={{ padding: '40px', textAlign: 'center' }}>Preparing Dashboard...</div>;

    const basePath = isCashierView ? `/cashier/member/${id}` : '/member';

    return (
        <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Identity Card */}
            {isCashierView && (
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={() => navigate('/cashier')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center' }}
                    >
                        <ArrowRight size={24} style={{ transform: 'rotate(180deg)' }} color="#374151" /> <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>Back to Scanner</span>
                    </button>
                </div>
            )}
            <div style={{
                background: 'var(--grad-primary)',
                borderRadius: '24px',
                padding: '24px',
                color: 'white',
                marginBottom: '32px',
                boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>{activeUser.headName || activeUser.id}</h2>
                        <div style={{ opacity: 0.8, fontSize: '1.1rem', marginTop: '4px' }}>{activeUser.id}</div>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.9rem' }}>
                                {activeUser.members ? activeUser.members.length : 0} Family Members
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            </div>

            {/* Header / Welcome */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {isCashierView ? `Managing: ${activeUser.headName || activeUser.id}` : `Welcome, ${activeUser.headName || 'Member'}`}
                </h1>
                <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                    {isCashierView ? 'Select an action to perform for this member.' : 'Access your village funds, pay dues, and track contributions.'}
                </p>
            </div>

            {/* Total Due Section (Replaces Announcements) */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '8px' }}>Total Pending Dues</div>
                    <div style={{ fontSize: '3.5rem', fontWeight: '800', color: totalDue > 0 ? '#ef4444' : '#10b981', lineHeight: 1 }}>
                        ₹{totalDue.toLocaleString()}
                    </div>

                    {totalDue > 0 ? (
                        <>
                            <div style={{ marginTop: '8px', color: '#ef4444', fontWeight: '500', background: '#fef2f2', padding: '4px 12px', borderRadius: '12px' }}>
                                {pendingCount} Pending Payments
                            </div>
                            <div style={{ marginTop: '24px', width: '100%', maxWidth: '300px' }}>
                                <Button
                                    onClick={() => navigate(`${basePath}/dues`)}
                                    style={{
                                        width: '100%',
                                        height: '50px',
                                        fontSize: '1.1rem',
                                        background: '#ef4444',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                                    }}
                                >
                                    Pay Now <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold' }}>
                            <CheckCircle size={24} /> All Caught Up!
                        </div>
                    )}
                </div>
            </div>

            {/* Death Fund (Mandatory) Alerts */}
            {deathFunds.length > 0 && (
                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {deathFunds.map(fund => (
                        <div key={fund.id} className="animate-pulse-slow" style={{
                            background: '#fef2f2',
                            border: '2px solid #ef4444',
                            borderRadius: '16px',
                            padding: '20px',
                            display: 'flex',
                            gap: '20px',
                            alignItems: 'center',
                            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.1)'
                        }}>
                            <div style={{
                                background: '#ef4444',
                                color: 'white',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <AlertTriangle size={30} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', color: '#b91c1c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    Urgent • Death Fund
                                </div>
                                <h3 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '1.4rem' }}>
                                    For Family of Late. {fund.beneficiaryName}
                                </h3>
                                <p style={{ margin: '0 0 12px 0', color: '#b91c1c', opacity: 0.9 }}>
                                    {fund.description || "The village requests your support during this difficult time."}
                                </p>
                                <Button
                                    size="small"
                                    style={{ background: '#dc2626', border: 'none' }}
                                    onClick={() => navigate(`${basePath}/dues`)}
                                >
                                    {isCashierView ? "Collect Due" : "Pay Due"} <Wallet size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Other Donations (Mild) */}
            {donations.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#374151', marginBottom: '12px' }}>open Donations</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {donations.map(fund => (
                            <div key={fund.id} style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '16px',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '50%' }}>
                                    <HeartHandshake size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', color: '#166534' }}>{fund.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#15803d', marginTop: '2px' }}>Optional Contribution</div>
                                </div>
                                <Button
                                    size="small"
                                    variant="secondary"
                                    style={{ color: '#16a34a', borderColor: '#86efac', background: 'white' }}
                                    onClick={() => navigate(`${basePath}/donate`)}
                                >
                                    Donate
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Action Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
            }}>
                <DashboardIcon
                    label={isCashierView ? "Collect Dues" : "Pay Dues"}
                    description={isCashierView ? "Record cash payments or taxes from the member." : "View pending taxes, school funds, and make payments online."}
                    icon={Wallet}
                    color="#10b981" // Emerald
                    onClick={() => navigate(`${basePath}/dues`)}
                />

                <DashboardIcon
                    label="Payment History"
                    description="View detailed records of all past transactions, partial payments, and dates."
                    icon={History}
                    color="#6366f1" // Indigo
                    onClick={() => navigate(`${basePath}/history`)}
                />

                <DashboardIcon
                    label="My Family"
                    description="Manage family members, update details, and view registered info."
                    icon={Users}
                    color="#f59e0b" // Amber
                    onClick={() => navigate(`${basePath}/family`)}
                />
            </div>
        </div>
    );
};

// Wrapped for robustness
const MemberHome = (props) => (
    <DebugErrorBoundary>
        <MemberHomeContent {...props} />
    </DebugErrorBoundary>
);

export default MemberHome;
