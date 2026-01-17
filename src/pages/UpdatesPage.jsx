import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MockDB } from '../services/mockDatabase';
import { Bell, ArrowUpRight, CheckCircle, TrendingUp } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const UpdatesPage = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const funds = MockDB.getFunds().filter(f => f.isPublic !== false);

    // Get All Expenses (Filtered by Public later)
    const expenses = MockDB.getExpenses();

    const navigate = useNavigate();

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                    <Button
                        variant="secondary"
                        onClick={() => user ? navigate('/') : navigate('/login')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                        &larr; {user ? t('back') : t('login')}
                    </Button>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('publicUpdates')}
                    </h1>
                    <p style={{ margin: '8px 0 0', color: '#6b7280' }}>{t('overview')}</p>
                </div>
            </header>

            {/* Announcements Card */}
            <div style={{ background: '#ecfdf5', borderRadius: '24px', padding: '24px', marginBottom: '32px', border: '1px solid #a7f3d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#10b981', padding: '8px', borderRadius: '50%', color: 'white' }}>
                        <Bell size={20} />
                    </div>
                    <h3 style={{ margin: 0, color: '#065f46' }}>{t('announcements')}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                        const [allAnnouncements, setAllAnnouncements] = useState([]);

                        React.useEffect(() => {
                            // 1. Mark as read
                            // 1. Mark as read
                            if (user?.id) {
                                localStorage.setItem(`lastViewedUpdates_${user.id}`, new Date().toISOString());
                                window.dispatchEvent(new Event('updates-read'));
                            }

                            // 2. Fetch Announcements
                            const list = MockDB.getAnnouncements().filter(a => !a.audience || a.audience === 'All' || (user?.role === 'member' && a.audience === 'Member') || (user?.role === 'cashier' && a.audience === 'Cashier'));
                            setAllAnnouncements(list);
                        }, [user]);

                        if (allAnnouncements.length === 0) return <div style={{ color: '#047857', fontStyle: 'italic' }}>No new announcements.</div>;

                        return allAnnouncements.slice().reverse().map(ann => (
                            <div key={ann.id} style={{
                                padding: '12px',
                                background: 'white',
                                borderRadius: '12px',
                                borderLeft: `4px solid ${ann.priority === 'High' ? '#ef4444' : '#10b981'}`,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <strong style={{ color: '#065f46' }}>{ann.title}</strong>
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(ann.date).toLocaleDateString()}</span>
                                </div>
                                <div style={{ color: '#374151', fontSize: '0.95rem' }}>{ann.message}</div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            <h3 style={{ marginBottom: '16px' }}>{t('fundUtilization')}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {funds.map(fund => (
                    <FundReportCard key={fund.id} fund={fund} expenses={expenses} />
                ))}
            </div>
        </div>
    );
};

const FundReportCard = ({ fund, expenses }) => {
    const { t } = useLanguage(); // Need to use hook here too
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate stats manually for PUBLIC view
    const fundIncome = MockDB.getTransactions()
        .filter(t => t.fundId === fund.id)
        .reduce((sum, t) => sum + parseInt(t.amount), 0);

    const publicExpenses = expenses.filter(e => e.fundId === fund.id && e.isPublic);
    const fundExpense = publicExpenses.reduce((sum, e) => sum + parseInt(e.amount), 0);
    const fundBalance = fundIncome - fundExpense;

    const usagePercent = fundIncome > 0 ? (fundExpense / fundIncome) * 100 : 0;

    return (
        <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: 0 }}>{fund.title}</h3>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '4px' }}>{t('target')}: ₹{fund.amount}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2563eb' }}>₹{fundIncome}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('collected')}</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px', color: '#4b5563' }}>
                    <span>{t('publicutilization')}: ₹{fundExpense}</span>
                    <span>{t('available')}: ₹{fundBalance}</span>
                </div>
                <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${usagePercent}%`, height: '100%', background: usagePercent > 80 ? '#ef4444' : '#10b981', transition: 'width 1s ease' }} />
                </div>
            </div>

            {/* Expander Toggle */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '8px 0',
                    borderTop: '1px solid #f3f4f6',
                    marginTop: '16px'
                }}
            >
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>
                    {t('recentExpenditures')} ({publicExpenses.length})
                </div>
                <div style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: '#6b7280'
                }}>
                    ▼
                </div>
            </div>

            {/* Expanded List */}
            {isExpanded && (
                <div className="animate-fade-in" style={{ marginTop: '12px' }}>
                    {publicExpenses.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', padding: '8px 0' }}>{t('noData')}</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {publicExpenses.slice().reverse().map(exp => (
                                <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                                    <span>{exp.purpose}</span>
                                    <span style={{ fontWeight: 600, color: '#ef4444' }}>- ₹{exp.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default UpdatesPage;
