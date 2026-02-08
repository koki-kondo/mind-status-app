import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegisterPage from './pages/AdminRegisterPage';
import InvitePage from './pages/InvitePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    // ローカルストレージからトークンを確認
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleSetAuthenticated = (value: boolean, role?: string) => {
    setIsAuthenticated(value);
    if (role) {
      setUserRole(role);
      localStorage.setItem('user_role', role);
    } else {
      setUserRole(null);
      localStorage.removeItem('user_role');
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/register" 
            element={<AdminRegisterPage />} 
          />
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Login setIsAuthenticated={handleSetAuthenticated} />
            } 
          />
          <Route 
            path="/invite/:token" 
            element={<InvitePage />} 
          />
          <Route 
            path="/forgot-password" 
            element={<ForgotPasswordPage />} 
          />
          <Route 
            path="/reset-password/:token" 
            element={<ResetPasswordPage />} 
          />
          <Route 
            path="/change-password" 
            element={
              isAuthenticated
                ? <ChangePasswordPage setIsAuthenticated={handleSetAuthenticated} />
                : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? (
                userRole === 'ADMIN' ? (
                  <AdminDashboard setIsAuthenticated={(value) => handleSetAuthenticated(value)} />
                ) : (
                  <Dashboard setIsAuthenticated={(value) => handleSetAuthenticated(value)} />
                )
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
