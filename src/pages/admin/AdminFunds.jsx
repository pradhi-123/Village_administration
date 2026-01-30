import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MockDB } from '../../services/mockDatabase';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Plus, Wallet, Shield, Edit, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditService } from '../../services/AuditService';

const AdminFunds = () => {
    const location = useLocation();

    // Defensive initialization
    const getSafeFunds = () => {
        try {
            const data = MockDB.getFunds();
            return Array.isArray(data) ? data.filter(f => f && typeof f === 'object') : [];
        } catch (e) {
            console.error("Failed to load funds", e);
            return [];
        }
    };

    const [funds, setFunds] = useState(getSafeFunds());
    const [searchTerm, setSearchTerm] = useState('');
    const [isFundModalOpen, setIsFundModalOpen] = useState(false);
    const [reportSearch, setReportSearch] = useState('');

    const [families, setFamilies] = useState([]);

    useEffect(() => {
        try {
            const loadedFamilies = MockDB.getFamilies();
            setFamilies(Array.isArray(loadedFamilies) ? loadedFamilies : []);
        } catch (e) {
            console.error("Failed to load families", e);
        }

        if (location.state?.openAdd) {
            setIsFundModalOpen(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const filteredFunds = funds.filter(f =>
        f && (
            (f.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.title || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const [newFund, setNewFund] = useState({
        name: '',
        amount: '',
        description: '',
        isPublic: true,
        isMandatory: false,
        priority: 'Normal',
        frequency: 'OneTime',
        deadline: '',
        classification: 'General',
        affectedFamilyId: ''
    });

    const [editingId, setEditingId] = useState(null);

    const handleAddFund = (e) => {
        e.preventDefault();
        if (!newFund.name || !newFund.amount) return;

        if (newFund.classification === 'Death Fund' && !newFund.affectedFamilyId) {
            alert("Please select the Affected Family for Death Fund.");
            return;
        }

        try {
            if (editingId) {
                const original = funds.find(f => f.id === editingId);
                if (original) {
                    MockDB.updateFund({
                        ...original,
                        title: newFund.name,
                        amount: parseInt(newFund.amount) || 0,
                        description: newFund.description || '',
                        isPublic: newFund.isPublic,
                        classification: newFund.classification,
                        affectedFamilyId: newFund.classification === 'Death Fund' ? newFund.affectedFamilyId : null,
                        priority: newFund.priority,
                        frequency: newFund.frequency
                    });
                    alert('Fund Updated Successfully!');
                }
            } else {
                MockDB.addFund({
                    id: `FUND${Date.now().toString().slice(-6)}`,
                    title: newFund.name,
                    amount: parseInt(newFund.amount) || 0,
                    deadline: new Date().toISOString().split('T')[0],
                    description: newFund.description || '',
                    isPublic: newFund.isPublic,
                    classification: newFund.classification,
                    affectedFamilyId: newFund.classification === 'Death Fund' ? newFund.affectedFamilyId : null
                });
                alert('Fund Created Successfully!');
            }

            AuditService.log('Admin', editingId ? 'Update Fund' : 'Create Fund', { name: newFund.name, amount: newFund.amount });
            setFunds(getSafeFunds());
            setIsFundModalOpen(false);
            setEditingId(null);
            setNewFund({ name: '', amount: '', description: '', isPublic: true, classification: 'General', deadline: '', affectedFamilyId: '' });
        } catch (err) {
            console.error("Error saving fund:", err);
            alert("Failed to save fund. Please check data.");
        }
    };

    const handleEditClick = (fund) => {
        if (!fund) return;
        setNewFund({
            name: fund.title || '',
            amount: fund.amount || 0,
            description: fund.description || '',
            isPublic: fund.isPublic ?? true,
            classification: fund.classification || 'General',
            affectedFamilyId: fund.affectedFamilyId || '',
            priority: fund.priority || 'Normal',
            frequency: fund.frequency || 'OneTime'
        });
        setEditingId(fund.id);
        setIsFundModalOpen(true);
    };


    const [selectedReportFund, setSelectedReportFund] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportTab, setReportTab] = useState('paid'); // 'paid' or 'pending'

    const handleViewReport = (fund) => {
        setSelectedReportFund(fund);
        setReportTab('paid');
        setIsReportModalOpen(true);
    };

    const getFundReportData = () => {
        if (!selectedReportFund || !selectedReportFund.id) return { paid: [], partial: [], unpaid: [] };

        try {
            const allFamilies = MockDB.getFamilies();
            const familiesSafe = Array.isArray(allFamilies) ? allFamilies : [];

            const transactions = MockDB.getTransactions();
            const allTransactions = Array.isArray(transactions) ? transactions.filter(t => t.fundId === selectedReportFund.id) : [];

            const paidList = [];
            const partialList = [];
            const unpaidList = [];

            familiesSafe.forEach(family => {
                if (!family || !family.id) return;

                // Calculate total paid by this family for this fund
                const familyTx = allTransactions.filter(t => t.familyId === family.id);
                const paidAmount = familyTx.reduce((sum, t) => sum + (parseInt(t.amount) || 0), 0);
                const requiredAmount = parseInt(selectedReportFund.amount) || 0;

                const data = {
                    ...family,
                    paidAmount,
                    requiredAmount,
                    remaining: Math.max(0, requiredAmount - paidAmount),
                    lastPaid: familyTx.length > 0 ? familyTx[familyTx.length - 1]?.date : null
                };

                if (paidAmount >= requiredAmount && requiredAmount > 0) {
                    paidList.push(data);
                } else if (paidAmount > 0) {
                    partialList.push(data);
                } else {
                    unpaidList.push(data);
                }
            });

            return { paid: paidList, partial: partialList, unpaid: unpaidList };
        } catch (e) {
            console.error("Error generating report data", e);
            return { paid: [], partial: [], unpaid: [] };
        }
    };

    const reportData = getFundReportData();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3>Manage Funds</h3>
                <Button
                    onClick={() => {
                        setEditingId(null);
                        setNewFund({ name: '', amount: '', description: '', isPublic: true, classification: 'General', deadline: '', affectedFamilyId: '' });
                        setIsFundModalOpen(true);
                    }}
                    variant="primary"
                    icon={Plus}
                >
                    Create New Fund
                </Button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '16px' }}>
                <Input
                    placeholder="Search Fund by ID or Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {filteredFunds.filter(f => f && !f.groupId).map(fund => {
                    // Safe access to generated months
                    if (!fund || !fund.id) return null;
                    const generatedMonths = funds.filter(f => f && f.groupId === fund.id)
                        .sort((a, b) => (a.monthIndex ?? 0) - (b.monthIndex ?? 0));

                    return (
                        <div key={fund.id} style={{
                            padding: '16px',
                            borderRadius: '16px',
                            background: 'white',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1f2937' }}>{fund.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                        <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px' }}>{fund.id}</span>
                                        <span style={{ background: '#d1fae5', color: '#047857', padding: '2px 8px', borderRadius: '4px' }}>{fund.classification || 'General'}</span>
                                    </div>
                                </div>
                                {generatedMonths.length === 0 && (
                                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>₹{fund.amount}</div>
                                )}
                            </div>

                            <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>{fund.description || 'No description'}</div>

                            {/* Actions Row */}
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <Button
                                    size="small"
                                    variant="secondary"
                                    onClick={() => handleEditClick(fund)}
                                    icon={Edit}
                                    style={{ padding: '8px 16px', minHeight: '40px', fontSize: '0.9rem' }}
                                >
                                    Edit
                                </Button>
                                {generatedMonths.length === 0 && (
                                    <Button
                                        size="small"
                                        variant="secondary"
                                        onClick={() => handleViewReport(fund)}
                                        style={{ padding: '8px 16px', minHeight: '40px', fontSize: '0.9rem' }}
                                    >
                                        View Report
                                    </Button>
                                )}
                            </div>

                            {/* Monthly Breakdown */}
                            {generatedMonths.length > 0 && (
                                <div style={{ marginTop: '12px', background: '#f9fafb', padding: '8px', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#4b5563' }}>Monthly Breakdown</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {generatedMonths.map(m => (
                                            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', background: 'white', padding: '6px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                <span>{(m.title || '').replace('Monthly Fund - ', '')}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold', color: '#059669' }}>₹{m.amount}</span>
                                                    <button
                                                        onClick={() => handleEditClick(m)}
                                                        style={{ border: 'none', background: '#fce7f3', color: '#db2777', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                                        title="Edit Monthly Amount"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewReport(m)}
                                                        style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
                                                        title="View Status"
                                                    >
                                                        <FileText size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
                {funds.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', gridColumn: '1/-1' }}>No funds created yet.</div>}
            </div>

            <Modal
                isOpen={isFundModalOpen}
                onClose={() => setIsFundModalOpen(false)}
                title={editingId ? "Edit Fund" : "Add New Fund"}
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

                    {newFund.classification === 'Death Fund' && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#dc2626' }}>Affected Family (Beneficiary)</label>
                            <select
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #fca5a5', background: '#fef2f2' }}
                                value={newFund.affectedFamilyId}
                                onChange={(e) => setNewFund({ ...newFund, affectedFamilyId: e.target.value })}
                            >
                                <option value="">-- Select Family --</option>
                                {families.map(f => (
                                    <option key={f.id} value={f.id}>{f.id} - {f.headName}</option>
                                ))}
                            </select>
                        </div>
                    )}
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

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Deadline</label>
                            <input
                                type="date"
                                value={newFund.deadline}
                                onChange={(e) => setNewFund({ ...newFund, deadline: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb' }}
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={newFund.isMandatory}
                                    onChange={(e) => setNewFund({ ...newFund, isMandatory: e.target.checked })}
                                />
                                Mandatory
                            </label>
                        </div>
                    </div>

                    <Button type="submit" fullWidth variant="primary">Create Fund</Button>
                </form>
            </Modal>

            {/* Report Modal */}
            <Modal
                isOpen={isReportModalOpen}
                onClose={() => { setIsReportModalOpen(false); setReportSearch(''); }}
                title={`Report: ${selectedReportFund?.title || ''}`}
            >
                <div style={{ marginBottom: '12px' }}>
                    <Input
                        placeholder="Search Family Name or ID..."
                        value={reportSearch || ''}
                        onChange={(e) => setReportSearch(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                    <button
                        onClick={() => setReportTab('paid')}
                        style={{ padding: '8px 16px', border: 'none', background: 'none', borderBottom: reportTab === 'paid' ? '2px solid #10b981' : 'none', color: reportTab === 'paid' ? '#10b981' : '#6b7280', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Paid ({reportData.paid.length})
                    </button>
                    <button
                        onClick={() => setReportTab('partial')}
                        style={{ padding: '8px 16px', border: 'none', background: 'none', borderBottom: reportTab === 'partial' ? '2px solid #f59e0b' : 'none', color: reportTab === 'partial' ? '#f59e0b' : '#6b7280', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Partially ({reportData.partial.length})
                    </button>
                    <button
                        onClick={() => setReportTab('unpaid')}
                        style={{ padding: '8px 16px', border: 'none', background: 'none', borderBottom: reportTab === 'unpaid' ? '2px solid #ef4444' : 'none', color: reportTab === 'unpaid' ? '#ef4444' : '#6b7280', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Unpaid ({reportData.unpaid.length})
                    </button>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {reportTab === 'paid' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {reportData.paid
                                .filter(f => (f.headName || '').toLowerCase().includes((reportSearch || '').toLowerCase()) || (f.id || '').toLowerCase().includes((reportSearch || '').toLowerCase()))
                                .map(fam => (
                                    <div key={fam.id} style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#166534' }}>{fam.headName} ({fam.id})</div>
                                            <div style={{ fontSize: '0.8rem', color: '#15803d' }}>Paid on: {fam.lastPaid ? new Date(fam.lastPaid).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#16a34a' }}>₹{fam.paidAmount}</div>
                                    </div>
                                ))}
                            {reportData.paid.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No fully paid families yet.</div>}
                        </div>
                    )}

                    {reportTab === 'partial' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {reportData.partial
                                .filter(f => (f.headName || '').toLowerCase().includes((reportSearch || '').toLowerCase()) || (f.id || '').toLowerCase().includes((reportSearch || '').toLowerCase()))
                                .map(fam => (
                                    <div key={fam.id} style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#92400e' }}>{fam.headName} ({fam.id})</div>
                                            <div style={{ fontSize: '0.8rem', color: '#b45309' }}>Partially Paid</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: '#d97706' }}>Paid: ₹{fam.paidAmount} / {fam.requiredAmount}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>Remaining: ₹{fam.remaining}</div>
                                        </div>
                                    </div>
                                ))}
                            {reportData.partial.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>No partial payments.</div>}
                        </div>
                    )}

                    {reportTab === 'unpaid' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {reportData.unpaid
                                .filter(f => (f.headName || '').toLowerCase().includes((reportSearch || '').toLowerCase()) || (f.id || '').toLowerCase().includes((reportSearch || '').toLowerCase()))
                                .map(fam => (
                                    <div key={fam.id} style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#991b1b' }}>{fam.headName} ({fam.id})</div>
                                            <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>Not Paid Yet</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: '#dc2626' }}>₹0 / {fam.requiredAmount}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>Due: ₹{fam.remaining}</div>
                                        </div>
                                    </div>
                                ))}
                            {reportData.unpaid.length === 0 && <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>Everyone has paid something!</div>}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default AdminFunds;
