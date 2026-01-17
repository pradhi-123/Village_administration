import React, { useState } from 'react';
import { MockDB } from '../../services/mockDatabase';
import { Clock } from 'lucide-react';

const AdminReports = () => {
    const [reportFundFilter, setReportFundFilter] = useState('ALL');
    const [reportFamilyFilter, setReportFamilyFilter] = useState('ALL');
    const allTransactions = MockDB.getTransactions();
    const funds = MockDB.getFunds();

    // Compute stats
    const filteredTransactions = allTransactions.filter(tx => {
        const matchFund = reportFundFilter === 'ALL' || tx.fundId === reportFundFilter;
        const matchFamily = reportFamilyFilter === 'ALL' || tx.familyId === reportFamilyFilter;
        return matchFund && matchFamily;
    });

    const totalCollected = filteredTransactions.reduce((sum, tx) => sum + parseInt(tx.amount), 0);

    return (
        <div>
            <h3>Reports & Analytics</h3>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} /> Total Collections
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#059669', marginTop: '8px' }}>
                        ₹{totalCollected.toLocaleString()}
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#374151' }}>Filters:</span>
                <select
                    value={reportFundFilter}
                    onChange={(e) => setReportFundFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                    <option value="ALL">All Funds</option>
                    {funds.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredTransactions.slice().reverse().map((tx, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'white', borderBottom: '1px solid #f3f4f6', borderRadius: '8px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{funds.find(f => f.id === tx.fundId)?.title || tx.fundId}</div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                Family: {tx.familyId} • {new Date(tx.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#059669' }}>+₹{tx.amount}</div>
                    </div>
                ))}
                {filteredTransactions.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No transactions found.</div>}
            </div>
        </div>
    );
};

export default AdminReports;
