import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Wallet, FileText, Bell, Clock, Plus, UserPlus, Camera } from 'lucide-react';
import { AuditService } from '../../services/AuditService';

const ActionButton = ({ label, icon: Icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="clickable"
        style={{
            background: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-soft)',
            height: '160px',
            justifyContent: 'center',
            cursor: 'pointer',
            width: '100%'
        }}>
        <div style={{
            background: color,
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: `0 8px 16px -4px ${color}66`
        }}>
            <Icon size={28} />
        </div>
        <span style={{ fontWeight: 600, color: '#374151', fontSize: '1rem' }}>{label}</span>
    </button>
);

const AdminLayout = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we are on the root /admin path to show the dashboard overview
    const isRoot = location.pathname === '/admin' || location.pathname === '/admin/';

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '20px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('dashboard')}</h1>
                {/* Breadcrumb-ish */}
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
                    {isRoot ? t('overview') : location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
                </p>
                {!isRoot && (
                    <button
                        onClick={() => navigate('/admin')}
                        style={{ marginTop: '12px', background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0 }}
                    >
                        ← Back to Overview
                    </button>
                )}
            </header>

            <Outlet />
        </div>
    );
};

export default AdminLayout;
