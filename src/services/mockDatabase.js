const STORAGE_KEYS = {
    FAMILIES: 'vfms_families',
    FUNDS: 'vfms_funds',
    TRANSACTIONS: 'vfms_transactions',
    ADMIN_PASSWORD: 'vfms_admin_pass', // Simple simulation
    CASHIER_PIN: 'vfms_cashier_pin'
};

// Seed Data
const INITIAL_DATA = {
    families: [
        {
            id: 'FAM001',
            headName: 'Ramasamy',
            members: [
                { name: 'Ramasamy', age: 65, dob: '1959-01-01', gender: 'Male', mobile: '9876543210', photo: null },
                { name: 'Lakshmi', age: 60, dob: '1964-05-20', gender: 'Female', photo: null }
            ]
        },
        {
            id: 'FAM002',
            headName: 'Murugan',
            members: [
                { name: 'Murugan', age: 45, dob: '1979-08-15', gender: 'Male', mobile: '9876543211' },
                { name: 'Valli', age: 40, dob: '1984-03-10', gender: 'Female' },
                { name: 'Karthik', age: 18, dob: '2006-07-22', gender: 'Male', mobile: '9876543333' }
            ]
        }
    ],
    funds: [
        { id: 'FUND001', title: 'Temple Festival', amount: 500, type: 'OneTime', classification: 'Event', createdDate: '2023-10-01', balance: 0, isPublic: true },
        { id: 'FUND002', title: 'Water Tank Maintenance', amount: 100, type: 'Monthly', classification: 'Monthly', createdDate: '2023-11-01', balance: 0, isPublic: true },
        { id: 'FUND000', title: 'General Village Fund', amount: 0, type: 'Donation', classification: 'General', createdDate: '2023-01-01', balance: 0, isPublic: true, isGeneral: true },
        { id: 'FUND003', title: 'Funeral Assistance (Muthu)', amount: 200, type: 'OneTime', classification: 'Death Fund', expectedDeadLine: '2023-12-01', createdDate: '2023-11-20', balance: 0, isPublic: true, affectedFamilyId: 'FAM002' }
    ],
    cashiers: [
        { id: 'CASH001', name: 'Ramesh', mobile: '9876543210', pin: '1234' },
        { id: 'CASH002', name: 'Suresh', mobile: '9123456789', pin: '5678' }
    ],
    transactions: [],
    expenses: [], // { id, cashierId, fundId, amount, purpose, billImage, status, date }
    donations: [], // { id, donorName, amount, visibleToFamily, visibleToCashier, date }
    auditLogs: [] // { id, userRole, action, timestamp, details }
};

// Helper to get data
const getData = (key, defaultData) => {
    const data = localStorage.getItem(key);
    if (!data || data === 'undefined' || data === 'null') return defaultData;
    try {
        const parsed = JSON.parse(data);
        return parsed || defaultData;
    } catch (e) {
        console.error('Data Parse Error for key:', key, e);
        return defaultData;
    }
};

