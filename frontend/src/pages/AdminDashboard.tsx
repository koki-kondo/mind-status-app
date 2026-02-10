import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import UserBulkUpload from '../components/UserBulkUpload';
import StatusTrend from '../components/StatusTrend';
import './AdminDashboard.css';

interface AdminDashboardProps {
  setIsAuthenticated: (value: boolean) => void;
}

interface DashboardSummary {
  total_users: number;
  today_recorded: number;
  red_alerts: number;
  status_distribution: {
    GREEN: number;
    YELLOW: number;
    RED: number;
  };
  date: string;
}

interface Alert {
  id: string;
  user_name: string;
  department: string;
  comment: string;
  created_at: string;
}

interface UserStatus {
  id: string;
  full_name: string;
  email: string;
  // 企業用
  department: string;
  position: string;
  // 学校用
  grade: number | null;
  class_name: string;
  latest_status: string | null;
  latest_comment: string | null;
  latest_date: string | null;
}

const COLORS = {
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  RED: '#EF4444'
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [userStatuses, setUserStatuses] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [orgType, setOrgType] = useState<'SCHOOL' | 'COMPANY'>('COMPANY'); // 組織タイプ
  const [userId, setUserId] = useState<string>(''); // 自分のユーザーID
  
  // フィルタ用state
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all'); // 学年フィルター
  const [classFilter, setClassFilter] = useState<string>('all'); // クラスフィルター
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // CSV出力期間選択用state
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, alertsRes, usersRes, userInfoRes] = await Promise.all([
        axios.get('/api/status/dashboard_summary/', { headers }),
        axios.get('/api/status/alerts/', { headers }),
        axios.get('/api/status/user_latest_status/', { headers }),
        axios.get('/api/users/me/', { headers }) // 自分の情報を取得
      ]);

      setSummary(summaryRes.data);
      setAlerts(alertsRes.data);
      setUserStatuses(usersRes.data);
      
      // 組織タイプとユーザーIDを設定
      const currentUser = userInfoRes.data;
      if (currentUser) {
        if (currentUser.organization_type) {
          setOrgType(currentUser.organization_type);
        }
        if (currentUser.id) {
          setUserId(currentUser.id);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('本当に自分のアカウントを削除しますか？\nこの操作は取り消せません。\n組織の全データも削除される可能性があります。')) {
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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`本当に ${userName} さんを削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/users/${userId}/delete_user/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`${userName} さんを削除しました`);
      fetchDashboardData(); // データを再取得
    } catch (error: any) {
      console.error('ユーザー削除に失敗しました:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('ユーザーの削除に失敗しました');
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      
      if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }
      
      if (departmentFilter !== 'all') {
        params.append('department', departmentFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const url = `/api/status/export_csv/?${params.toString()}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      
      let filename;
      if (startDate && endDate) {
        filename = `user_status_${startDate}_${endDate}.xlsx`;
      } else {
        const date = new Date().toISOString().split('T')[0];
        filename = `user_status_latest_${date}.xlsx`;
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      
      setShowDatePicker(false);
      setStartDate('');
      setEndDate('');
    } catch (error) {
      console.error('Excel出力に失敗しました:', error);
      alert('Excel出力に失敗しました');
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return '#9CA3AF';
    return COLORS[status as keyof typeof COLORS] || '#9CA3AF';
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return '未記録';
    const labels: { [key: string]: string } = {
      GREEN: '健康',
      YELLOW: '注意',
      RED: '警告'
    };
    return labels[status] || status;
  };

  // フィルタ適用
  const filteredUsers = userStatuses.filter(user => {
    // 企業向けフィルター
    if (orgType === 'COMPANY' && departmentFilter !== 'all' && user.department !== departmentFilter) return false;
    
    // 学校向けフィルター
    if (orgType === 'SCHOOL') {
      if (gradeFilter !== 'all' && user.grade?.toString() !== gradeFilter) return false;
      if (classFilter !== 'all' && user.class_name !== classFilter) return false;
    }
    
    if (statusFilter !== 'all' && user.latest_status !== statusFilter) return false;
    if (searchQuery && !user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // 部署一覧を取得（ユニーク）
  const departments = Array.from(new Set(userStatuses.map(u => u.department).filter(d => d && d !== '-')));
  
  // 学年一覧を取得（ユニーク）
  const grades = Array.from(new Set(userStatuses.map(u => u.grade).filter((g): g is number => g !== null && g !== undefined))).sort((a, b) => a - b);
  
  // クラス一覧を取得（ユニーク）
  const classes = Array.from(new Set(userStatuses.map(u => u.class_name).filter(c => c && c !== '-')));

  // 円グラフ用データ
  const chartData = summary ? [
    { name: '健康', value: summary.status_distribution.GREEN, color: COLORS.GREEN },
    { name: '注意', value: summary.status_distribution.YELLOW, color: COLORS.YELLOW },
    { name: '警告', value: summary.status_distribution.RED, color: COLORS.RED }
  ].filter(item => item.value > 0) : [];

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="admin-dashboard">
        <header className="admin-header">
          <h1>Mind Status - 管理者ダッシュボード</h1>
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

        <div className="admin-content">
          {/* ナビゲーションタブ */}
          <div className="admin-tabs">
            <button 
              className={`tab-button ${!showBulkUpload ? 'active' : ''}`}
              onClick={() => setShowBulkUpload(false)}
            >
              📊 ダッシュボード
            </button>
            <button 
              className={`tab-button ${showBulkUpload ? 'active' : ''}`}
              onClick={() => setShowBulkUpload(true)}
            >
              📤 ユーザー一括登録
            </button>
          </div>

          {/* 一括登録画面 */}
          {showBulkUpload ? (
            <UserBulkUpload onSuccess={fetchDashboardData} />
          ) : (
            <>
              {/* サマリーカード */}
              <div className="summary-cards">
                <div className="summary-card">
                  <div className="card-icon">👥</div>
                  <div className="card-content">
                    <h3>登録ユーザー数</h3>
                    <p className="card-number">{summary?.total_users || 0}</p>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">✅</div>
                  <div className="card-content">
                    <h3>本日の記録数</h3>
                    <p className="card-number">{summary?.today_recorded || 0}</p>
                  </div>
                </div>

                <div className="summary-card alert-card">
                  <div className="card-icon">🚨</div>
                  <div className="card-content">
                    <h3>警告アラート</h3>
                    <p className="card-number">{summary?.red_alerts || 0}</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                {/* 円グラフ */}
                <section className="chart-section">
                  <h2>本日のステータス分布</h2>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-data">本日のデータがありません</p>
                  )}
                </section>

                {/* アラート一覧 */}
                <section className="alerts-section">
                  <h2>🚨 警告アラート ({alerts.length}件)</h2>
                  {alerts.length > 0 ? (
                    <div className="alerts-list">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="alert-item">
                          <div className="alert-header">
                            <strong>{alert.user_name}</strong>
                            <span className="alert-dept">{alert.department}</span>
                          </div>
                          {alert.comment && (
                            <p className="alert-comment">{alert.comment}</p>
                          )}
                          <span className="alert-time">
                            {new Date(alert.created_at).toLocaleString('ja-JP')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">警告アラートはありません</p>
                  )}
                </section>
              </div>

              {/* 時系列グラフ */}
              <div className="trend-section">
                <StatusTrend />
              </div>

              {/* ユーザー一覧 */}
              <section className="users-section">
                <div className="users-section-header">
                  <h2>全ユーザーステータス</h2>
                  <div className="export-controls">
                    <button 
                      onClick={() => setShowDatePicker(!showDatePicker)} 
                      className="export-button period-toggle"
                    >
                      📅 期間指定出力
                    </button>
                    <button onClick={handleExportCSV} className="export-button">
                      📥 最新Excel出力
                    </button>
                  </div>
                </div>
                
                {/* 期間選択UI */}
                {showDatePicker && (
                  <div className="date-picker-container">
                    <div className="date-picker-group">
                      <label>開始日:</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                    <div className="date-picker-group">
                      <label>終了日:</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                    <button 
                      onClick={handleExportCSV} 
                      disabled={!startDate || !endDate}
                      className="export-button execute-btn"
                    >
                      📥 期間指定で出力
                    </button>
                  </div>
                )}
                
                {/* フィルタUI */}
                <div className="filters-container">
                  {orgType === 'COMPANY' ? (
                    <div className="filter-group">
                      <label>部署:</label>
                      <select 
                        value={departmentFilter} 
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">全て</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="filter-group">
                        <label>学年:</label>
                        <select 
                          value={gradeFilter} 
                          onChange={(e) => setGradeFilter(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">全て</option>
                          {grades.map(grade => (
                            <option key={grade} value={grade.toString()}>{grade}年</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group">
                        <label>組・クラス:</label>
                        <select 
                          value={classFilter} 
                          onChange={(e) => setClassFilter(e.target.value)}
                          className="filter-select"
                        >
                          <option value="all">全て</option>
                          {classes.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="filter-group">
                    <label>ステータス:</label>
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">全て</option>
                      <option value="GREEN">健康</option>
                      <option value="YELLOW">注意</option>
                      <option value="RED">警告</option>
                    </select>
                  </div>

                  <div className="filter-group search-group">
                    <label>検索:</label>
                    <input
                      type="text"
                      placeholder="名前で検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="filter-search"
                    />
                  </div>

                  <div className="filter-results">
                    {filteredUsers.length}件 / {userStatuses.length}件
                  </div>
                </div>

                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>氏名</th>
                        {orgType === 'SCHOOL' ? (
                          <>
                            <th>学年</th>
                            <th>組・クラス</th>
                          </>
                        ) : (
                          <>
                            <th>所属・部署</th>
                            <th>役職</th>
                          </>
                        )}
                        <th>最新ステータス</th>
                        <th>コメント</th>
                        <th>記録日時</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.full_name}</td>
                          {orgType === 'SCHOOL' ? (
                            <>
                              <td>{user.grade || '-'}</td>
                              <td>{user.class_name || '-'}</td>
                            </>
                          ) : (
                            <>
                              <td>{user.department || '-'}</td>
                              <td>{user.position || '-'}</td>
                            </>
                          )}
                          <td>
                            {user.latest_status ? (
                              <span
                                className="status-badge"
                                style={{ backgroundColor: getStatusColor(user.latest_status) }}
                              >
                                {getStatusLabel(user.latest_status)}
                              </span>
                            ) : (
                              <span className="status-badge-gray">未記録</span>
                            )}
                          </td>
                          <td className="comment-cell">
                            {user.latest_comment || '-'}
                          </td>
                          <td className="date-cell">
                            {user.latest_date 
                              ? new Date(user.latest_date).toLocaleString('ja-JP')
                              : '-'
                            }
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              className="delete-user-button"
                              title="ユーザーを削除"
                            >
                              🗑️ 削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

    </>
  );
};

export default AdminDashboard;
