import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './InvitePage.css'; // 同じベーススタイルを再利用

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/users/request_password_reset/', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 送信完了画面
  if (submitted) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <h1>📧 メール送信完了</h1>
          <div className="user-info">
            <p className="welcome-text" style={{ color: '#10B981' }}>
              リセットリンクが送られました
            </p>
            <p className="email-text">
              メールボックスを確認してください。<br />
              メールが見つからない場合はスパム/迷惑メールフォルダも確認してください。
            </p>
          </div>
          <button onClick={() => navigate('/login')} className="submit-button">
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  // メールアドレス入力画面
  return (
    <div className="invite-page">
      <div className="invite-card">
        <h1>🔑 パスワード忘れ</h1>
        <p className="instruction-text">
          登録メールアドレスを入力してください。<br />
          パスワード再設定のリンクを送信します。
        </p>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? '送信中...' : 'リセットリンクを送信'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#667eea', textDecoration: 'none' }}>
            ← ログイン画面へ戻る
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
