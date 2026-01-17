import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MockDB } from '../../services/mockDatabase';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Users, UserPlus, Trash2, Edit, Camera, Plus, Wallet } from 'lucide-react';
import { AuditService } from '../../services/AuditService';

const AdminFamilies = () => {
    const location = useLocation();
    const [families, setFamilies] = useState(MockDB.getFamilies());
    const [searchTerm, setSearchTerm] = useState('');
    const [familySort, setFamilySort] = useState('ID');
    const [lowComplianceFilter, setLowComplianceFilter] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newFamily, setNewFamily] = useState({
        id: '',
        headName: '',
        headAge: '',
        headDob: '',
        headGender: 'Male',
        headMobile: '',
        headPhoto: null,
        members: []
    });

    const [selectedStatusFamily, setSelectedStatusFamily] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const handleViewStatus = (family) => {
        setSelectedStatusFamily(family);
        setIsStatusModalOpen(true);
    };

    const headFileInputRef = useRef(null);

    useEffect(() => {
        if (location.state?.openAdd) {
            handleOpenAddFamily();
            // Clear state so it doesn't reopen on refresh (optional, but good UX)
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const filteredFamilies = (() => {
        let list = MockDB.getAllFamiliesFinancialSummary();

        // 1. Search
        list = list.filter(f =>
            (f.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.headName || '').toLowerCase().includes(searchTerm.toLowerCase())
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

        return list;
    })();

    const generateNextId = () => {
        const count = families.length + 1;
        return `FAM${String(count).padStart(3, '0')}`;
    };

    const resetFamilyForm = () => {
        setNewFamily({ id: '', headName: '', headAge: '', headGender: 'Male', headMobile: '', headPhoto: null, members: [] });
        setIsEditing(false);
    };

    const handleOpenAddFamily = () => {
        resetFamilyForm();
        setNewFamily({ ...newFamily, id: generateNextId() });
        setIsFamilyModalOpen(true);
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
        setIsFamilyModalOpen(true);
    };

    const handleDeleteFamily = (id) => {
        if (window.confirm(`Are you sure you want to delete family ${id}?`)) {
            MockDB.deleteFamily(id);
            setFamilies(MockDB.getFamilies());
        }
    };

    // Helper functions for member rows
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
        // ... (Same validation logic as before) ...
        if (!newFamily.id || !newFamily.headName || !newFamily.headMobile) {
            alert("Please fill in required Head of Family details.");
            return;
        }
        if (newFamily.headAge >= 18 && !newFamily.headMobile) {
            alert("Head of Family is >= 18, so Mobile Number is required.");
            return;
        }
        if (newFamily.headMobile && newFamily.headMobile.length !== 10) {
            alert("Mobile Number must be exactly 10 digits.");
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

        for (let m of newFamily.members) {
            if (m.age >= 18 && !m.mobile) {
                alert(`Member ${m.name} is >= 18, so Mobile Number is required.`);
                return;
            }
            if (m.mobile && m.mobile.length !== 10) {
                alert(`Member ${m.name}'s Mobile Number must be exactly 10 digits.`);
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

        setFamilies(MockDB.getFamilies());
        setIsFamilyModalOpen(false);
        resetFamilyForm();
    };

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0 }}>Manage Families</h3>
                    <Button onClick={handleOpenAddFamily} variant="primary" icon={UserPlus}>
                        Add New Family
                    </Button>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Input
                        placeholder="Search by ID or Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}
                    />
                    <select
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', minWidth: '150px' }}
                        value={familySort}
                        onChange={(e) => setFamilySort(e.target.value)}
                    >
                        <option value="ID">Sort by ID</option>
                        <option value="HIGH_DUE">Highest Pending Due</option>
                        <option value="LOW_DUE">Lowest Pending Due</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <input type="checkbox" checked={lowComplianceFilter} onChange={(e) => setLowComplianceFilter(e.target.checked)} />
                        <span>Show &lt; 50% Paid</span>
                    </label>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                                {family.financials && (
                                    <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold', color: family.financials.totalPending > 0 ? '#ef4444' : '#10b981' }}>
                                        {family.financials.totalPending > 0 ? `Pending: ₹${family.financials.totalPending}` : 'Fully Paid'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => handleViewStatus(family)}
                                style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#047857', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                            >
                                <Wallet size={16} /> Fund Status
                            </button>
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
            </div>

            {/* Add/Edit Family Modal */}
            <Modal
                isOpen={isFamilyModalOpen}
                onClose={() => setIsFamilyModalOpen(false)}
                title={isEditing ? "Edit Family" : "Add Family"}
            >
                {/* ... (Existing Form Code) ... */}
                <form onSubmit={handleSaveFamily}>
                    <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>Head of Family</h4>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                            <div
                                onClick={() => headFileInputRef.current.click()}
                                style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ddd', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                {newFamily.headPhoto ? <img src={newFamily.headPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} />}
                            </div>
                            <input type="file" ref={headFileInputRef} hidden onChange={(e) => handlePhotoUpload(e, -1)} />
                            <div style={{ flex: 1 }}>
                                <Input label="Family ID" value={newFamily.id} onChange={(e) => setNewFamily({ ...newFamily, id: e.target.value })} readOnly={isEditing} />
                            </div>
                        </div>
                        <Input label="Name" value={newFamily.headName} onChange={(e) => setNewFamily({ ...newFamily, headName: e.target.value })} />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Input
                                type="date"
                                label="DOB"
                                value={newFamily.headDob}
                                max={new Date().toISOString().split('T')[0]} // Block future dates in picker
                                onChange={(e) => {
                                    const selectedDate = new Date(e.target.value);
                                    if (selectedDate > new Date()) {
                                        alert("DOB cannot be in the future!");
                                        return;
                                    }
                                    const age = Math.floor((Date.now() - selectedDate.getTime()) / 31557600000);
                                    setNewFamily({ ...newFamily, headDob: e.target.value, headAge: age });
                                }}
                            />
                            <Input label="Age" value={newFamily.headAge} readOnly style={{ width: '60px' }} error={newFamily.headAge < 0 ? "Invalid" : ""} />
                        </div>
                        <Input label="Mobile" value={newFamily.headMobile} onChange={(e) => setNewFamily({ ...newFamily, headMobile: e.target.value })} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h4>Members</h4>
                            <Button type="button" onClick={addMemberRow} size="small">Add Member</Button>
                        </div>
                        {newFamily.members.map((m, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
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
                                    {m.photo ? (
                                        <img src={m.photo} alt="M" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Input
                                            placeholder="Name"
                                            value={m.name}
                                            onChange={(e) => updateMemberRow(idx, 'name', e.target.value)}
                                            style={{ marginBottom: 0 }}
                                        />
                                        <select
                                            value={m.gender}
                                            onChange={(e) => updateMemberRow(idx, 'gender', e.target.value)}
                                            style={{ width: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                        >
                                            <option value="Male">M</option>
                                            <option value="Female">F</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <input
                                                type="date"
                                                value={m.dob}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    const selectedDate = new Date(e.target.value);
                                                    if (selectedDate > new Date()) {
                                                        alert("DOB cannot be in the future!");
                                                        return;
                                                    }
                                                    const age = Math.floor((Date.now() - selectedDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
                                                    updateMemberRow(idx, 'dob', e.target.value);
                                                    updateMemberRow(idx, 'age', age);
                                                }}
                                                style={{ padding: '10px', borderRadius: '8px', border: m.age < 0 ? '2px solid red' : '1px solid #e5e7eb', width: '100%' }}
                                            />
                                        </div>
                                        <input
                                            placeholder="Age"
                                            value={m.age}
                                            readOnly
                                            style={{ width: '60px', padding: '10px', borderRadius: '8px', border: '1px solid #eee', background: '#f9fafb' }}
                                        />
                                    </div>
                                    {m.age >= 18 && (
                                        <input
                                            placeholder="Mobile (Required for Adults)"
                                            value={m.mobile || ''}
                                            onChange={(e) => updateMemberRow(idx, 'mobile', e.target.value)}
                                            style={{ padding: '10px', border: '1px solid orange', borderRadius: '8px', width: '100%' }}
                                        />
                                    )}
                                </div>

                                <button type="button" onClick={() => removeMemberRow(idx)} style={{ color: '#ef4444', border: 'none', background: 'none', padding: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <Button type="submit" fullWidth variant="primary">Save Family</Button>
                </form>
            </Modal>

            <FamilyStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                family={selectedStatusFamily}
            />
        </div>
    );
};

const FamilyStatusModal = ({ isOpen, onClose, family }) => {
    const [fundSearch, setFundSearch] = useState('');

    useEffect(() => {
        if (isOpen) setFundSearch('');
    }, [isOpen, family]);

    if (!family) return null;

    const allFunds = MockDB.getFunds();
    const familyTx = MockDB.getTransactions().filter(t => t.familyId === family.id);

    // Filter out Parent Monthly Funds (Templates) to avoid duplicates, only show specific months
    const displayFunds = allFunds.filter(f => !(f.classification === 'Monthly' && !f.groupId));

    // Sort funds: Death Funds first, then others
    const sortedFunds = [...displayFunds].sort((a, b) => {
        if (a.classification === 'Death Fund' && b.classification !== 'Death Fund') return -1;
        if (a.classification !== 'Death Fund' && b.classification === 'Death Fund') return 1;
        return 0;
    });

    const filteredFunds = sortedFunds.filter(f =>
        (f.title || '').toLowerCase().includes(fundSearch.toLowerCase()) ||
        (f.id || '').toLowerCase().includes(fundSearch.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Status: ${family.headName}`}>
            <div style={{ marginBottom: '12px' }}>
                <Input
                    placeholder="Search Fund Name or ID..."
                    value={fundSearch}
                    onChange={(e) => setFundSearch(e.target.value)}
                    style={{ marginBottom: 0 }}
                />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredFunds.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No funds match your search.</div>
                ) : (
                    filteredFunds.map(fund => {
                        const myTx = familyTx.filter(t => t.fundId === fund.id);
                        const paidAmount = myTx.reduce((sum, t) => sum + parseInt(t.amount), 0);
                        const required = fund.amount || 0;
                        const isFullyPaid = paidAmount >= required;
                        const isPartiallyPaid = paidAmount > 0 && paidAmount < required;

                        let statusColor = '#ef4444'; // Red (Pending)
                        let statusText = 'Pending';
                        if (isFullyPaid) {
                            statusColor = '#10b981'; // Green (Fully Paid)
                            statusText = 'Paid';
                        } else if (isPartiallyPaid) {
                            statusColor = '#f59e0b'; // Amber (Partial)
                            statusText = 'Partial';
                        }

                        return (
                            <div key={fund.id} style={{ marginBottom: '12px', padding: '12px', borderRadius: '12px', border: `1px solid ${statusColor}40`, background: `${statusColor}10` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#374151' }}>{fund.title}</div>
                                    <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: statusColor, color: 'white' }}>{statusText}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.9rem', color: '#6b7280' }}>
                                    <span>Required: ₹{required}</span>
                                    <span>Paid: <b>₹{paidAmount}</b></span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Modal>
    );
};

export default AdminFamilies;
