import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import MemberDues from './member/MemberDues';
import MemberHistory from './member/MemberHistory';
import MemberFamily from './member/MemberFamily';

// This component is now primarily used for the Cashier View (State-based navigation)
// OR as a fallback/wrapper if needed.
// Authenticated members will route through MemberLayout.

const MemberDashboard = ({ overrideUser, isCashierView = false }) => {
    const { user: authUser } = useAuth();
    const user = overrideUser || authUser;
    const [activeTab, setActiveTab] = useState('dues');

    // If redirected here via Route without /member/dues, we might want to default to something.
    // But typically this component is for Cashier Modal usage mainly now.

    // BUT! Since App.jsx might still use this for /member if I didn't update it yet...
    // Actually I plan to point /member to MemberLayout. 
    // So this file is ONLY for Cashier View now (or legacy).

    if (!user) return <div>Loading...</div>;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            {/* Note: The Identity Card was moved to MemberLayout for the Routed view. 
                 But for Cashier View, the scanner usually shows the name at the top of the modal.
                 We might want to show it here too if needed, but CashierDashboard modal already shows "Viewing as...".
                 Let's check what CashierDashboard does. It renders this inside a modal. 
            */}

            {/* Tabs for Cashier View */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('dues')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '16px',
                        border: 'none',
                        background: activeTab === 'dues' ? 'var(--color-primary)' : 'white',
                        color: activeTab === 'dues' ? 'white' : '#6b7280',
                        fontWeight: 'bold',
                        boxShadow: activeTab === 'dues' ? 'var(--shadow-md)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Pay
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '16px',
                        border: 'none',
                        background: activeTab === 'history' ? 'var(--color-primary)' : 'white',
                        color: activeTab === 'history' ? 'white' : '#6b7280',
                        fontWeight: 'bold',
                        boxShadow: activeTab === 'history' ? 'var(--shadow-md)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    History
                </button>
                <button
                    onClick={() => setActiveTab('family')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '16px',
                        border: 'none',
                        background: activeTab === 'family' ? 'var(--color-primary)' : 'white',
                        color: activeTab === 'family' ? 'white' : '#6b7280',
                        fontWeight: 'bold',
                        boxShadow: activeTab === 'family' ? 'var(--shadow-md)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Family
                </button>
            </div>

            {activeTab === 'dues' && <MemberDues user={user} isCashierView={isCashierView} />}
            {activeTab === 'history' && <MemberHistory user={user} />}
            {activeTab === 'family' && <MemberFamily user={user} />}
        </div>
    );
};

export default MemberDashboard;

