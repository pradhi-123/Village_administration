import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { MockDB } from '../services/mockDatabase';
import { QrCode, Scan, History, ArrowRight, CheckCircle, Search, Camera, FileText, Upload } from 'lucide-react';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import QRScanner from '../components/common/QRScanner';
import SilentErrorBoundary from '../components/common/SilentErrorBoundary';
import DebugErrorBoundary from '../components/common/DebugErrorBoundary';
import { AuditService } from '../services/AuditService';

// Removed MemberDashboard import as we redirect now

const CashierDashboardContent = () => {
    const navigate = useNavigate(); // Hook
    const { t } = useLanguage();
    const [transactions, setTransactions] = useState(MockDB.getTransactions());

    // Scanner Modal State
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [isCameraMode, setIsCameraMode] = useState(true); // Default to camera
    const [scanInput, setScanInput] = useState('');
    const [scannedFamily, setScannedFamily] = useState(null);
    const [pendingFunds, setPendingFunds] = useState([]); // Fixed: Added missing state

    // Smart Payment State
    const [smartAmount, setSmartAmount] = useState('');
    const [upiId, setUpiId] = useState('');
    const [distributionPlan, setDistributionPlan] = useState(null);

    // Expense Request State
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState({
        fundId: '',
        amount: '',
        purpose: '',
        billImage: null
    });

    const handleSmartPreview = () => {
        if (!smartAmount || isNaN(smartAmount) || smartAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        try {
            const plan = MockDB.distributePayment(scannedFamily.id, parseInt(smartAmount));
            setDistributionPlan(plan);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSmartSubmit = () => {
        try {
            MockDB.distributePayment(scannedFamily.id, parseInt(smartAmount), upiId);
            setScannedFamily(MockDB.getFamilies().find(f => f.id === scannedFamily.id)); // Refresh
            setDistributionPlan(null);
            setSmartAmount('');
            setUpiId(''); // Reset UPI
            setTransactions(MockDB.getTransactions());
            alert("Payment Recorded Successfully!");
        } catch (error) {
            alert(error.message);
        }
    };
    // Handle Smart Entry


    const [analyzing, setAnalyzing] = useState(false);

    // AI Analysis Handler
    // AI Analysis Handler
    const handleAnalyzeBill = async (file) => {
        if (!file) return;

        // Hardcoded Credentials from User
        const credentials = {
            clientId: 'vrfbrOTIln5cy7E9yiSIVEM2l6Sl0zSSJwPCrLK',
            username: 'pradhikshaanandkumar',
            apiKey: '2b41774a37b41512d4c52454fde372be'
        };

        setAnalyzing(true);
        try {
            // Re-using Veryfi Service
            const { VeryfiService } = await import('../services/VeryfiService');

            const result = await VeryfiService.processDocument(file, credentials);

            setExpenseForm(prev => ({
                ...prev,
                purpose: `Verified: ${result.summary} (${result.vendor.name})`,
                amount: result.amount
            }));
            alert(`Veryfi Analysis Complete!\nVendor: ${result.vendor.name}\nTotal: ₹${result.amount}`);
        } catch (error) {
            console.error("AI Analysis Failed", error);
            alert(`Analysis Failed: ${error.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setExpenseForm(prev => ({ ...prev, billImage: reader.result }));
            };
            reader.readAsDataURL(file);

            // Trigger AI Analysis
            handleAnalyzeBill(file);
        }
    };

    const handleSubmitExpense = (e) => {
        e.preventDefault();
        if (!expenseForm.amount || !expenseForm.purpose || !expenseForm.fundId) {
            alert("Please fill all fields");
            return;
        }

        MockDB.addExpense({
            ...expenseForm,
            cashierId: 'Cashier1', // Hardcoded for now, will be dynamic later
            status: 'Pending',
            date: new Date().toISOString()
        });

        AuditService.log('Cashier', 'Request Expense', { amount: expenseForm.amount, purpose: expenseForm.purpose });
        alert("Expense Request Sent for Approval!");
        setIsExpenseModalOpen(false);
        setExpenseForm({ fundId: '', amount: '', purpose: '', billImage: null });
    };

    const handleScan = (e) => {
        e.preventDefault();
        if (!scanInput) return;

        // Simulate looking up family
        const family = MockDB.getFamilies().find(f => f.id.toLowerCase() === scanInput.toLowerCase());

        if (family) {
            setScannedFamily(family);
            // Find unpaid funds for this family
            const allFunds = MockDB.getFunds();
            // Simple logic: if not in transactions for this fund + family, it's pending
            // (MockDB is simple, assuming one payment per fund)
            const familyTx = MockDB.getTransactions().filter(tx => tx.familyId === family.id);
            const paidFundIds = new Set(familyTx.map(tx => tx.fundId));

            const unpaid = allFunds.filter(fund => !paidFundIds.has(fund.id));
            setPendingFunds(unpaid);
        } else {
            alert('Family ID not found');
            setScannedFamily(null);
        }
    };

    const handleCollect = (fund) => {
        MockDB.addTransaction({
            familyId: scannedFamily.id,
            fundId: fund.id,
            amount: fund.amount,
            date: new Date().toISOString()
        });

        AuditService.log('Cashier', 'Collect Payment', { familyId: scannedFamily.id, fundId: fund.id, amount: fund.amount });

        setTransactions(MockDB.getTransactions()); // Refresh history

        // Remove from local pending list
        setPendingFunds(prev => prev.filter(f => f.id !== fund.id));
        alert(`Collected ₹${fund.amount} for ${fund.title}`);

        if (pendingFunds.length <= 1) {
            setIsScanModalOpen(false); // Close if done
            setScannedFamily(null);
            setScanInput('');
        }
    };

    // Announcement State
    const [announcements, setAnnouncements] = useState([]);

    React.useEffect(() => {
        const allAnnouncements = MockDB.getAnnouncements();
        // Filter for Cashier or All
        const relevant = allAnnouncements.filter(a => !a.audience || a.audience === 'All' || a.audience === 'Cashier');
        setAnnouncements(relevant);
    }, []);

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('collections')}</h1>
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}>{t('manageToday')}</p>
            </header>

            {/* Announcements Section */}
            {announcements.length > 0 && (
                <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {announcements.map(ann => (
                        <div key={ann.id} style={{
                            background: ann.priority === 'High' ? '#fef2f2' : '#eff6ff',
                            border: `1px solid ${ann.priority === 'High' ? '#fecaca' : '#dbeafe'}`,
                            padding: '16px',
                            borderRadius: '16px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{
                                background: ann.priority === 'High' ? '#ef4444' : '#3b82f6',
                                padding: '8px',
                                borderRadius: '50%',
                                color: 'white',
                                flexShrink: 0
                            }}>
                                <CheckCircle size={16} /> {/* Reusing Icon, ideally import Bell */}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', color: ann.priority === 'High' ? '#991b1b' : '#1e40af' }}>{ann.title}</div>
                                <div style={{ fontSize: '0.9rem', color: ann.priority === 'High' ? '#b91c1c' : '#1e3a8a' }}>{ann.message}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Hero Scanner Button */}
            <button
                onClick={() => setIsScanModalOpen(true)}
                className="clickable"
                style={{
                    background: 'var(--grad-primary)',
                    width: '100%',
                    border: 'none',
                    borderRadius: '32px',
                    padding: '32px',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.5)',
                    marginBottom: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                }}>
                {/* Background Mesh Effect */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)',
                    animation: 'rotate 10s linear infinite',
                    pointerEvents: 'none'
                }} />

                <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    padding: '24px',
                    borderRadius: '50%',
                    backdropFilter: 'blur(4px)',
                    position: 'relative',
                    zIndex: 1
                }}>
                    <Scan size={48} />
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{t('scanQR')}</h2>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{t('tapToCollect')}</span>
                </div>
            </button>

            {/* Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'white', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '12px', color: '#10b981' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{t('history')}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>View All</div>
                    </div>
                </div>
                <div
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="clickable"
                    style={{ background: 'white', padding: '16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-soft)', cursor: 'pointer' }}
                >
                    <div style={{ background: '#fee2e2', padding: '10px', borderRadius: '12px', color: '#ef4444' }}>
                        <FileText size={20} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{t('expenses')}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{t('requestExpense')}</div>
                    </div>
                </div>
            </div>

            {/* Expense Modal */}
            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Request Expense"
            >
                <form onSubmit={handleSubmitExpense}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Fund</label>
                        <select
                            value={expenseForm.fundId}
                            onChange={(e) => setExpenseForm({ ...expenseForm, fundId: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                        >
                            <option value="">Select Fund</option>
                            {MockDB.getFunds().map(f => (
                                <option key={f.id} value={f.id}>{f.title}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Amount (₹)"
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        placeholder="1000"
                    />

                    <Input
                        label="Purpose / Vendor"
                        value={expenseForm.purpose}
                        onChange={(e) => setExpenseForm({ ...expenseForm, purpose: e.target.value })}
                        placeholder="e.g. Tent House Payment"
                    />

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Bill Photo</label>
                        <label style={{
                            border: '2px dashed #e5e7eb',
                            padding: '24px',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            background: '#f9fafb'
                        }}>
                            {expenseForm.billImage ? (
                                <img src={expenseForm.billImage} alt="Bill" style={{ maxHeight: '100px' }} />
                            ) : (
                                <>
                                    <Upload size={24} color="#9ca3af" />
                                    <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                        {analyzing ? t('analyzingBill') : t('uploadBill')}
                                    </span>
                                    {analyzing && <div className="loader" style={{ width: '20px', height: '20px', border: '2px solid #f3f3f3', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
                                </>
                            )}
                            <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                        </label>
                    </div>

                    <Button type="submit" fullWidth>Submit Request</Button>
                </form>
            </Modal>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{t('collections')}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(!transactions || transactions.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: 'rgba(255,255,255,0.5)', borderRadius: '20px', border: '2px dashed #e5e7eb' }}>
                        {t('noData')}
                    </div>
                ) : (
                    (transactions || []).slice().reverse().map((tx, idx) => (
                        <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6b7280' }}>
                                    {tx.familyId.slice(-2)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>FAMILY {tx.familyId}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{new Date(tx.date).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#10b981' }}>+ ₹{tx.amount}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Scanner Simulation Modal */}
            <Modal
                isOpen={isScanModalOpen}
                onClose={() => { setIsScanModalOpen(false); setScannedFamily(null); setScanInput(''); setIsCameraMode(true); }}
                title="Scan QR Code"
            >
                <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                    {isCameraMode ? (
                        <div style={{ flex: 1, marginBottom: '16px' }}>
                            <SilentErrorBoundary>
                                <QRScanner
                                    onScanSuccess={(data) => {
                                        const cleanData = data.trim();
                                        const family = MockDB.getFamilies().find(f => f.id.toLowerCase() === cleanData.toLowerCase());
                                        if (family) {
                                            // Close modal
                                            setIsScanModalOpen(false);
                                            // FORCE HARD RELOAD NAVIGATION
                                            // Using standard path for BrowserRouter
                                            window.location.href = `/cashier/member/${family.id}`;
                                        } else {
                                            alert(`Family ID '${cleanData}' not found in database.`);
                                        }
                                    }}
                                    onClose={() => setIsScanModalOpen(false)}
                                />
                            </SilentErrorBoundary>
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <Button variant="secondary" onClick={() => setIsCameraMode(false)} fullWidth>
                                    Enter ID Manually
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const family = MockDB.getFamilies().find(f => f.id.toLowerCase() === scanInput.toLowerCase());
                            if (family) {
                                setIsScanModalOpen(false);
                                navigate(`/cashier/member/${family.id}`);
                            } else {
                                alert('Family ID not found');
                            }
                        }} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Input
                                label="Enter Family ID"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                placeholder="FAM001"
                            />
                            <Button type="submit" fullWidth style={{ marginBottom: '12px' }}>Find Family</Button>
                            <Button variant="secondary" onClick={() => setIsCameraMode(true)} fullWidth style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Camera size={18} /> Use Camera
                            </Button>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
};

// Wrapped for robustness
const CashierDashboard = (props) => (
    <DebugErrorBoundary>
        <CashierDashboardContent {...props} />
    </DebugErrorBoundary>
);

export default CashierDashboard;
