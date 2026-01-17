import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { MockDB } from '../services/mockDatabase';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { User, ShieldCheck, Banknote, ChevronRight, ArrowLeft, Star, Landmark, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const { t } = useLanguage();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [view, setView] = useState('selection');
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({ familyId: '', password: '' });
    const [error, setError] = useState('');
    const [debugIds, setDebugIds] = useState([]);

    React.useEffect(() => {
        const families = MockDB.getFamilies();
        setDebugIds(families.map(f => f.id));
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                duration: 0.3 // Faster fade in
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } } // Snappy spring
    };

    const RoleCard = ({ role, icon: Icon, color, gradient, label }) => (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                setSelectedRole(role);
                setView('form');
                setFormData({ familyId: '', password: '' });
                setError('');
            }}
            style={{
                background: gradient,
                borderRadius: '24px',
                padding: '24px 28px',
                color: 'white',
                marginBottom: '16px', // Reduced spacing
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
                <div style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '14px',
                    borderRadius: '50%',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 'inset 0 0 10px rgba(255,255,255,0.2)'
                }}>
                    <Icon size={28} color="white" strokeWidth={2.5} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{label}</h3>
                    <span style={{ fontSize: '0.9rem', opacity: 0.95, fontWeight: 500 }}>{t('loginAs')} {label}</span>
                </div>
            </div>
            <ChevronRight size={24} style={{ opacity: 0.9 }} />

            {/* Decorative Elements */}
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                <Icon size={120} />
            </div>
            <div style={{ position: 'absolute', top: '10px', right: '50px', opacity: 0.6 }}>
                <Star size={16} fill="white" stroke="none" />
            </div>

        </motion.div>
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        let success = false;
        if (selectedRole === 'member') {
            if (!formData.familyId) { setError(t('error')); return; }
            success = login('member', { familyId: formData.familyId });
        } else {
            if (!formData.password) { setError(t('error')); return; }
            success = login(selectedRole, { password: formData.password });
        }

        if (success) navigate('/');
        else setError(t('error')); // Generic error for now, ideally specific
    };

    const handleReset = () => {
        if (window.confirm("This will RESET all data (Families, Funds, Transactions) to default. Are you sure?")) {
            MockDB.reset();
            window.location.reload();
        }
    };

    const getRoleTheme = () => {
        if (selectedRole === 'member') return 'var(--grad-secondary)';
        if (selectedRole === 'admin') return 'var(--grad-primary)';
        return 'var(--grad-success)';
    };

    return (
        <AnimatePresence mode="wait">
            {view === 'selection' ? (
                <motion.div
                    key="selection"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    style={{
                        paddingTop: '20px', // Reduced padding
                        minHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}
                >
                    {/* Hero Section - Reduced Size */}
                    <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
                        <div style={{
                            background: 'white',
                            width: '64px', // Smaller icon
                            height: '64px',
                            borderRadius: '20px',
                            margin: '0 auto 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 25px rgba(99,102,241,0.25)',
                            transform: 'rotate(-5deg)',
                        }}>
                            <Landmark size={32} color="#6366f1" />
                        </div>

                        <h1 style={{
                            fontSize: '2rem', // Smaller text
                            backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 900,
                            margin: '0 auto',
                            lineHeight: 1.1,
                            maxWidth: '90%',
                            letterSpacing: '-0.5px',
                        }}>
                            {t('appTitle')}
                        </h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '8px' }}>
                            {t('appSubtitle')}
                        </p>
                    </div>

                    <div style={{ padding: '0 12px' }}>
                        <RoleCard
                            role="member"
                            label={t('member')}
                            icon={User}
                            gradient="var(--grad-secondary)"
                        />
                        <RoleCard
                            role="cashier"
                            label={t('cashier')}
                            icon={Banknote}
                            gradient="var(--grad-success)"
                        />
                        <RoleCard
                            role="admin"
                            label={t('admin')}
                            icon={ShieldCheck}
                            gradient="var(--grad-primary)"
                        />
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '10px' }}>
                        <a href="/updates" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#4f46e5',
                            textDecoration: 'none',
                            fontWeight: '600',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: 'rgba(99,102,241,0.1)',
                            fontSize: '0.9rem'
                        }}>
                            📢 {t('viewUpdates')}
                        </a>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '20px', opacity: 0.5 }}>
                        <button onClick={handleReset} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
                            <RotateCcw size={12} /> {t('resetDemo')}
                        </button>
                    </div>

                    {/* DEBUG: Show Valid IDs */}
                    <div style={{ marginTop: '20px', padding: '10px', background: '#fef3c7', borderRadius: '8px', fontSize: '0.75rem', color: '#92400e', textAlign: 'center' }}>
                        <strong>DEBUG INFO (Valid IDs):</strong><br />
                        {debugIds.length > 0 ? debugIds.join(', ') : "DATABASE EMPTY - PLEASE CLICK RESET"}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    style={{ paddingTop: '20px' }}
                >
                    <button
                        onClick={() => setView('selection')}
                        style={{
                            background: 'white',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '24px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            padding: '10px 20px',
                            borderRadius: '9999px',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <ArrowLeft size={20} /> {t('back')}
                    </button>

                    <div style={{
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '32px',
                        padding: '40px 32px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(255,255,255,0.5)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1, rotate: 360 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    background: getRoleTheme(),
                                    borderRadius: '50%',
                                    margin: '0 auto 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                }}>
                                {selectedRole === 'member' && <User size={40} />}
                                {selectedRole === 'admin' && <ShieldCheck size={40} />}
                                {selectedRole === 'cashier' && <Banknote size={40} />}
                            </motion.div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
                                {selectedRole === 'member' ? t('member') : selectedRole === 'admin' ? t('admin') : t('cashier')}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {selectedRole === 'member' ? (
                                <Input
                                    label={t('familyId')}
                                    name="familyId"
                                    value={formData.familyId}
                                    onChange={(e) => setFormData({ ...formData, familyId: e.target.value })}
                                    placeholder="e.g., FAM001"
                                    error={error}
                                />
                            ) : (
                                <Input
                                    label={t('password')}
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••"
                                    error={error}
                                />
                            )}

                            <Button
                                type="submit"
                                fullWidth={true}
                                className="mt-4"
                                style={{
                                    background: getRoleTheme(),
                                    marginTop: '24px',
                                    fontSize: '1.2rem',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                                }}
                            >
                                {t('login')}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Login;
