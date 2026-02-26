import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InvitePage.css'; // 同じベーススタイルを再利用

interface ChangePasswordPageProps {
  setIsAuthenticated: (value: boolean) => void;
}

const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) return 'パスワードは8文字以上で設定してください';
    if (!/[A-Z]/.test(pwd)) return 'パスワードには大文字を含めてください';
    if (!/[a-z]/.test(pwd)) return 'パスワードには小文字を含めてください';
    if (!/[0-9]/.test(pwd)) return 'パスワードには数字を含めてください';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword(newPassword);
    if (validationError) { setError(validationError); return; }
    if (newPassword !== confirmPassword) { setError('新しいパスワードが一致しません'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('/api/users/change_password/', {
        current_password: currentPassword,
        new_password: newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'パスワード変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 完了画面
  if (success) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <h1>パスワード変更完了</h1>
          <div className="user-info">
            <p className="welcome-text" style={{ color: '#10B981' }}>
              新しいパスワードに変更しました
            </p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="submit-button">
            ダッシュボードへ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <h1>パスワード変更</h1>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">現在のパスワード</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="現在のパスワード"
              required
              disabled={loading}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '8px 0' }} />

          <div className="form-group">
            <label htmlFor="newPassword">新しいパスワード</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8文字以上、大小文字・数字を含む"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">新しいパスワード（確認）</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力してください"
              required
              disabled={loading}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="password-requirements">
            <p className="requirements-title">パスワードの要件:</p>
            <ul>
              <li className={newPassword.length >= 8 ? 'valid' : ''}>8文字以上</li>
              <li className={/[A-Z]/.test(newPassword) ? 'valid' : ''}>大文字を含む</li>
              <li className={/[a-z]/.test(newPassword) ? 'valid' : ''}>小文字を含む</li>
              <li className={/[0-9]/.test(newPassword) ? 'valid' : ''}>数字を含む</li>
            </ul>
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? '変更中...' : 'パスワードを変更'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
            style={{ color: '#667eea', textDecoration: 'none' }}
          >
            ← ダッシュボードへ戻る
          </a>
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
