import React, { useState } from 'react';
import { MockDB } from '../../services/mockDatabase';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import { Users, Trash2, Plus } from 'lucide-react';

const AdminCashiers = () => {
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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3>Manage Cashiers</h3>
                <Button onClick={() => setIsCashierModalOpen(true)} icon={Plus}>Add Cashier</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {cashiers.map(c => (
                    <div key={c.id} style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: 'var(--shadow-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={24} color="#0284c7" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{c.name}</div>
                                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{c.mobile}</div>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>ID: {c.id}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDeleteCashier(c.id)}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fee2e2', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {cashiers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: 'white', borderRadius: '16px' }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>No cashiers found. Add one to get started.</p>
                </div>
            )}

            <Modal
                isOpen={isCashierModalOpen}
                onClose={() => setIsCashierModalOpen(false)}
                title="Add New Cashier"
            >
                <form onSubmit={handleAddCashier}>
                    <Input
                        label="Full Name"
                        placeholder="John Doe"
                        value={newCashier.name}
                        onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Input
                            label="Mobile Number"
                            placeholder="9876543210"
                            value={newCashier.mobile}
                            onChange={(e) => setNewCashier({ ...newCashier, mobile: e.target.value })}
                            style={{ flex: 1 }}
                        />
                        <Input
                            label="Set PIN"
                            placeholder="1234"
                            maxLength={4}
                            value={newCashier.pin}
                            onChange={(e) => setNewCashier({ ...newCashier, pin: e.target.value })}
                            style={{ width: '100px' }}
                        />
                    </div>
                    <Button type="submit" fullWidth>Create Cashier Account</Button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminCashiers;
