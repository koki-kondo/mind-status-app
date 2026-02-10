import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

interface DashboardProps {
  setIsAuthenticated: (value: boolean) => void;
}

interface StatusLog {
  id: string;
  status: string;
  comment: string;
  created_at: string;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('GREEN');
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchStatusLogs();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = response.data;
      if (user && user.id) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const fetchStatusLogs = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/status/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStatusLogs(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch status logs:', error);
      setLoading(false);
    }
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        '/api/status/',
        {
          status: newStatus,
          comment: newComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setNewComment('');
      fetchStatusLogs();
      alert('ステータスを記録しました！');
    } catch (error) {
      console.error('Failed to submit status:', error);
      alert('ステータスの記録に失敗しました');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('本当にアカウントを削除しますか？\nこの操作は取り消せません。\n全てのステータス記録も削除されます。')) {
      return;
    }

    if (!window.confirm('最終確認：本当に削除してよろしいですか？')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/users/${userId}/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('アカウントを削除しました');
      handleLogout();
    } catch (error: any) {
      console.error('アカウント削除に失敗しました:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('アカウントの削除に失敗しました');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN':
        return '#10B981';
      case 'YELLOW':
        return '#F59E0B';
      case 'RED':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'GREEN':
        return '健康';
      case 'YELLOW':
        return '注意';
      case 'RED':
        return '警告';
      default:
        return status;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Mind Status</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/change-password')} className="change-pw-button">
            🔐 PW変更
          </button>
          <button onClick={handleDeleteAccount} className="delete-account-button">
            🗑️ アカウント削除
          </button>
          <button onClick={handleLogout} className="logout-button">
            ログアウト
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* ステータス入力フォーム */}
        <section className="status-form-section">
          <h2>今日のステータスを記録</h2>
          <form onSubmit={handleSubmitStatus} className="status-form">
            <div className="status-buttons">
              <button
                type="button"
                className={`status-btn status-green ${newStatus === 'GREEN' ? 'active' : ''}`}
                onClick={() => setNewStatus('GREEN')}
              >
                <span className="status-icon">〇</span>
                <span>健康</span>
              </button>
              <button
                type="button"
                className={`status-btn status-yellow ${newStatus === 'YELLOW' ? 'active' : ''}`}
                onClick={() => setNewStatus('YELLOW')}
              >
                <span className="status-icon">△</span>
                <span>注意</span>
              </button>
              <button
                type="button"
                className={`status-btn status-red ${newStatus === 'RED' ? 'active' : ''}`}
                onClick={() => setNewStatus('RED')}
              >
                <span className="status-icon">✕</span>
                <span>警告</span>
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="comment">コメント（任意）</label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="今日の気分や悩み事など..."
                rows={4}
              />
            </div>

            <button type="submit" className="submit-button">
              記録する
            </button>
          </form>
        </section>

        {/* ステータス履歴 */}
        <section className="status-history-section">
          <h2>ステータス履歴</h2>
          {loading ? (
            <p>読み込み中...</p>
          ) : statusLogs.length === 0 ? (
            <p>まだステータスが記録されていません</p>
          ) : (
            <div className="status-list">
              {statusLogs.map((log) => (
                <div key={log.id} className="status-item">
                  <div className="status-item-header">
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(log.status) }}
                    >
                      {getStatusLabel(log.status)}
                    </span>
                    <span className="status-date">
                      {new Date(log.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  {log.comment && (
                    <p className="status-comment">{log.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
