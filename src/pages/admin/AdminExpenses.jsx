import React, { useState, useRef } from 'react';
import { MockDB } from '../../services/mockDatabase';
import { AuditService } from '../../services/AuditService';
import DebugErrorBoundary from '../../components/common/DebugErrorBoundary';
import { VeryfiService } from '../../services/VeryfiService'; // NEW Import
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Camera, Upload, CheckCircle, XCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const AdminExpensesContent = () => {
    const location = useLocation();
    const [expenses, setExpenses] = useState(MockDB.getExpenses());
    const [isAdminExpenseOpen, setIsAdminExpenseOpen] = useState(location.state?.openRecord || false);
    const [analyzing, setAnalyzing] = useState(false);

    const [adminExpense, setAdminExpense] = useState({
        purpose: '',
        amount: '',
        fundId: '',
        billImage: null
    });

    const handleUpdateStatus = (id, status) => {
        MockDB.updateExpenseStatus(id, status);
        MockDB.updateExpenseVisibility(id, true); // Make public when approved
        if (status === 'Approved') {
            // Logic to deduct from fund balance if tracking real balances
        }
        setExpenses(MockDB.getExpenses());
    };

    const handleAnalyzeBill = async (file) => {
        setAnalyzing(true);

        // Hardcoded Credentials from User
        const credentials = {
            clientId: 'vrfbrOTIln5cy7E9yiSIVEM2l6Sl0zSSJwPCrLK',
            username: 'pradhikshaanandkumar',
            apiKey: '2b41774a37b41512d4c52454fde372be'
        };

        try {
            // Re-using Veryfi Service
            const { VeryfiService } = await import('../../services/VeryfiService');
            const result = await VeryfiService.processDocument(file, credentials);

            setAdminExpense(prev => ({
                ...prev,
                amount: result.amount,
                purpose: result.summary
            }));
            alert(`Veryfi Analysis Complete!\nVendor: ${result.vendor.name}\nTotal: ₹${result.amount}`);
        } catch (error) {
            console.error("AI Scan Failed", error);
            alert(`Analysis Failed: ${error.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAdminExpense(p => ({ ...p, billImage: reader.result }));
            reader.readAsDataURL(file);
            handleAnalyzeBill(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        MockDB.addExpense({
            ...adminExpense,
            cashierId: 'Admin',
            status: 'Approved', // Admin expenses auto-approved
            isPublic: true
        });
        setExpenses(MockDB.getExpenses());
        setIsAdminExpenseOpen(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3>Expenses & Requests</h3>
                <Button onClick={() => setIsAdminExpenseOpen(true)} icon={Camera}>Record Expense</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {expenses.length === 0 && <div style={{ textAlign: 'center', color: '#888' }}>No expenses recorded.</div>}
                {expenses.map(exp => (
                    <div key={exp.id} style={{ background: 'white', padding: '16px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{exp.purpose}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    {new Date(exp.date).toLocaleDateString()} • {exp.id}
                                </div>
                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem',
                                        background: exp.status === 'Approved' ? '#dcfce7' : exp.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                        color: exp.status === 'Approved' ? '#166534' : exp.status === 'Rejected' ? '#991b1b' : '#92400e'
                                    }}>
                                        {exp.status}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#ef4444' }}>₹{exp.amount}</div>
                                {exp.status === 'Pending' && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                        <button onClick={() => handleUpdateStatus(exp.id, 'Approved')} style={{ color: 'green', background: 'none', border: 'none', cursor: 'pointer' }}><CheckCircle /></button>
                                        <button onClick={() => handleUpdateStatus(exp.id, 'Rejected')} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}><XCircle /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isAdminExpenseOpen} onClose={() => setIsAdminExpenseOpen(false)} title="Record Admin Expense">
                <form onSubmit={handleSubmit}>
                    <Input label="Purpose" value={adminExpense.purpose} onChange={e => setAdminExpense({ ...adminExpense, purpose: e.target.value })} />
                    <Input label="Amount" value={adminExpense.amount} onChange={e => setAdminExpense({ ...adminExpense, amount: e.target.value })} />
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px' }}>Bill Photo</label>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                        {analyzing && <div>Analyzing...</div>}
                    </div>
                    <Button type="submit" fullWidth>Record Expense</Button>
                </form>
            </Modal>
        </div>
    );
};

// Wrapped for robustness
const AdminExpenses = (props) => (
    <DebugErrorBoundary>
        <AdminExpensesContent {...props} />
    </DebugErrorBoundary>
);

export default AdminExpenses;
