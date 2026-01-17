import React, { useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MockDB } from '../services/mockDatabase';
import { AuditService } from '../services/AuditService';
import { Users, Wallet, FileText, Settings, ArrowUpRight, Plus, UserPlus, Trash2, Edit, Camera, Upload, Shield, CheckCircle, Clock, Bell } from 'lucide-react';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const StatWidget = ({ label, value, icon: Icon, color, gradient }) => (
    <div style={{
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
        justifyContent: 'space-between'
    }}>
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
        if (confirm("Remove this cashier access?")) {
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
        deadline: ''
    });

    // Reports Filter State
    const [reportFundFilter, setReportFundFilter] = useState('ALL');
    const [reportFamilyFilter, setReportFamilyFilter] = useState('ALL');

    // Announcement State
    const [announcements, setAnnouncements] = useState(MockDB.getAnnouncements());
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', priority: 'Normal' });

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

        MockDB.addFund({
            id: Date.now().toString(),
            title: newFund.name,
            amount: parseInt(newFund.amount),
            deadline: new Date().toISOString().split('T')[0],
            description: newFund.description,
            isPublic: newFund.isPublic
        });

        AuditService.log('Admin', 'Create Fund', { name: newFund.name, amount: newFund.amount });

        setFunds(MockDB.getFunds());
        setIsFundModalOpen(false);
        setNewFund({ name: '', amount: '', description: '' });
        alert('Fund Created Successfully!');
    };

    const filteredFamilies = families.filter(f =>
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.headName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '20px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Dashboard</h1>
                <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Overview of village activities</p>
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
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Quick Actions</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <ActionButton
                    label={t('addFamily')}
                    icon={UserPlus}
                    color="#6366f1"
                    onClick={handleOpenAddFamily}
                />
                <ActionButton
                    label="Manage Families"
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
                    label="Expenses"
                    icon={FileText}
                    color="#f59e0b"
                    onClick={() => setActiveTab('expenses')}
                />

                <ActionButton
                    label="Manage Cashiers"
                    icon={Users}
                    color="#06b6d4"
                    onClick={() => setIsCashierModalOpen(true)}
                />
                <ActionButton
                    label="Announcements"
                    icon={Bell}
                    color="#8b5cf6"
                    onClick={() => setActiveTab('announcements')}
                />

                <ActionButton
                    label="Reports"
                    icon={Clock}
                    color="#8b5cf6"
                    onClick={() => setActiveTab('transactions')}
                />
                <ActionButton
                    label="Record Exp."
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
                <div style={{ marginBottom: '16px' }}>
                    <Input
                        placeholder="Search by ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {filteredFamilies.map(family => (
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
                    ))}
                    {filteredFamilies.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No families found</div>
                    )}
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
                    <Input
                        label="Amount per Family (₹)"
                        type="number"
                        value={newFund.amount}
                        onChange={(e) => setNewFund({ ...newFund, amount: e.target.value })}
                        placeholder="500"
                    />

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
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
                        type="date"
                        label="Deadline / Due Date"
                        value={newFund.deadline}
                        onChange={(e) => setNewFund({ ...newFund, deadline: e.target.value })}
                    />

                    <Input
                        placeholder="Optional details..."
                        value={newFund.description}
                        onChange={(e) => setNewFund({ ...newFund, description: e.target.value })}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={newFund.isPublic}
                                onChange={(e) => setNewFund({ ...newFund, isPublic: e.target.checked })}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <span>Public (Visible on Updates)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={newFund.isMandatory}
                                onChange={(e) => setNewFund({ ...newFund, isMandatory: e.target.checked })}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <span style={{ fontWeight: newFund.isMandatory ? 'bold' : 'normal', color: newFund.isMandatory ? '#ef4444' : 'inherit' }}>Mandatory</span>
                        </label>
                    </div>


                    <Button type="submit" fullWidth variant="success" style={{ marginTop: '16px' }}>
                        Create Fund
                    </Button>
                </form>
            </Modal>

            {/* ANNOUNCEMENTS SECTION */}
            {
                activeTab === 'announcements' && (
                    <div className="animate-fade-in" style={{ marginTop: '32px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Village Announcements</h2>
                        <Button variant="secondary" onClick={() => setActiveTab('overview')} style={{ marginBottom: '16px' }}>&larr; Back to Overview</Button>

                        <div style={{ background: '#f5f3ff', padding: '20px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #ddd6fe' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px 0', color: '#7c3aed' }}>Public Notices</h3>
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Visible to all villagers and cashiers</p>
                                </div>
                                <Button onClick={() => setIsAnnouncementModalOpen(true)} style={{ background: '#8b5cf6' }}>
                                    + New Announcement
                                </Button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {announcements.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: 'white', borderRadius: '16px' }}>
                                    No active announcements.
                                </div>
                            ) : (
                                announcements.map(a => (
                                    <div key={a.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    {a.priority === 'High' && <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>URGENT</span>}
                                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{a.title}</h3>
                                                </div>
                                                <p style={{ margin: '0 0 12px 0', color: '#4b5563', lineHeight: '1.5' }}>{a.message}</p>
                                                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Posted: {new Date(a.date).toLocaleDateString()}</div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete this announcement?')) {
                                                        MockDB.deleteAnnouncement(a.id);
                                                        setAnnouncements(MockDB.getAnnouncements());
                                                    }
                                                }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '8px' }}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )
            }

            {/* EXPENSE APPROVALS SECTION */}
            {
                activeTab === 'expenses' && (
                    <div className="animate-fade-in" style={{ marginTop: '32px' }}>
                        <h2 style={{ marginBottom: '20px' }}>Expense Approvals</h2>
                        <Button variant="secondary" onClick={() => setActiveTab('overview')} style={{ marginBottom: '16px' }}>&larr; Back to Overview</Button>

                        {MockDB.getExpenses().filter(e => e.status === 'Pending').length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: 'white', borderRadius: '16px' }}>
                                <CheckCircle size={48} style={{ marginBottom: '16px', color: '#10b981' }} />
                                <div>No Pending Expenses</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {MockDB.getExpenses().filter(e => e.status === 'Pending').map(expense => {
                                    const fund = MockDB.getFunds().find(f => f.id === expense.fundId);
                                    const balanceInfo = MockDB.getFundBalance(expense.fundId);
                                    const isAffordable = balanceInfo.balance >= expense.amount;

                                    return (
                                        <div key={expense.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <div>
                                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1f2937' }}>{expense.purpose}</div>
                                                    <div style={{ color: '#6b7280' }}>
                                                        Fund: <span style={{ fontWeight: '500', color: '#4f46e5' }}>{fund ? (fund.title || fund.name || expense.fundId) : expense.fundId}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '4px' }}>
                                                        Request by: {expense.cashierId} • {new Date(expense.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>₹{expense.amount}</div>
                                                    <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '10px', background: isAffordable ? '#d1fae5' : '#fee2e2', color: isAffordable ? '#065f46' : '#991b1b', display: 'inline-block', marginTop: '4px' }}>
                                                        {isAffordable ? 'Funds Available' : 'Insufficient Funds'}
                                                    </div>
                                                </div>
                                            </div>

                                            {expense.billImage && (
                                                <div style={{ marginBottom: '16px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '8px' }}>Attached Bill:</div>
                                                    <img src={expense.billImage} alt="Bill" style={{ maxHeight: '150px', borderRadius: '8px' }} />
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => {
                                                        MockDB.updateExpenseStatus(expense.id, 'Rejected');
                                                        AuditService.log('Admin', 'Reject Expense', { expenseId: expense.id, amount: expense.amount });
                                                        setRefresh(!refresh);
                                                    }}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    style={{ background: isAffordable ? '#10b981' : '#9ca3af', cursor: isAffordable ? 'pointer' : 'not-allowed' }}
                                                    onClick={() => {
                                                        if (!isAffordable) {
                                                            alert(`Cannot Approve: Insufficient Balance (₹${balanceInfo.balance} available)`);
                                                            return;
                                                        }
                                                        MockDB.updateExpenseStatus(expense.id, 'Approved');
                                                        AuditService.log('Admin', 'Approve Expense', { expenseId: expense.id, amount: expense.amount });
                                                        setRefresh(!refresh);
                                                    }}
                                                >
                                                    Approve Expense
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )
            }

            {/* TRANSACTIONS REPORT SECTION */}
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
                                                    <td style={{ padding: '12px' }}>{fund ? (fund.title || fund.name || 'Unknown Fund') : tx.fundId}</td>
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

            {/* AUDIT LOGS SECTION */}
            {
                activeTab === 'audit' && (
                    <div className="animate-fade-in" style={{ marginTop: '32px' }}>
                        <h2 style={{ marginBottom: '20px' }}>System Audit Logs</h2>
                        <Button variant="secondary" onClick={() => setActiveTab('overview')} style={{ marginBottom: '16px' }}>&larr; Back to Overview</Button>
                        <div style={{ background: '#1f2937', color: '#10b981', padding: '20px', borderRadius: '16px', fontFamily: 'monospace', maxHeight: '500px', overflowY: 'auto' }}>
                            {MockDB.getAuditLogs().map(log => (
                                <div key={log.id} style={{ marginBottom: '8px', borderBottom: '1px solid #374151', paddingBottom: '8px' }}>
                                    <span style={{ color: '#6b7280' }}>[{new Date(log.timestamp).toLocaleString()}]</span>
                                    <span style={{ color: '#f59e0b', fontWeight: 'bold', margin: '0 8px' }}>{log.userRole.toUpperCase()}</span>
                                    <span style={{ color: '#e5e7eb' }}>{log.action}</span>
                                    {log.details && <div style={{ marginLeft: '20px', fontSize: '0.85rem', color: '#9ca3af' }}>{JSON.stringify(log.details)}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
            {/* Record Admin Expense Modal */}
            <Modal
                isOpen={isAdminExpenseOpen}
                onClose={() => setIsAdminExpenseOpen(false)}
                title="Record Direct Expense (Admin)"
            >
                <div>
                    {/* Bill Scan Section */}
                    <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ background: '#0284c7', padding: '8px', borderRadius: '50%', color: 'white' }}>
                                <Camera size={20} />
                            </div>
                            <h4 style={{ margin: 0, color: '#0369a1' }}>Smart Bill Scanner</h4>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={adminExpenseFileInputRef}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setAdminExpense({ ...adminExpense, billImage: reader.result });
                                    reader.readAsDataURL(file);
                                    handleAnalyzeBill(file);
                                }
                            }}
                        />
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => adminExpenseFileInputRef.current.click()}
                            disabled={analyzing}
                        >
                            {analyzing ? (
                                <span className="animate-pulse">✨ Analyzing with Gemini AI...</span>
                            ) : (
                                "📸 Upload Bill & Analyze"
                            )}
                        </Button>
                        {billSummary && (
                            <div className="animate-fade-in" style={{ marginTop: '12px', fontSize: '0.9rem', color: '#0369a1', background: 'white', padding: '10px', borderRadius: '8px' }}>
                                <strong>AI Summary:</strong> {billSummary.summary}
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Fund</label>
                        <select
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                            value={adminExpense.fundId}
                            onChange={(e) => setAdminExpense({ ...adminExpense, fundId: e.target.value })}
                        >
                            <option value="">-- Select Fund --</option>
                            {funds.map(f => (
                                <option key={f.id} value={f.id}>{f.title} (Bal: ₹{MockDB.getFundBalance(f.id).balance})</option>
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
        </div >
    );
};
export default AdminDashboard;
