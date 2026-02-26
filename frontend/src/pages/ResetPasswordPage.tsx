import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './InvitePage.css'; // 同じベーススタイルを再利用

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ページ表示時にトークンを検証
  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`/api/users/verify_invite/?token=${token}`);
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || 'トークンが無効です');
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) return 'パスワードは8文字以上で設定してください';
    if (!/[A-Z]/.test(pwd)) return 'パスワードには大文字を含めてください';
    if (!/[a-z]/.test(pwd)) return 'パスワードには小文字を含めてください';
    if (!/[0-9]/.test(pwd)) return 'パスワードには数字を含めてください';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    const validationError = validatePassword(password);
    if (validationError) { setPasswordError(validationError); return; }
    if (password !== confirmPassword) { setPasswordError('パスワードが一致しません'); return; }

    setSubmitting(true);
    try {
      await axios.post('/api/users/reset_password/', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'パスワード再設定に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // ロード中
  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="loading-text">トークンを確認しています...</p>
        </div>
      </div>
    );
  }

  // トークンエラー
  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card error-card">
          <h2>エラー</h2>
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/forgot-password')} className="back-button">
            もう一度リセット申請する
          </button>
        </div>
      </div>
    );
  }

  // 完了画面
  if (success) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <h1>パスワード再設定完了</h1>
          <div className="user-info">
            <p className="welcome-text" style={{ color: '#10B981' }}>
              新しいパスワードで設定しました
            </p>
          </div>
          <button onClick={() => navigate('/login')} className="submit-button">
            ログイン画面へ
          </button>
        </div>
      </div>
    );
  }

  // パスワード入力画面
  return (
    <div className="invite-page">
      <div className="invite-card">
        <h1>パスワード再設定</h1>
        <p className="instruction-text">新しいパスワードを設定してください</p>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="password">新しいパスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8文字以上、大小文字・数字を含む"
              required
              disabled={submitting}
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
              disabled={submitting}
            />
          </div>

          {passwordError && <p className="error-text">{passwordError}</p>}

          <div className="password-requirements">
            <p className="requirements-title">パスワードの要件:</p>
            <ul>
              <li className={password.length >= 8 ? 'valid' : ''}>8文字以上</li>
              <li className={/[A-Z]/.test(password) ? 'valid' : ''}>大文字を含む</li>
              <li className={/[a-z]/.test(password) ? 'valid' : ''}>小文字を含む</li>
              <li className={/[0-9]/.test(password) ? 'valid' : ''}>数字を含む</li>
            </ul>
          </div>

          <button type="submit" disabled={submitting} className="submit-button">
            {submitting ? '再設定中...' : 'パスワードを再設定'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
