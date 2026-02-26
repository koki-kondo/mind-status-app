import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegisterPage from './pages/AdminRegisterPage';
import InviteRouteHandler from './components/InviteRouteHandler';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import './App.css';

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = React.useState<boolean>(true);

  // handleLogout を useCallback で安定化
  const handleLogout = React.useCallback(() => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem('user_role');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }, []);

  React.useEffect(() => {
    // React Router の useLocation から取得
    const isInviteRoute = location.pathname.startsWith('/invite/');
    
    if (isInviteRoute) {
      // 招待ルートの場合: 認証チェックをスキップし、強制ログアウト
      console.log('[App] 招待ルート検出 → 認証チェックスキップ');
      handleLogout();
      setIsLoadingRole(false);
      return;
    }

    // 通常ルートの場合: 認証チェック実行
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setIsLoadingRole(false);
      return;
    }

    console.log('[App] 認証チェック実行');
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
          setIsAuthenticated(true);
          setUserRole(data.role);
          localStorage.setItem('user_role', data.role);
        } else {
          handleLogout();
        }
        setIsLoadingRole(false);
      })
      .catch(error => {
        console.error('Failed to fetch user role:', error);
        handleLogout();
        setIsLoadingRole(false);
      });
  }, [handleLogout, location.pathname]);

  const handleSetAuthenticated = React.useCallback((value: boolean, role?: string) => {
    if (value && role) {
      setIsAuthenticated(true);
      setUserRole(role);
      localStorage.setItem('user_role', role);
    } else {
      handleLogout();
    }
  }, [handleLogout]);

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
          element={
            <InviteRouteHandler
              isAuthenticated={isAuthenticated}
              handleLogout={handleLogout}
            />
          } 
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
  );
}

export default App;
