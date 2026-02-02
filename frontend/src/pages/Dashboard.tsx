import React, { useState, useEffect } from 'react';
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
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('GREEN');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchStatusLogs();
  }, []);

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
        <button onClick={handleLogout} className="logout-button">
          ログアウト
        </button>
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
                <span className="status-icon">😊</span>
                <span>健康</span>
              </button>
              <button
                type="button"
                className={`status-btn status-yellow ${newStatus === 'YELLOW' ? 'active' : ''}`}
                onClick={() => setNewStatus('YELLOW')}
              >
                <span className="status-icon">😐</span>
                <span>注意</span>
              </button>
              <button
                type="button"
                className={`status-btn status-red ${newStatus === 'RED' ? 'active' : ''}`}
                onClick={() => setNewStatus('RED')}
              >
                <span className="status-icon">😞</span>
                <span>警告</span>
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="comment">コメント（任意）</label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="今日の気分や体調について..."
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
