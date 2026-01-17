import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Home, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from './Button';
import { MockDB } from '../../services/mockDatabase';

const AnimatedBackground = () => (
    <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
        background: '#f0fdfa', // Base color
        pointerEvents: 'none' // CRITICAL: Ensure this doesn't block clicks
    }}>
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                x: [0, 50, 0],
                y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 70%)',
                filter: 'blur(40px)',
            }}
        />
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -60, 0],
                x: [0, -40, 0],
                y: [0, 50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(255,255,255,0) 70%)',
                filter: 'blur(40px)',
            }}
        />
    </div>
);

const AppLayout = ({ children }) => {
    const { t } = useLanguage();
    const { user, logout, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdfa' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #ccfbf1', borderTopColor: '#0f766e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="app-container" style={{
            position: 'relative',
            background: 'transparent', // Let animated bg show
        }}>
            <AnimatedBackground />

            {/* Gradient Header */}
            <header style={{
                background: 'var(--grad-primary)',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative', // Changed from sticky to relative to prevent overlap/clash issues
                zIndex: 100,
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                borderBottom: 'none'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: 'white',
                        fontWeight: '800',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {t('appTitle')}
                    </span>
                    {user && (
                        <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ fontSize: '0.85rem', fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}
                        >
                            {t(user.role)}
                        </motion.span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <LanguageToggle />
                    {user && (
                        <Button
                            variant="secondary"
                            onClick={logout}
                            style={{
                                padding: '8px 16px',
                                minHeight: '40px',
                                fontSize: '0.9rem',
                                display: 'flex',
                                gap: '6px',
                                alignItems: 'center',
                                border: 'none',
                                background: 'white',
                                color: '#4f46e5'
                            }}
                        >
                            <LogOut size={16} /> Logout
                        </Button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main style={{
                flex: 1,
                padding: '24px',
                paddingBottom: '70px', // Space for compact bottom nav
                position: 'relative',
                zIndex: 1,
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                {children}
            </main>

            {/* Bottom Navigation - Compact & Fixed */}
            {
                user && (
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60px',
                        background: 'white',
                        borderTop: '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        zIndex: 100,
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
                        paddingBottom: 'safe-area-inset-bottom' // For modern phones
                    }}>
                        <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6366f1', textDecoration: 'none', gap: '4px' }}>
                            <Home size={20} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Home</span>
                        </Link>

                        <Link to="/updates" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#10b981', textDecoration: 'none', gap: '4px' }}>
                            <div style={{ position: 'relative' }}>
                                <Megaphone size={20} />
                                <UpdatesBadge user={user} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Updates</span>
                        </Link>
                    </div>
                )
            }

        </div >
    );
};

const UpdatesBadge = ({ user }) => {
    const [badgeCount, setBadgeCount] = React.useState(0);

    const updateBadge = React.useCallback(() => {
        if (!user) return;
        const storageKey = `lastViewedUpdates_${user.id}`;
        const lastViewed = localStorage.getItem(storageKey);
        const announcements = MockDB.getAnnouncements();

        const relevantAnnouncements = announcements.filter(a =>
            !a.audience ||
            a.audience === 'All' ||
            (user?.role === 'member' && a.audience === 'Member') ||
            (user?.role === 'cashier' && a.audience === 'Cashier')
        );

        const newCount = relevantAnnouncements.filter(a => {
            if (!lastViewed) return true;
            return new Date(a.date) > new Date(lastViewed);
        }).length;

        setBadgeCount(newCount);
    }, [user]);

    React.useEffect(() => {
        updateBadge(); // Initial check

        // Listen for custom event
        window.addEventListener('updates-read', updateBadge);
        return () => window.removeEventListener('updates-read', updateBadge);
    }, [updateBadge]);

    if (badgeCount > 0) {
        return (
            <div style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
                {badgeCount > 9 ? '9+' : badgeCount}
            </div>
        );
    }
    return null;
};


export default AppLayout;