// Helper to save data
const saveData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const MockDB = {
    // Initialization
    init: () => {
        const families = localStorage.getItem(STORAGE_KEYS.FAMILIES);
        if (!families || JSON.parse(families).length === 0) {
            saveData(STORAGE_KEYS.FAMILIES, INITIAL_DATA.families);
        }

        const funds = localStorage.getItem(STORAGE_KEYS.FUNDS);
        if (!funds || JSON.parse(funds).length === 0) {
            saveData(STORAGE_KEYS.FUNDS, INITIAL_DATA.funds);
        }

        if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
            saveData(STORAGE_KEYS.TRANSACTIONS, INITIAL_DATA.transactions);
        }

        // Initialize cashiers if not present
        if (!localStorage.getItem(STORAGE_KEYS.CASHIERS)) {
            saveData(STORAGE_KEYS.CASHIERS, INITIAL_DATA.cashiers);
        }

        // Auto-Generate Monthly Dues for Current Year
        MockDB.checkAndGenerateMonthlyDues();
    },

    // Cashiers
    getCashiers: () => getData(STORAGE_KEYS.CASHIERS, []),
    addCashier: (cashier) => {
        const cashiers = MockDB.getCashiers();
        cashiers.push(cashier);
        saveData(STORAGE_KEYS.CASHIERS, cashiers);
    },
    deleteCashier: (id) => {
        let cashiers = MockDB.getCashiers();
        cashiers = cashiers.filter(c => c.id !== id);
        saveData(STORAGE_KEYS.CASHIERS, cashiers);
    },

    // Familiesy Operations
    getFamilies: () => getData(STORAGE_KEYS.FAMILIES, []),
    addFamily: (family) => {
        const families = MockDB.getFamilies();
        families.push(family);
        saveData(STORAGE_KEYS.FAMILIES, families);
    },
    updateFamily: (updatedFamily) => {
        let families = MockDB.getFamilies();
        families = families.map(f => f.id === updatedFamily.id ? updatedFamily : f);
        saveData(STORAGE_KEYS.FAMILIES, families);
    },
    deleteFamily: (id) => {
        let families = MockDB.getFamilies();
        families = families.filter(f => f.id !== id);
        saveData(STORAGE_KEYS.FAMILIES, families);
    },
    getFamilyById: (id) => {
        const families = MockDB.getFamilies();
        return families.find(f => f.id === id);
    },

    // Fund Operations
    getFunds: () => getData(STORAGE_KEYS.FUNDS, []),
    addFund: (fund) => {
        const funds = MockDB.getFunds();
        funds.push(fund);
        saveData(STORAGE_KEYS.FUNDS, funds);
    },
    updateFund: (updatedFund) => {
        let funds = MockDB.getFunds();
        funds = funds.map(f => f.id === updatedFund.id ? updatedFund : f);
        saveData(STORAGE_KEYS.FUNDS, funds);
    },

    // Compatibility Wrapper for Admin Dashboard
    generateYearlyDues: (templateFundId, year) => {
        return MockDB.generateMonthlyDuesUpToNow(templateFundId, year, 11); // Generate all 12 months
    },

    // Monthly Fund Generation (Incremental)
    generateMonthlyDuesUpToNow: (templateFundId, year, limitMonthIndex = 11) => {
        const funds = MockDB.getFunds();
        const template = funds.find(f => f.id === templateFundId);
        if (!template) throw new Error("Template Fund not found");

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const newFunds = [];

        months.forEach((month, index) => {
            // ONLY generate if within the limit (e.g., up to March)
            if (index > limitMonthIndex) return;

            const fundId = `${templateFundId}_${year}_${index + 1}`;
            const existingFundIndex = funds.findIndex(f => f.id === fundId);

            if (existingFundIndex === -1) {
                // Create New
                newFunds.push({
                    id: fundId,
                    title: `Monthly Fund - ${month} ${year}`,
                    amount: template.amount,
                    type: 'Monthly',
                    classification: 'Monthly',
                    isMandatory: template.isMandatory || true,
                    createdDate: `${year}-${String(index + 1).padStart(2, '0')}-01`,
                    deadline: `${year}-12-31`, // Flexible Year End Deadline
                    isPublic: true,
                    groupId: templateFundId, // Link back to parent
                    monthIndex: index,
                    year: parseInt(year)
                });
            } else {
                // Fix Existing: If groupId is missing (Migration for old data)
                if (!funds[existingFundIndex].groupId) {
                    funds[existingFundIndex].groupId = templateFundId;
                    funds[existingFundIndex].monthIndex = index; // Ensure this is set too
                    funds[existingFundIndex].year = parseInt(year);
                    // Mark that we modified something so we save later
                    // We can just push a valid dummy to newFunds to trigger the save check, 
                    // or better, force a save.
                    // Let's rely on the fact that 'funds' is a reference to the array we are about to save if newFunds > 0.
                    // But wait, the save block below only runs if newFunds.length > 0.
                    // We need to ensure we save.
                }
            }
        });

        // Save if we created new funds OR if we patched existing ones
        // Since we modified 'funds' in place for the fix, we should just save 'funds'.
        if (newFunds.length > 0) {
            funds.push(...newFunds);
        }

        // Always save to persist any fixes or new additions
        saveData(STORAGE_KEYS.FUNDS, funds);

        return { success: true, count: newFunds.length, generated: newFunds.map(f => f.title) };


    },

    checkAndGenerateMonthlyDues: () => {
        const currentYear = new Date().getFullYear();
        const currentMonthIndex = new Date().getMonth();

        console.log(`[System] Running Monthly Due Check. Date: ${new Date().toLocaleDateString()}`);

        const funds = MockDB.getFunds();
        // Find templates (Monthly funds that are NOT generated sub-funds)
        const templates = funds.filter(f => (f.classification === 'Monthly' || f.type === 'Monthly') && !f.groupId);

        let generatedCount = 0;
        templates.forEach(template => {
            const res = MockDB.generateMonthlyDuesUpToNow(template.id, currentYear, currentMonthIndex);
            if (res.success) {
                generatedCount += res.count;
                console.log(`[Auto-Generate] Generated:`, res.generated);
            }
        });

        if (generatedCount > 0) {
            console.log(`[Auto-Generate] Total ${generatedCount} new monthly dues created.`);
        }
    },

    // Repairs data by ensuring all monthly funds have groupIds
    forceRepairData: () => {
        try {
            const currentYear = new Date().getFullYear();
            const funds = MockDB.getFunds();
            const templates = funds.filter(f => (f.classification === 'Monthly' || f.type === 'Monthly') && !f.groupId);

            let fixedCount = 0;
            templates.forEach(template => {
                // We use monthIndex 11 (December) to ensure we scan the whole year for broken links
                const res = MockDB.generateMonthlyDuesUpToNow(template.id, currentYear, 11);
                // The generate function now auto-heals, so running it is enough.
                if (res.success) fixedCount++;
            });

            return { success: true, message: `Scan Complete. Checked ${templates.length} fund templates.` };
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    // Transaction Operations
    getTransactions: () => getData(STORAGE_KEYS.TRANSACTIONS, []),
    addTransaction: (transaction) => {
        const transactions = MockDB.getTransactions();
        transactions.push({ ...transaction, id: Date.now().toString(), date: new Date().toISOString() });
        saveData(STORAGE_KEYS.TRANSACTIONS, transactions);

        // Auto-update fund balance if needed (optional, keeping simple for now)
    },

    getFundBalance: (fundId) => {
        const transactions = MockDB.getTransactions().filter(t => t.fundId === fundId || t.fundId === String(fundId));
        const expenses = MockDB.getExpenses().filter(e => (e.fundId === fundId || e.fundId === String(fundId)) && e.status === 'Approved');

        const income = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        return { income, expense, balance: income - expense };
    },

    // Expenses
    getExpenses: () => getData('vfms_expenses', []),
    addExpense: (expense) => {
        const list = MockDB.getExpenses();
        list.push({ ...expense, id: 'EXP' + Date.now(), status: 'Pending', date: new Date().toISOString() });
        saveData('vfms_expenses', list);
    },
    updateExpenseStatus: (id, status) => {
        let list = MockDB.getExpenses();
        list = list.map(e => e.id === id ? { ...e, status } : e);
        saveData('vfms_expenses', list);
    },
    updateExpenseVisibility: (id, isPublic) => {
        let list = MockDB.getExpenses();
        list = list.map(e => e.id === id ? { ...e, isPublic } : e);
        saveData('vfms_expenses', list);
    },

    // Donations
    getDonations: () => getData('vfms_donations', []),
    addDonation: (donation) => {
        const list = MockDB.getDonations();
        list.push({ ...donation, id: 'DON' + Date.now(), date: new Date().toISOString() });
        saveData('vfms_donations', list);
    },

    // Audit Logs
    getAuditLogs: () => getData('vfms_audit', []),
    addAuditLog: (log) => {
        const list = MockDB.getAuditLogs();
        list.unshift({ ...log, id: 'LOG' + Date.now(), timestamp: new Date().toISOString() });
        // Keep last 1000 logs
        if (list.length > 1000) list.pop();
        saveData('vfms_audit', list);
    },

    // Announcements
    getAnnouncements: () => getData('vfms_announcements', []),
    addAnnouncement: (announcement) => {
        const list = MockDB.getAnnouncements();
        list.unshift({ ...announcement, id: 'ANC' + Date.now(), date: new Date().toISOString(), active: true });
        saveData('vfms_announcements', list);
    },
    deleteAnnouncement: (id) => {
        let list = MockDB.getAnnouncements();
        list = list.filter(a => a.id !== id);
        saveData('vfms_announcements', list);
    },

    // Payment Status Logic
    getFamilyFundStatus: (familyId) => {
        const funds = MockDB.getFunds();
        const transactions = MockDB.getTransactions().filter(t => t.familyId === familyId);

        return funds.map(fund => {
            const paidAmount = transactions
                .filter(t => t.fundId === fund.id)
                .reduce((sum, t) => sum + parseInt(t.amount), 0);

            let status = 'Pending';
            if (paidAmount >= fund.amount) status = 'Paid';
            else if (paidAmount > 0) status = 'Partial';

            return {
                ...fund,
                paidAmount,
                pendingAmount: Math.max(0, fund.amount - paidAmount),
                status
            };
        });
    },

    // New: Global Financial Summary for Admin Sorting
    getAllFamiliesFinancialSummary: () => {
        const families = MockDB.getFamilies();
        return families.map(family => {
            const fundStatus = MockDB.getFamilyFundStatus(family.id);
            const stats = fundStatus.reduce((acc, item) => {
                acc.totalDue += item.amount;
                acc.totalPaid += item.paidAmount;
                acc.totalPending += item.pendingAmount;
                return acc;
            }, { totalDue: 0, totalPaid: 0, totalPending: 0 });

            return {
                ...family,
                financials: {
                    ...stats,
                    complianceRate: stats.totalDue > 0 ? (stats.totalPaid / stats.totalDue) * 100 : 100
                }
            };
        });
    },

    // New: Specific Fund Compliance Report
    getFundComplianceReport: (fundId) => {
        const families = MockDB.getFamilies();
        const report = { paid: [], partial: [], unpaid: [], all: [] };

        families.forEach(family => {
            const statuses = MockDB.getFamilyFundStatus(family.id);
            const fundStatus = statuses.find(s => s.id === fundId);

            if (fundStatus) {
                const entry = {
                    familyId: family.id,
                    headName: family.headName,
                    ...fundStatus
                };

                report.all.push(entry);
                if (fundStatus.status === 'Paid') report.paid.push(entry);
                else if (fundStatus.status === 'Partial') report.partial.push(entry);
                else report.unpaid.push(entry);
            }
        });
        return report;
    },

    // Smart Payment Algorithm
    distributePayment: (familyId, amount, upiId = 'CASH', allowedFundIds = null) => {
        const funds = MockDB.getFunds();
        const families = MockDB.getFamilies();
        const family = families.find(f => f.id === familyId);

        if (!family) throw new Error("Family not found");

        const status = MockDB.getFamilyFundStatus(familyId);

        // Filter by Allowed Funds if provided (Manual Mode)
        const relevantStatus = allowedFundIds
            ? status.filter(s => allowedFundIds.includes(s.id))
            : status;

        const totalPending = relevantStatus.reduce((sum, s) => sum + s.pendingAmount, 0);

        if (amount > totalPending) {
            throw new Error(`Amount ₹${amount} exceeds total pending dues of ₹${totalPending}. Please enter exact amount.`);
        }

        let remaining = amount;
        const allocation = [];

        // Sort by Mandatory first, then Oldest Deadline/Created Date
        const sortedDue = relevantStatus
            .filter(s => s.pendingAmount > 0)
            .sort((a, b) => {
                // 1. Mandatory First
                if (a.isMandatory !== b.isMandatory) {
                    return a.isMandatory ? -1 : 1;
                }

                // 2. Deadline (Earliest First) - Handle missing deadlines
                const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity; // No deadline = push to end
                const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

                if (dateA !== dateB) {
                    return dateA - dateB;
                }

                // 3. Priority (High > Normal > Low) - Handle missing priority
                const pMap = { 'High': 3, 'Normal': 2, 'Low': 1 };
                const pA = pMap[a.priority] || 0;
                const pB = pMap[b.priority] || 0;

                if (pA !== pB) {
                    return pB - pA; // Descending order (3 > 1)
                }

                // 4. Oldest Created Date (Fall back to "Oldest Dues")
                const createdA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
                const createdB = b.createdDate ? new Date(b.createdDate).getTime() : 0;

                return createdA - createdB;
            });

        for (const due of sortedDue) {
            if (remaining <= 0) break;

            const payAmount = Math.min(remaining, due.pendingAmount);
            remaining -= payAmount;

            // Add Transaction
            MockDB.addTransaction({
                familyId,
                fundId: due.id, // Use due.id for fundId
                amount: payAmount,
                date: new Date().toISOString(),
                method: upiId ? 'UPI' : 'CASH',
                details: upiId ? `UPI: ${upiId}` : 'Cash Payment'
            });

            const fund = funds.find(f => f.id === due.id); // Use due.id to find the fund
            allocation.push({
                fundName: fund ? (fund.title || fund.name || 'Unknown Fund') : due.id,
                amount: payAmount,
                status: payAmount === due.pendingAmount ? 'Cleared' : 'Partial'
            });
        }

        const isFullyCleared = (totalPending - amount) === 0;

        return {
            allocation,
            originalAmount: amount,
            remainingDues: totalPending - amount,
            isFullyCleared,
            message: isFullyCleared ? "All Dues Cleared Successfully!" : `Payment Recorded. Remaining Dues: ₹${totalPending - amount}`
        };
    },

    reset: () => localStorage.clear()
};
