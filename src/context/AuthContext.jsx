import React, { createContext, useState, useContext, useEffect } from 'react';
import { MockDB } from '../services/mockDatabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { role: 'admin' | 'cashier' | 'member', id: string, name: string }
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        MockDB.init(); // Ensure DB is ready
        const storedUser = localStorage.getItem('vfms_user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            // AUTO-FIX: specific patch for legacy cashier session without ID
            if (parsed.role === 'cashier' && !parsed.id) {
                parsed.id = 'CASHIER_MAIN';
                localStorage.setItem('vfms_user', JSON.stringify(parsed));
            }
            setUser(parsed);
        }
        setLoading(false);
    }, []);

    const login = (role, credentials) => {
        // Simple validation for prototype
        if (role === 'admin') {
            if (credentials.password === 'admin123') {
                const u = { role: 'admin', name: 'Village Head' };
                setUser(u);
                localStorage.setItem('vfms_user', JSON.stringify(u));
                return true;
            }
        } else if (role === 'cashier') {
            if (credentials.password === '1234') {
                const u = { role: 'cashier', id: 'CASHIER_MAIN', name: 'Cashier' };
                setUser(u);
                localStorage.setItem('vfms_user', JSON.stringify(u));
                return true;
            }
        } else if (role === 'member') {
            // Case-insensitive check
            const families = MockDB.getFamilies();
            const family = families.find(f => f.id.toLowerCase() === credentials.familyId.toLowerCase());

            if (family) {
                const u = { role: 'member', id: family.id, name: family.headName };
                setUser(u);
                localStorage.setItem('vfms_user', JSON.stringify(u));
                return true;
            }
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('vfms_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
