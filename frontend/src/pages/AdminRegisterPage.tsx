import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import './AdminRegisterPage.css';

const AdminRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    full_name: '',
    organization_name: '',
    org_type: 'SCHOOL' as 'SCHOOL' | 'COMPANY'
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // パスワード強度チェック
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    match: formData.password === formData.passwordConfirm && formData.password !== ''
  };

  const isPasswordValid = Object.values(passwordChecks).every(check => check);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // バリデーション
    const newErrors: string[] = [];
    
    if (!formData.email) newErrors.push('メールアドレスを入力してください');
    if (!formData.full_name) newErrors.push('氏名を入力してください');
    if (!formData.organization_name) newErrors.push('組織名を入力してください');
    if (!isPasswordValid) newErrors.push('パスワードの要件を満たしてください');
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // ✅ 修正: 環境変数を使用 & エンドポイント名を修正
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/admin_register/`, {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        organization_name: formData.organization_name,
        org_type: formData.org_type
      });

      if (response.data.success) {
        alert(`管理者アカウントが作成されました！\n\n組織: ${response.data.user.organization}\nタイプ: ${response.data.user.organization_type === 'SCHOOL' ? '学校' : '企業'}\n\nログインしてください。`);
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.errors) {
        const apiErrors = error.response.data.errors;
        const errorMessages: string[] = [];
        
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(...apiErrors[key]);
          } else {
            errorMessages.push(apiErrors[key]);
          }
        });
        
        setErrors(errorMessages);
      } else if (error.response?.data?.error) {
        setErrors([error.response.data.error]);
      } else {
        setErrors(['登録に失敗しました。もう一度お試しください。']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-register-page">
      <div className="admin-register-card">
        <h1>管理者アカウント登録</h1>
        <p className="subtitle">組織とアカウントを作成します</p>

        {errors.length > 0 && (
          <div className="error-box">
            {errors.map((error, index) => (
              <p key={index}>• {error}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 組織情報 */}
          <div className="form-section">
            <h3>📋 組織情報</h3>
            
            <div className="form-group">
              <label>組織名 *</label>
              <input
                type="text"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="例: 〇〇高校 / 〇〇株式会社"
                required
              />
            </div>

            <div className="form-group">
              <label>組織タイプ *</label>
              <div className="org-type-selector">
                <label className={`org-type-option ${formData.org_type === 'SCHOOL' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="org_type"
                    value="SCHOOL"
                    checked={formData.org_type === 'SCHOOL'}
                    onChange={handleChange}
                  />
                  <div className="org-type-card">
                    <span className="org-type-icon">🏫</span>
                    <span className="org-type-label">学校</span>
                  </div>
                </label>
                <label className={`org-type-option ${formData.org_type === 'COMPANY' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="org_type"
                    value="COMPANY"
                    checked={formData.org_type === 'COMPANY'}
                    onChange={handleChange}
                  />
                  <div className="org-type-card">
                    <span className="org-type-icon">🏢</span>
                    <span className="org-type-label">企業</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* アカウント情報 */}
          <div className="form-section">
            <h3>👤 アカウント情報</h3>
            
            <div className="form-group">
              <label>氏名 *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="例: 田中太郎"
                required
              />
            </div>

            <div className="form-group">
              <label>メールアドレス *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="例: admin@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>パスワード *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="8文字以上"
                required
              />
            </div>

            <div className="form-group">
              <label>パスワード（確認） *</label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="もう一度入力"
                required
              />
            </div>

            {/* パスワード要件チェック */}
            {formData.password && (
              <div className="password-requirements">
                <p className="requirements-title">パスワード要件:</p>
                <div className={`requirement ${passwordChecks.length ? 'met' : ''}`}>
                  {passwordChecks.length ? '✓' : '○'} 8文字以上
                </div>
                <div className={`requirement ${passwordChecks.uppercase ? 'met' : ''}`}>
                  {passwordChecks.uppercase ? '✓' : '○'} 大文字を含む
                </div>
                <div className={`requirement ${passwordChecks.lowercase ? 'met' : ''}`}>
                  {passwordChecks.lowercase ? '✓' : '○'} 小文字を含む
                </div>
                <div className={`requirement ${passwordChecks.number ? 'met' : ''}`}>
                  {passwordChecks.number ? '✓' : '○'} 数字を含む
                </div>
                <div className={`requirement ${passwordChecks.match ? 'met' : ''}`}>
                  {passwordChecks.match ? '✓' : '○'} パスワードが一致
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={isLoading || !isPasswordValid}
          >
            {isLoading ? '登録中...' : '管理者アカウントを作成'}
          </button>
        </form>

        <div className="login-link">
          既にアカウントをお持ちですか？ <a href="/login">ログイン</a>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
