import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import publicApi from '../api/public';
import './InvitePage.css';

const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>('');
  const [userInfo, setUserInfo] = useState<{ email: string; full_name: string } | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await publicApi.get(`/api/users/verify_invite/?token=${token}`);
      setUserInfo(response.data.user);
      setLoading(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'トークンの検証に失敗しました');
      setLoading(false);
    }
  };

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) {
      return 'パスワードは8文字以上で設定してください';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'パスワードには大文字を含めてください';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'パスワードには小文字を含めてください';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'パスワードには数字を含めてください';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const validationError = validatePassword(password);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('パスワードが一致しません');
      return;
    }

    setVerifying(true);

    try {
      await publicApi.post('/api/users/set_password_with_invite/', {
        token,
        password,
      });

      console.log('パスワード設定成功');
      alert('パスワードが設定されました！ログイン画面に移動します。');
      navigate('/login');
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'パスワード設定に失敗しました');
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="loading-text">トークンを確認しています...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card error-card">
          <h2>エラー</h2>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/login')} className="back-button">
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <h1>Mind Status へようこそ！</h1>
        
        <div className="user-info">
          <p className="welcome-text">
            <strong>{userInfo?.full_name}</strong> 様
          </p>
          <p className="email-text">{userInfo?.email}</p>
        </div>

        <p className="instruction-text">
          パスワードを設定してアカウントを有効化してください
        </p>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上、大小文字・数字を含む"
              required
              disabled={verifying}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">パスワード（確認）</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力してください"
              required
              disabled={verifying}
            />
          </div>

          {passwordError && (
            <p className="error-text">{passwordError}</p>
          )}

          <div className="password-requirements">
            <p className="requirements-title">パスワードの要件:</p>
            <ul>
              <li className={password.length >= 8 ? 'valid' : ''}>
                8文字以上
              </li>
              <li className={/[A-Z]/.test(password) ? 'valid' : ''}>
                大文字を含む
              </li>
              <li className={/[a-z]/.test(password) ? 'valid' : ''}>
                小文字を含む
              </li>
              <li className={/[0-9]/.test(password) ? 'valid' : ''}>
                数字を含む
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="submit-button"
          >
            {verifying ? '設定中...' : 'パスワードを設定'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvitePage;
