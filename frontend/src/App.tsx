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
  const [isLoadingRole, setIsLoadingRole] = React.useState<boolean>(true);

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      // トークンがない場合は即座にローディング終了
      setIsLoadingRole(false);
      return;
    }

    // トークンがある場合のみAPIを呼び出す
    fetch('/api/users/me/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch user role');
        }
        return res.json();
      })
      .then(data => {
        if (data && data.role) {
          // 認証成功: role を設定してからローディング終了
          setIsAuthenticated(true);
          setUserRole(data.role);
          localStorage.setItem('user_role', data.role);
        } else {
          // role が取得できない場合はログアウト
          handleLogout();
        }
        setIsLoadingRole(false);
      })
      .catch(error => {
        console.error('Failed to fetch user role:', error);
        // エラー時はログアウト
        handleLogout();
        setIsLoadingRole(false);
      });
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('user_role');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const handleSetAuthenticated = (value: boolean, role?: string) => {
    if (value && role) {
      // ログイン成功
      setIsAuthenticated(true);
      setUserRole(role);
      localStorage.setItem('user_role', role);
    } else {
      // ログアウト
      handleLogout();
    }
  };

  // role取得中はローディング表示
  if (isLoadingRole) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        読み込み中...
      </div>
    );
  }

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
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login setIsAuthenticated={handleSetAuthenticated} />
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
                : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : userRole === 'ADMIN' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Dashboard setIsAuthenticated={handleSetAuthenticated} />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={
              !isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : userRole === 'ADMIN' ? (
                <AdminDashboard setIsAuthenticated={handleSetAuthenticated} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
