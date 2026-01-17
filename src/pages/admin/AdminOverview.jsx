import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { MockDB } from '../../services/mockDatabase';
import { Users, Wallet, FileText, Bell, Clock, Plus, UserPlus, Camera } from 'lucide-react';

const StatWidget = ({ label, value, icon: Icon, color, gradient, onClick }) => (
    <div
        onClick={onClick}
        style={{
            background: gradient,
            padding: '24px',
            borderRadius: '24px',
            boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)',
            color: 'white',
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'scale(1)')}
    >
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', width: 'fit-content', padding: '8px', borderRadius: '12px', marginBottom: '12px' }}>
                <Icon size={20} />
            </div>
            <div>
                <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>{value}</h2>
                <span style={{ fontSize: '1rem', opacity: 0.9, fontWeight: 500 }}>{label}</span>
            </div>
        </div>

        {/* Decorative Shapes */}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.2, transform: 'rotate(-15deg)' }}>
            <Icon size={120} />
        </div>
    </div>
);

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

const AdminOverview = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [families, setFamilies] = useState(MockDB.getFamilies());
    const [funds, setFunds] = useState(MockDB.getFunds());

    // Modal States for Local Actions (Quick Actions that are Modals)
    const [isManageFamiliesOpen, setIsManageFamiliesOpen] = useState(false);
    const [isManageFundsOpen, setIsManageFundsOpen] = useState(false);

    // We can keep these modals here or move them to separate pages. 
    // For now, "Manage Families" and "Manage Funds" are modals on the dashboard. 
    // BUT the user asked for "each option comes in a different page".
    // So "Manage Families" should ideally be /admin/families logic.

    return (
        <div>
            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <StatWidget
                    label={t('families')}
                    value={families.length}
                    icon={Users}
                    gradient="var(--grad-primary)"
                />
                <StatWidget
                    label={t('funds')}
                    value={funds.length}
                    icon={Wallet}
                    gradient="var(--grad-success)"
                    onClick={() => navigate('/admin/funds')}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{t('quickActions')}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <ActionButton
                    label={t('addFamily')}
                    icon={UserPlus}
                    color="#6366f1"
                    onClick={() => navigate('/admin/families', { state: { openAdd: true } })}
                />
                <ActionButton
                    label={t('manageFamilies')}
                    icon={Users}
                    color="#8b5cf6"
                    onClick={() => navigate('/admin/families')} // New Page
                />
                <ActionButton
                    label={t('addFund')}
                    icon={Plus}
                    color="#10b981"
                    onClick={() => navigate('/admin/funds', { state: { openAdd: true } })} // New Page or Modal logic on Funds Page
                />
                <ActionButton
                    label={t('expenses')}
                    icon={FileText}
                    color="#f59e0b"
                    onClick={() => navigate('/admin/expenses')}
                />

                <ActionButton
                    label={t('manageCashiers')}
                    icon={Users}
                    color="#06b6d4"
                    onClick={() => navigate('/admin/cashiers')}
                />
                <ActionButton
                    label={t('announcements')}
                    icon={Bell}
                    color="#8b5cf6"
                    onClick={() => navigate('/admin/announcements')}
                />

                <ActionButton
                    label={t('reports')}
                    icon={Clock}
                    color="#8b5cf6"
                    onClick={() => navigate('/admin/reports')}
                />
                <ActionButton
                    label={t('recordExpense')}
                    icon={Camera}
                    color="#ec4899"
                    onClick={() => navigate('/admin/expenses', { state: { openRecord: true } })}
                />
            </div>
        </div>
    );
};

export default AdminOverview;
