import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

interface LoginProps {
  setIsAuthenticated: (value: boolean, role?: string) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ログイン
      const response = await axios.post('/api/auth/login/', {
        email,
        password,
      });

      // トークンを保存
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // ユーザー情報を取得
      const userResponse = await axios.get('/api/users/', {
        headers: {
          Authorization: `Bearer ${response.data.access}`
        }
      });
      
      // 自分の情報を取得（配列の最初）
      const user = userResponse.data.results?.[0] || userResponse.data[0];
      
      if (user) {
        setIsAuthenticated(true, user.role);
      } else {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError('ログインに失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Mind Status</h1>
          <p>メンタルヘルス管理システム</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="login-footer">
          <p>テスト用アカウント</p>
          <p>Email: admin@mindstatus.com</p>
          <p>Password: Admin123!</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
