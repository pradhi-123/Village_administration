import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/common/AppLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './pages/Login';

import AdminDashboard from './pages/AdminDashboard';
import CashierDashboard from './pages/CashierDashboard';
import UpdatesPage from './pages/UpdatesPage';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminFamilies from './pages/admin/AdminFamilies';
import AdminFunds from './pages/admin/AdminFunds';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminReports from './pages/admin/AdminReports';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminCashiers from './pages/admin/AdminCashiers';

// Member Pages
import MemberLayout from './pages/member/MemberLayout';
import MemberHome from './pages/member/MemberHome';
import MemberDues from './pages/member/MemberDues';
import MemberDonation from './pages/member/MemberDonation';
import MemberHistory from './pages/member/MemberHistory';
import MemberFamily from './pages/member/MemberFamily';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'cashier') return <Navigate to="/cashier" replace />;
  if (user.role === 'member') return <Navigate to="/member" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <AppLayout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/updates" element={<UpdatesPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminOverview />} />
                  <Route path="families" element={<AdminFamilies />} />
                  <Route path="funds" element={<AdminFunds />} />
                  <Route path="expenses" element={<AdminExpenses />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="announcements" element={<AdminAnnouncements />} />
                  <Route path="cashiers" element={<AdminCashiers />} />
                  <Route path="*" element={<div>Page Under Construction</div>} />
                </Route>


                {/* Member Routes */}
                <Route path="/member" element={<ProtectedRoute role="member"><MemberLayout /></ProtectedRoute>}>
                  <Route index element={<MemberHome />} />
                  <Route path="dues" element={<MemberDues />} />
                  <Route path="donate" element={<MemberDonation />} />
                  <Route path="history" element={<MemberHistory />} />
                  <Route path="family" element={<MemberFamily />} />
                </Route>

                <Route path="/cashier" element={<ProtectedRoute role="cashier"><CashierDashboard /></ProtectedRoute>} />
                <Route path="/cashier/member/:id" element={<ProtectedRoute role="cashier"><MemberLayout /></ProtectedRoute>}>
                  <Route index element={<MemberHome isCashierView={true} />} />
                  <Route path="dues" element={<MemberDues isCashierView={true} />} />
                  <Route path="donate" element={<MemberDonation isCashierView={true} />} />
                  <Route path="history" element={<MemberHistory isCashierView={true} />} />
                  <Route path="family" element={<MemberFamily isCashierView={true} />} />
                </Route>

                <Route path="/cashier" element={<ProtectedRoute role="cashier"><CashierDashboard /></ProtectedRoute>} />

                {/* Fallback for root */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<div>404 Not Found</div>} />
              </Routes>
            </AppLayout>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
