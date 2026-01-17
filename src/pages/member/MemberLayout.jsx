import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MemberLayout = () => {
    const { user } = useAuth();

    if (!user) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading User Profile...</div>;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px', minHeight: '100vh', background: '#f9fafb' }}>
            <Outlet />
        </div>
    );
};

export default MemberLayout;
