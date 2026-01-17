import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MockDB } from '../services/mockDatabase';
import { AuditService } from '../services/AuditService';
// Patched: Replaced Megaphone with Bell to prevent crash if icon missing
import { Users, Wallet, FileText, Settings, ArrowUpRight, Plus, UserPlus, Trash2, Edit, Camera, Upload, Shield, CheckCircle, Clock, Bell } from 'lucide-react';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

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

const AdminDashboard = () => {
    const { t } = useLanguage();
    console.log("AdminDashboard: Render Start");
    const [families, setFamilies] = useState(MockDB.getFamilies());
    console.log("AdminDashboard: Families loaded", families);
    const [funds, setFunds] = useState(MockDB.getFunds());
    console.log("AdminDashboard: Funds loaded", funds);

    // State
    const [activeTab, setActiveTab] = useState(localStorage.getItem('vfms_admin_tab') || 'overview');

    // Persist tab
    useEffect(() => {
        localStorage.setItem('vfms_admin_tab', activeTab);
    }, [activeTab]); // overview, expenses, audit
    const [refresh, setRefresh] = useState(false); // To trigger re-renders on logic updates

    // Modal States
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [isManageFamiliesOpen, setIsManageFamiliesOpen] = useState(false);
    const [isManageFundsOpen, setIsManageFundsOpen] = useState(false);

    // Form States
    const [newFamily, setNewFamily] = useState({
        id: '',
        headName: '',
        headAge: '',
        headDob: '', // Added DOB
        headGender: 'Male',
        headMobile: '',
        headPhoto: null,
        members: [] // { name, age, dob, gender, mobile, photo }
    });
    const [isEditing, setIsEditing] = useState(false);

    // Cashier Management State
    const [cashiers, setCashiers] = useState(MockDB.getCashiers());
    const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);
    const [newCashier, setNewCashier] = useState({ name: '', mobile: '', pin: '' });

    const handleAddCashier = (e) => {
        e.preventDefault();
        if (!newCashier.name || !newCashier.mobile || !newCashier.pin) {
            alert("All fields are required");
            return;
        }
        MockDB.addCashier({
            id: `CASH${Date.now().toString().slice(-4)}`,
            ...newCashier
        });
        setCashiers(MockDB.getCashiers());
        setIsCashierModalOpen(false);
        setNewCashier({ name: '', mobile: '', pin: '' });
        alert("Cashier Added!");
    };

    const handleDeleteCashier = (id) => {
        if (window.confirm("Remove this cashier access?")) {
            MockDB.deleteCashier(id);
            setCashiers(MockDB.getCashiers());
        }
    };

    // Refs for hidden file inputs
    const headFileInputRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState('');

    // AI & Smart Features
    const [analyzing, setAnalyzing] = useState(false);
    const [billSummary, setBillSummary] = useState(null);
    const [newFund, setNewFund] = useState({
        name: '',
        amount: '',
        description: '',
        isPublic: true,
        isMandatory: false,
        priority: 'Normal',
        frequency: 'OneTime',
        deadline: '',
        classification: 'General'
    });

    // Reports Filter State
    const [reportFundFilter, setReportFundFilter] = useState('ALL');
    const [reportFamilyFilter, setReportFamilyFilter] = useState('ALL');

    // Announcement State
    const [announcements, setAnnouncements] = useState(MockDB.getAnnouncements());
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', priority: 'Normal' });

    // Family Sort/Filter State (New)
    const [familySort, setFamilySort] = useState('ID');
    const [lowComplianceFilter, setLowComplianceFilter] = useState(false);

    // Fund Report State (New)
    const [viewingFundReport, setViewingFundReport] = useState(null);
    const [reportFilter, setReportFilter] = useState('unpaid');

    // Computed for Reports
    const allTransactions = MockDB.getTransactions();
    const filteredTransactions = allTransactions.filter(tx => {
        const matchFund = reportFundFilter === 'ALL' || tx.fundId === reportFundFilter;
        const matchFamily = reportFamilyFilter === 'ALL' || tx.familyId === reportFamilyFilter;
        return matchFund && matchFamily;
    });

    const totalCollected = filteredTransactions.reduce((sum, tx) => sum + parseInt(tx.amount), 0);

    // Direct Admin Expense State
    const [isAdminExpenseOpen, setIsAdminExpenseOpen] = useState(false);
    const [adminExpense, setAdminExpense] = useState({
        purpose: '',
        amount: '',
        fundId: '',
        billImage: null
    });
    const adminExpenseFileInputRef = useRef(null);

    // AI Analysis Handler
    const handleAnalyzeBill = async (file) => {
        if (!file) return;

        // Check for API Key
        let apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            const userKey = prompt("Enter Google Gemini API Key for Real AI?\n(Click Cancel to use Simulation Mode)");
            if (userKey) {
                apiKey = userKey;
                localStorage.setItem('gemini_api_key', apiKey);
            } else {
                console.log("User cancelled API Key, using Simulation.");
                apiKey = "SIMULATION"; // signal to service to use fallback
            }
        }

        setAnalyzing(true);
        try {
            const result = await import('../services/GeminiService').then(m => m.GeminiService.analyzeBill(file, apiKey));
            setAdminExpense(prev => ({
                ...prev,
                purpose: result.summary,
                amount: result.amount
            }));
            setBillSummary(result);
        } catch (error) {
            console.error("AI Error", error);
            alert("Failed to analyze bill. Check your API Key or Try again.");
            // Optional: Allow resetting key on error
            if (confirm("Analysis failed. Do you want to reset your stored API Key?")) {
                localStorage.removeItem('gemini_api_key');
            }
        } finally {
            setAnalyzing(false);
        }
    };

    // Helper to add a member row
    const addMemberRow = () => {
        setNewFamily({
            ...newFamily,
            members: [...newFamily.members, { name: '', age: '', dob: '', gender: 'Male', mobile: '', photo: null }]
        });
    };

    const removeMemberRow = (index) => {
        const updated = [...newFamily.members];
        updated.splice(index, 1);
        setNewFamily({ ...newFamily, members: updated });
    };

    const updateMemberRow = (index, field, value) => {
        const updated = [...newFamily.members];
        updated[index][field] = value;
        setNewFamily({ ...newFamily, members: updated });
    };

    const handlePhotoUpload = (e, index = -1) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            if (index === -1) {
                setNewFamily(prev => ({ ...prev, headPhoto: base64String }));
            } else {
                updateMemberRow(index, 'photo', base64String);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveFamily = (e) => {
        e.preventDefault();
        if (!newFamily.id || !newFamily.headName || !newFamily.headMobile) {
            alert("Please fill in required Head of Family details.");
            return;
        }

        // Validation
        if (newFamily.headAge >= 18 && !newFamily.headMobile) {
            alert("Head of Family is >= 18, so Mobile Number is required.");
            return;
        }

        const finalMembers = [
            {
                name: newFamily.headName,
                age: newFamily.headAge,
                dob: newFamily.headDob,
                gender: newFamily.headGender,
                mobile: newFamily.headMobile,
                photo: newFamily.headPhoto,
                role: 'Head'
            },
            ...newFamily.members
        ];

        // Members Validation
        for (let m of newFamily.members) {
            if (m.age >= 18 && !m.mobile) {
                alert(`Member ${m.name} is >= 18, so Mobile Number is required.`);
                return;
            }
        }

        const familyData = {
            id: newFamily.id,
            headName: newFamily.headName,
            members: finalMembers,
            memberCount: finalMembers.length
        };

        if (isEditing) {
            MockDB.updateFamily(familyData);
            AuditService.log('Admin', 'Update Family', { familyId: familyData.id });
            alert('Family Updated Successfully!');
        } else {
            if (MockDB.getFamilyById(newFamily.id)) {
                alert('Family ID already exists!');
                return;
            }
            MockDB.addFamily(familyData);
            AuditService.log('Admin', 'Create Family', { familyId: familyData.id });
            alert('Family Added Successfully!');
        }

        setFamilies(MockDB.getFamilies()); // Refresh
        setIsFamilyModalOpen(false);
        resetFamilyForm();
    };

    const handleDeleteFamily = (id) => {
        if (window.confirm(`Are you sure you want to delete family ${id}?`)) {
            MockDB.deleteFamily(id);
            setFamilies(MockDB.getFamilies());
        }
    };

    const handleEditFamily = (family) => {
        const head = family.members.find(m => m.role === 'Head') || family.members[0];
        const otherMembers = family.members.filter(m => m !== head);

        setNewFamily({
            id: family.id,
            headName: head.name,
            headAge: head.age,
            headGender: head.gender,
            headMobile: head.mobile || '',
            headPhoto: head.photo || null,
            members: otherMembers
        });
        setIsEditing(true);
        setIsManageFamiliesOpen(false); // Close list view
        setIsFamilyModalOpen(true); // Open edit form
    };

    const resetFamilyForm = () => {
        setNewFamily({ id: '', headName: '', headAge: '', headGender: 'Male', headMobile: '', headPhoto: null, members: [] });
        setIsEditing(false);
    };

    const generateNextId = () => {
        const count = families.length + 1;
        return `FAM${String(count).padStart(3, '0')}`;
    };

    const handleOpenAddFamily = () => {
        resetFamilyForm();
        setNewFamily({ ...newFamily, id: generateNextId() });
        setIsFamilyModalOpen(true);
    }

    const handleAddFund = (e) => {
        e.preventDefault();
        if (!newFund.name || !newFund.amount) return;

        const fundId = `FUND${Date.now().toString().slice(-6)}`;
        MockDB.addFund({
            id: fundId,
            title: newFund.name,
            amount: parseInt(newFund.amount),
            deadline: new Date().toISOString().split('T')[0],
            description: newFund.description,
            isPublic: newFund.isPublic,
            classification: newFund.classification,
            isMandatory: newFund.isMandatory, // Ensure mandatory status maps correctly
            frequency: newFund.frequency,
            priority: newFund.priority
        });

        AuditService.log('Admin', 'Create Fund', { name: newFund.name, amount: newFund.amount });

        let message = 'Fund Created Successfully!';

        // AUTO-GENERATE MONTHLY DUES
        if (newFund.classification === 'Monthly' || newFund.frequency === 'Monthly') {
            try {
                const currentYear = new Date().getFullYear();
                const res = MockDB.generateYearlyDues(fundId, currentYear);
                if (res.success) {
                    message += `\nAlso generated ${res.count} monthly dues for ${currentYear}.`;
                }
            } catch (err) {
                console.error("Auto-gen error:", err);
            }
        }

        setFunds(MockDB.getFunds());
        setIsFundModalOpen(false);
        setNewFund({ name: '', amount: '', description: '', isPublic: true, classification: 'General', deadline: '', isMandatory: false, priority: 'Normal', frequency: 'OneTime' });
        alert(message);
    };

    const filteredFamilies = families.filter(f =>
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.headName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '20px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>{t('dashboard')}</h1>
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}>{t('overview')}</p>
            </header>

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
                    onClick={() => setIsManageFundsOpen(true)}
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
                    onClick={handleOpenAddFamily}
                />
                <ActionButton
                    label={t('manageFamilies')}
                    icon={Users}
                    color="#8b5cf6"
                    onClick={() => setIsManageFamiliesOpen(true)}
                />
                <ActionButton
                    label={t('addFund')}
                    icon={Plus}
                    color="#10b981"
                    onClick={() => setIsFundModalOpen(true)}
                />
                <ActionButton
                    label={t('expenses')}
                    icon={FileText}
                    color="#f59e0b"
                    onClick={() => setActiveTab('expenses')}
                />

                <ActionButton
                    label={t('manageCashiers')}
                    icon={Users}
                    color="#06b6d4"
                    onClick={() => setIsCashierModalOpen(true)}
                />
                <ActionButton
                    label={t('announcements')}
                    icon={Bell}
                    color="#8b5cf6"
                    onClick={() => setActiveTab('announcements')}
                />

                <ActionButton
                    label={t('reports')}
                    icon={Clock}
                    color="#8b5cf6"
                    onClick={() => setActiveTab('transactions')}
                />
                <ActionButton
                    label={t('recordExpense')}
                    icon={Camera}
                    color="#ec4899"
                    onClick={() => setIsAdminExpenseOpen(true)}
                />
            </div>

            {/* Manage Families Modal */}
            <Modal
                isOpen={isManageFamiliesOpen}
                onClose={() => setIsManageFamiliesOpen(false)}
                title="Manage Families"
            >
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Input
                        placeholder="Search by ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', flex: 1 }}
                            onChange={(e) => setFamilySort(e.target.value)}
                        >
                            <option value="ID">Sort by ID</option>
                            <option value="HIGH_DUE">Highest Pending Dues</option>
                            <option value="LOW_DUE">Lowest Pending Dues</option>
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', cursor: 'pointer' }}>
                            <input type="checkbox" onChange={(e) => setLowComplianceFilter(e.target.checked)} />
                            <span>&lt; 50% Paid</span>
                        </label>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {(() => {
                        // Advanced Sort/Filter Logic
                        let list = MockDB.getAllFamiliesFinancialSummary();

                        // 1. Search
                        list = list.filter(f =>
                            f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.headName.toLowerCase().includes(searchTerm.toLowerCase())
                        );

                        // 2. Filter Low Compliance
                        if (lowComplianceFilter) {
                            list = list.filter(f => f.financials.complianceRate < 50);
                        }

                        // 3. Sort
                        list.sort((a, b) => {
                            if (familySort === 'HIGH_DUE') return b.financials.totalPending - a.financials.totalPending;
                            if (familySort === 'LOW_DUE') return a.financials.totalPending - b.financials.totalPending;
                            return a.id.localeCompare(b.id);
                        });

                        if (list.length === 0) return <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No families found matching criteria</div>;

                        return list.map(family => (
                            <div key={family.id} style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {/* Avatar */}
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {family.members[0]?.photo ? (
                                            <img src={family.members[0].photo} alt="Head" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <Users size={20} color="#6366f1" />
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{family.headName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{family.id} • {family.members.length} Members</div>
                                        {/* Financial Badge */}
                                        <div style={{ fontSize: '0.75rem', marginTop: '2px', color: family.financials.totalPending > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                                            {family.financials.totalPending > 0 ? `Pending: ₹${family.financials.totalPending}` : 'Fully Paid'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEditFamily(family)}
                                        style={{ padding: '8px', borderRadius: '8px', background: '#e0e7ff', color: '#6366f1', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteFamily(family.id)}
                                        style={{ padding: '8px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </Modal>

            {/* Cashier Management Modal */}
            <Modal
                isOpen={isCashierModalOpen}
                onClose={() => setIsCashierModalOpen(false)}
                title="Manage Cashiers"
            >
                <form onSubmit={handleAddCashier} style={{ marginBottom: '24px', background: '#ecfeff', padding: '16px', borderRadius: '12px', border: '1px solid #cffafe' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#0e7490' }}>Add New Cashier</h4>
                    <Input
                        placeholder="Name"
                        value={newCashier.name}
                        onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Input
                            placeholder="Mobile"
                            value={newCashier.mobile}
                            onChange={(e) => setNewCashier({ ...newCashier, mobile: e.target.value })}
                        />
                        <Input
                            placeholder="Set PIN"
                            maxLength={4}
                            value={newCashier.pin}
                            onChange={(e) => setNewCashier({ ...newCashier, pin: e.target.value })}
                        />
                    </div>
                    <Button type="submit" variant="primary" fullWidth>Add Cashier</Button>
                </form>

                <h4 style={{ marginBottom: '12px' }}>Existing Cashiers</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cashiers.map(c => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>ID: {c.id} • Mobile: {c.mobile}</div>
                            </div>
                            <button
                                onClick={() => handleDeleteCashier(c.id)}
                                style={{ background: '#fee2e2', border: 'none', color: '#ef4444', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {cashiers.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af' }}>No cashiers added.</div>}
                </div>
            </Modal>

            {/* Add/Edit Family Modal */}
            <Modal
                isOpen={isFamilyModalOpen}
                onClose={() => setIsFamilyModalOpen(false)}
                title={isEditing ? "Edit Family" : t('addFamily')}
            >
                <form onSubmit={handleSaveFamily}>
                    <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Head of Family</h4>

                        {/* Head Photo Upload */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div
                                onClick={() => headFileInputRef.current.click()}
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    background: '#e5e7eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: '2px dashed #9ca3af'
                                }}
                            >
                                {newFamily.headPhoto ? (
                                    <img src={newFamily.headPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Camera size={32} color="#6b7280" />
                                )}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.7rem', textAlign: 'center' }}>
                                    Upload
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={headFileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, -1)}
                            />
                        </div>

                        <Input
                            label="Family ID"
                            value={newFamily.id}
                            onChange={(e) => setNewFamily({ ...newFamily, id: e.target.value })}
                            placeholder="FAM00X"
                            readOnly={isEditing}
                        />
                        <Input
                            label="Name"
                            value={newFamily.headName}
                            onChange={(e) => setNewFamily({ ...newFamily, headName: e.target.value })}
                            placeholder="Name"
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Input
                                label="DOB"
                                type="date"
                                value={newFamily.headDob}
                                onChange={(e) => {
                                    // Auto calculate age
                                    const dob = new Date(e.target.value);
                                    const diff = Date.now() - dob.getTime();
                                    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
                                    setNewFamily({ ...newFamily, headDob: e.target.value, headAge: age });
                                }}
                                style={{ flex: 1 }}
                            />
                            <Input
                                label="Age"
                                type="number"
                                value={newFamily.headAge}
                                readOnly
                                placeholder="Calc"
                                style={{ width: '80px' }}
                            />
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Gender</label>
                                <select
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                                    value={newFamily.headGender}
                                    onChange={(e) => setNewFamily({ ...newFamily, headGender: e.target.value })}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                        <Input
                            label="Mobile (Required since Age >= 18)"
                            type="tel"
                            value={newFamily.headMobile}
                            onChange={(e) => setNewFamily({ ...newFamily, headMobile: e.target.value })}
                            placeholder="9876543210"
                            required={newFamily.headAge >= 18}
                            error={newFamily.headAge >= 18 && !newFamily.headMobile ? "Required" : ""}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0 }}>Family Members</h4>
                            <button type="button" onClick={addMemberRow} style={{ background: 'none', border: 'none', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                <Plus size={16} /> Add Member
                            </button>
                        </div>

                        {newFamily.members.map((member, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                {/* Member Photo Input */}
                                <label style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '8px',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    border: '1px solid #e5e7eb',
                                    flexShrink: 0
                                }}>
                                    {member.photo ? (
                                        <img src={member.photo} alt="M" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Camera size={16} color="#9ca3af" />
                                    )}
                                    <input
                                        type="file"
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        onChange={(e) => handlePhotoUpload(e, idx)}
                                    />
                                </label>

                                <input
                                    placeholder="Name"
                                    value={member.name}
                                    onChange={(e) => updateMemberRow(idx, 'name', e.target.value)}
                                    style={{ flex: 2, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', width: '120px' }}>
                                    <input
                                        type="date"
                                        value={member.dob}
                                        onChange={(e) => {
                                            const dob = new Date(e.target.value);
                                            const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
                                            updateMemberRow(idx, 'dob', e.target.value);
                                            updateMemberRow(idx, 'age', age);
                                        }}
                                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '4px' }}
                                    />
                                    <input
                                        placeholder="Age"
                                        value={member.age}
                                        readOnly
                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #eee', background: '#f9fafb', fontSize: '0.8rem' }}
                                    />
                                </div>

                                <select
                                    value={member.gender}
                                    onChange={(e) => updateMemberRow(idx, 'gender', e.target.value)}
                                    style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                >
                                    <option value="Male">M</option>
                                    <option value="Female">F</option>
                                </select>

                                {/* Conditional Mobile Input */}
                                {member.age >= 18 && (
                                    <input
                                        placeholder="Mobile*"
                                        value={member.mobile || ''}
                                        onChange={(e) => updateMemberRow(idx, 'mobile', e.target.value)}
                                        style={{ width: '100px', padding: '10px', border: '1px solid orange', borderRadius: '8px' }}
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeMemberRow(idx)}
                                    style={{ padding: '10px', background: '#fee2e2', border: 'none', borderRadius: '8px', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {newFamily.members.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' }}>No other members added</div>
                        )}
                    </div>

                    <Button type="submit" fullWidth variant="primary">
                        {isEditing ? "Update Family" : "Save Family"}
                    </Button>
                </form>
            </Modal>

            {/* Fund Status Report Modal */}
            <Modal
                isOpen={!!viewingFundReport}
                onClose={() => setViewingFundReport(null)}
                title={viewingFundReport ? `Report: ${viewingFundReport.title}` : 'Fund Report'}
            >
                {viewingFundReport && (() => {
                    const report = MockDB.getFundComplianceReport(viewingFundReport.id);
                    const list = reportFilter === 'all' ? report.all :
                        reportFilter === 'paid' ? report.paid :
                            report.unpaid; // Default/Unpaid

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Summary Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{report.all.length}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#60a5fa' }}>Total Families</div>
                                </div>
                                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>{report.paid.length}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#4ade80' }}>Paid</div>
                                </div>
                                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{report.unpaid.length}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#f87171' }}>Unpaid</div>
                                </div>
                            </div>

                            {/* Filters */}
                            <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '8px' }}>
                                {['unpaid', 'paid', 'all'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setReportFilter(filter)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            background: reportFilter === filter ? 'white' : 'transparent',
                                            color: reportFilter === filter ? 'black' : '#6b7280',
                                            boxShadow: reportFilter === filter ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                            textTransform: 'capitalize',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {/* List */}
                            <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {list.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>No families in this category</div>
                                ) : (
                                    list.map(item => (
                                        <div key={item.familyId} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{item.headName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.familyId}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontWeight: 'bold',
                                                    color: item.status === 'Paid' ? '#10b981' : item.status === 'Partial' ? '#f59e0b' : '#ef4444'
                                                }}>
                                                    {item.status}
                                                </div>
                                                {item.status !== 'Paid' && (
                                                    <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Due: ₹{item.pendingAmount}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            {/* Manage Funds Modal */}
            <Modal
                isOpen={isManageFundsOpen}
                onClose={() => setIsManageFundsOpen(false)}
                title="Manage Funds"
            >
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => { setIsManageFundsOpen(false); setIsFundModalOpen(true); }} variant="primary" icon={Plus}>
                        Create New Fund
                    </Button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {/* Show only Parent/Standard Funds, hide generated sub-funds initially */}
                    {funds.filter(f => !f.groupId).map(fund => {
                        const generatedMonths = funds.filter(f => f.groupId === fund.id).sort((a, b) => a.monthIndex - b.monthIndex);
                        console.log(`Fund ${fund.title} has ${generatedMonths.length} sub-funds`); // Console Debug

                        return (
                            <div key={fund.id} style={{
                                padding: '16px',
                                borderRadius: '16px',
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{fund.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                            <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px' }}>{fund.id}</span>
                                            <span style={{ background: '#d1fae5', color: '#047857', padding: '2px 8px', borderRadius: '4px' }}>{fund.classification || 'General'}</span>
                                            <span>•</span>
                                            <span>₹{fund.amount}</span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>{fund.description || 'No description'}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                const newTitle = prompt("Edit Fund Name:", fund.title);
                                                if (newTitle) {
                                                    const newAmt = prompt("Edit Default Amount (₹):", fund.amount);
                                                    if (newAmt && !isNaN(newAmt)) {
                                                        const newDesc = prompt("Edit Description:", fund.description);
                                                        MockDB.updateFund({ ...fund, title: newTitle, amount: parseInt(newAmt), description: newDesc || '' });
                                                        setFunds(MockDB.getFunds());
                                                    }
                                                }
                                            }}
                                            style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#f3f4f6', color: '#374151' }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setViewingFundReport(fund)}
                                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                        >
                                            View Report
                                        </Button>
                                        {fund.classification === 'Monthly' && (
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    const year = prompt("Enter Year to Generate Dues for (e.g. 2024):", new Date().getFullYear());
                                                    if (year) {
                                                        try {
                                                            const res = MockDB.generateYearlyDues(fund.id, year);
                                                            if (res.success) {
                                                                alert(`Successfully generated ${res.count} monthly dues for ${year}.`);
                                                                setFunds(MockDB.getFunds()); // Refresh
                                                            } else {
                                                                alert(res.message);
                                                            }
                                                        } catch (err) {
                                                            alert(err.message);
                                                        }
                                                    }
                                                }}
                                                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                            >
                                                Generate {new Date().getFullYear()}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Generated Months List */}
                                {generatedMonths.length > 0 && (
                                    <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>Monthly Breakdown ({generatedMonths[0].year})</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                                            {generatedMonths.map(monthFund => (
                                                <div key={monthFund.id} style={{ background: 'white', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                                                    <div style={{ fontWeight: '500', marginBottom: '4px', fontSize: '0.85rem' }}>{monthFund.title.replace('Monthly Fund - ', '')}</div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: '#059669', fontWeight: 'bold' }}>₹{monthFund.amount}</span>
                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                            {/* View Monthly Status */}
                                                            <button
                                                                onClick={() => setViewingFundReport(monthFund)}
                                                                title="View Status"
                                                                style={{ border: 'none', background: '#e0e7ff', color: '#4338ca', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                            >
                                                                <FileText size={14} />
                                                            </button>
                                                            {/* Edit Amount */}
                                                            <button
                                                                onClick={() => {
                                                                    const newAmt = prompt(`Update amount for ${monthFund.title}:`, monthFund.amount);
                                                                    if (newAmt && !isNaN(newAmt)) {
                                                                        MockDB.updateFund({ ...monthFund, amount: parseInt(newAmt) });
                                                                        setFunds(MockDB.getFunds());
                                                                    }
                                                                }}
                                                                title="Edit Amount"
                                                                style={{ border: 'none', background: '#fce7f3', color: '#db2777', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {funds.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af' }}>No funds created yet.</div>}
                </div>
            </Modal>

            {/* Add Fund Modal */}
            <Modal
                isOpen={isFundModalOpen}
                onClose={() => setIsFundModalOpen(false)}
                title={t('addFund')}
            >
                <form onSubmit={handleAddFund}>
                    <Input
                        label="Fund Name"
                        value={newFund.name}
                        onChange={(e) => setNewFund({ ...newFund, name: e.target.value })}
                        placeholder="Temple Festival"
                    />
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Classification</label>
                        <select
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff' }}
                            value={newFund.classification}
                            onChange={(e) => setNewFund({ ...newFund, classification: e.target.value })}
                        >
                            <option value="General">General</option>
                            <option value="Death Fund">Death Fund</option>
                            <option value="Festive Fund">Festive Fund</option>
                            <option value="Monthly Fund">Monthly Fund</option>
                            <option value="Development">Development</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <Input
                        label="Amount per Family (₹)"
                        type="number"
                        value={newFund.amount}
                        onChange={(e) => setNewFund({ ...newFund, amount: e.target.value })}
                        placeholder="500"
                    />
                    <Input
                        label="Description"
                        value={newFund.description}
                        onChange={(e) => setNewFund({ ...newFund, description: e.target.value })}
                        placeholder="Optional description"
                    />

                    {/* Patched: Added fields for detailed fund creation */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Priority</label>
                            <select
                                value={newFund.priority}
                                onChange={(e) => setNewFund({ ...newFund, priority: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                            >
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Frequency</label>
                            <select
                                value={newFund.frequency}
                                onChange={(e) => setNewFund({ ...newFund, frequency: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                            >
                                <option value="OneTime">One Time</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Deadline"
                        type="date"
                        value={newFund.deadline}
                        onChange={(e) => setNewFund({ ...newFund, deadline: e.target.value })}
                    />

                    <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={newFund.isPublic}
                                onChange={(e) => setNewFund({ ...newFund, isPublic: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            Publicly Visible
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={newFund.isMandatory}
                                onChange={(e) => setNewFund({ ...newFund, isMandatory: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            Mandatory Payment
                        </label>
                    </div>

                    <Button type="submit" fullWidth variant="primary">Create Fund</Button>
                </form>
            </Modal>

            {/* Admin Expense Modal */}
            <Modal
                isOpen={isAdminExpenseOpen}
                onClose={() => setIsAdminExpenseOpen(false)}
                title="Record Direct Expense"
            >
                <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #a7f3d0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={20} /> AI Bill Scanner
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div
                            onClick={() => adminExpenseFileInputRef.current.click()}
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: '2px dashed #059669',
                                borderRadius: '12px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'white',
                                color: '#059669',
                                fontWeight: '500'
                            }}
                        >
                            {analyzing ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div className="spinner" style={{ width: 16, height: 16, border: '2px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    Analyzing...
                                </span>
                            ) : (
                                "Upload Bill / Receipt"
                            )}
                        </div>
                        <input
                            type="file"
                            ref={adminExpenseFileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => handleAnalyzeBill(e.target.files[0])}
                        />
                    </div>
                    {billSummary && (
                        <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>
                            <div style={{ fontWeight: 'bold', color: '#047857' }}>AI Analysis:</div>
                            <div>{billSummary.summary}</div>
                            <div style={{ fontWeight: 'bold' }}>Amount: ₹{billSummary.amount}</div>
                        </div>
                    )}
                </div>

                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Fund</label>
                        <select
                            value={adminExpense.fundId}
                            onChange={(e) => setAdminExpense({ ...adminExpense, fundId: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                        >
                            <option value="">Select Fund...</option>
                            {funds.map(f => (
                                <option key={f.id} value={f.id}>{f.title || f.name || 'Untitled'}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Purpose / Description"
                        value={adminExpense.purpose}
                        onChange={(e) => setAdminExpense({ ...adminExpense, purpose: e.target.value })}
                        placeholder="e.g. Bought 5 bags of cement"
                    />

                    <Input
                        label="Amount (₹)"
                        type="number"
                        value={adminExpense.amount}
                        onChange={(e) => setAdminExpense({ ...adminExpense, amount: e.target.value })}
                        placeholder="0.00"
                    />

                    <Button
                        fullWidth
                        variant="primary"
                        onClick={() => {
                            if (!adminExpense.fundId || !adminExpense.amount || !adminExpense.purpose) {
                                alert("Please fill all fields");
                                return;
                            }
                            MockDB.addExpense({
                                ...adminExpense,
                                cashierId: 'Admin (Direct)',
                                status: 'Approved' // Auto-approve admin expenses
                            });
                            AuditService.log('Admin', 'Direct Expense Record', { amount: adminExpense.amount, fund: adminExpense.fundId });
                            setIsAdminExpenseOpen(false);
                            setAdminExpense({ purpose: '', amount: '', fundId: '', billImage: null });
                            setBillSummary(null);
                            alert("Expense Recorded Successfully!");
                        }}
                    >
                        Save Record
                    </Button>
                </div>
            </Modal>
            {/* Create Announcement Modal */}
            <Modal
                isOpen={isAnnouncementModalOpen}
                onClose={() => setIsAnnouncementModalOpen(false)}
                title="Create Public Announcement"
            >
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Title</label>
                        <Input
                            value={newAnnouncement.title}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                            placeholder="e.g. Health Camp on Sunday"
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Message</label>
                        <textarea
                            value={newAnnouncement.message}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid #e5e7eb',
                                minHeight: '100px',
                                fontFamily: 'inherit'
                            }}
                            placeholder="Enter the detailed announcement here..."
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Priority</label>
                        <select
                            value={newAnnouncement.priority}
                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                        >
                            <option value="Normal">Normal</option>
                            <option value="High">High (Urgent)</option>
                        </select>
                    </div>
                    <Button
                        fullWidth
                        variant="primary"
                        onClick={() => {
                            if (!newAnnouncement.title || !newAnnouncement.message) {
                                alert('Please fill in required fields');
                                return;
                            }
                            MockDB.addAnnouncement(newAnnouncement);
                            setAnnouncements(MockDB.getAnnouncements());
                            setIsAnnouncementModalOpen(false);
                            setNewAnnouncement({ title: '', message: '', priority: 'Normal' });
                            AuditService.log('Admin', 'Post Announcement', { title: newAnnouncement.title });
                        }}
                    >
                        Post Announcement
                    </Button>
                </div>
            </Modal>



            {/* TAB CONTENT (Patched with Safe Rendering) */}
            {
                activeTab === 'expenses' && (
                    <div className="animate-fade-in" style={{ marginTop: '32px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Expense Management</h2>
                        <b style={{ color: '#6b7280', fontSize: '0.9rem', display: 'block', marginBottom: '16px' }}>
                            Toggle "Public" to make expenses visible to all villagers.
                        </b>
                        <Button variant="secondary" onClick={() => setActiveTab('overview')} style={{ marginBottom: '16px' }}>&larr; Back to Overview</Button>

                        {MockDB.getExpenses().length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: 'white', borderRadius: '16px' }}>
                                <CheckCircle size={48} style={{ marginBottom: '16px', color: '#10b981' }} />
                                <div>No Expense Records</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {MockDB.getExpenses().slice().reverse().map(expense => {
                                    const fund = MockDB.getFunds().find(f => f.id === expense.fundId);

                                    return (
                                        <div key={expense.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1f2937' }}>{expense.purpose}</div>
                                                    <div style={{ color: '#6b7280' }}>
                                                        {/* Patched: Safe fund title */}
                                                        Fund: <span style={{ fontWeight: '500', color: '#4f46e5' }}>{fund ? (fund.title || fund.name || expense.fundId) : expense.fundId}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>
                                                        Request by: {expense.cashierId} • {new Date(expense.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>₹{expense.amount}</div>

                                                    {/* Public Toggle */}
                                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            MockDB.updateExpenseVisibility(expense.id, !expense.isPublic);
                                                            setRefresh(!refresh);
                                                            AuditService.log('Admin', 'Toggle Expense Visibility', { expenseId: expense.id, isPublic: !expense.isPublic });
                                                        }}>
                                                        <span style={{ fontSize: '0.9rem', color: expense.isPublic ? '#10b981' : '#6b7280', fontWeight: 'bold' }}>
                                                            {expense.isPublic ? 'Public' : 'Private'}
                                                        </span>
                                                        <div style={{
                                                            width: '36px',
                                                            height: '20px',
                                                            background: expense.isPublic ? '#10b981' : '#e5e7eb',
                                                            borderRadius: '20px',
                                                            position: 'relative',
                                                            transition: 'background 0.3s'
                                                        }}>
                                                            <div style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                background: 'white',
                                                                borderRadius: '50%',
                                                                position: 'absolute',
                                                                top: '2px',
                                                                left: expense.isPublic ? '18px' : '2px',
                                                                transition: 'left 0.3s',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                            }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {expense.billImage && (
                                                <div style={{ marginBottom: '16px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>Attached Bill:</div>
                                                    <img src={expense.billImage} alt="Bill" style={{ maxHeight: '150px', borderRadius: '8px' }} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
            }

            {/* ANNOUNCEMENTS TAB */}
            {
                activeTab === 'announcements' && (
                    <div className="animate-fade-in" style={{ marginTop: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>Village Announcements</h2>
                            <Button variant="primary" onClick={() => setIsAnnouncementModalOpen(true)}>
                                <Plus size={18} style={{ marginRight: '8px' }} /> New Announcement
                            </Button>
                        </div>
                        <Button variant="secondary" onClick={() => setActiveTab('overview')} style={{ marginBottom: '16px' }}>&larr; Back to Overview</Button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {announcements.map(ann => (
                                <div key={ann.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)', borderLeft: ann.priority === 'High' ? '4px solid #ef4444' : '4px solid #10b981' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {ann.title}
                                                {ann.priority === 'High' && <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px' }}>URGENT</span>}
                                            </div>
                                            <div style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>{ann.message}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '12px' }}>
                                                Posted: {new Date(ann.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this announcement?')) {
                                                    MockDB.deleteAnnouncement(ann.id);
                                                    setAnnouncements(MockDB.getAnnouncements());
                                                }
                                            }}
                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {announcements.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>No announcements posted yet.</div>
                            )}
                        </div>
                    </div>
                )
            }


            {/* TRANSACTIONS REPORT SECTION (Patched with Safe Rendering) */}
            {
                activeTab === 'transactions' && (
                    <div className="animate-fade-in" style={{ marginTop: '32px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Transaction Report</h2>
                        <Button variant="secondary" onClick={() => setActiveTab('overview')} style={{ marginBottom: '16px' }}>&larr; Back to Overview</Button>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {/* Fund Filter */}
                            <div style={{ flex: 1, minWidth: '200px', background: 'white', padding: '16px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Filter by Fund</label>
                                <select
                                    value={reportFundFilter}
                                    onChange={(e) => setReportFundFilter(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '1rem',
                                        background: '#f9fafb'
                                    }}
                                >
                                    <option value="ALL">All Funds</option>
                                    {funds.map(f => (
                                        <option key={f.id} value={f.id}>{f.title || f.name || 'Untitled'}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Family Filter */}
                            <div style={{ flex: 1, minWidth: '200px', background: 'white', padding: '16px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>Filter by Family</label>
                                <select
                                    value={reportFamilyFilter}
                                    onChange={(e) => setReportFamilyFilter(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '1rem',
                                        background: '#f9fafb'
                                    }}
                                >
                                    <option value="ALL">All Families</option>
                                    {families.map(f => (
                                        <option key={f.id} value={f.id}>{f.id} - {f.headName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Summary Card */}
                            <div style={{ flex: 1, background: 'var(--grad-primary)', padding: '16px', borderRadius: '16px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)' }}>
                                <div style={{ opacity: 0.9, fontSize: '0.9rem', marginBottom: '4px' }}>Total Collected</div>
                                <div style={{ fontSize: '2rem', fontWeight: '800' }}>₹{totalCollected.toLocaleString()}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    {reportFundFilter === 'ALL' ? 'Across all funds' : `For selected fund`}
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}>Collections</h3>
                                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    Showing {filteredTransactions.length} record(s)
                                </span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                                            <th style={{ padding: '12px' }}>Date & Time</th>
                                            <th style={{ padding: '12px' }}>Family ID</th>
                                            <th style={{ padding: '12px' }}>Fund</th>
                                            <th style={{ padding: '12px' }}>Amount</th>
                                            <th style={{ padding: '12px' }}>Cashier</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.slice().reverse().map((tx, idx) => {
                                            const fund = MockDB.getFunds().find(f => f.id === tx.fundId);
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Clock size={14} color="#6b7280" />
                                                            {new Date(tx.date).toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px', fontWeight: '500' }}>{tx.familyId}</td>
                                                    <td style={{ padding: '12px' }}>{fund ? (fund.title || fund.name || 'Unknown') : tx.fundId}</td>
                                                    <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>+ ₹{tx.amount}</td>
                                                    <td style={{ padding: '12px', color: '#6b7280' }}>Cashier</td>
                                                </tr>
                                            );
                                        })}
                                        {filteredTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No transactions found for this selection.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
export default AdminDashboard;
