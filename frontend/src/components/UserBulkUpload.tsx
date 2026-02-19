import React, { useState, useRef } from 'react';
import axios from 'axios';
import './UserBulkUpload.css';

interface UserBulkUploadProps {
  onSuccess?: () => void;
}

interface UploadResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    row: number;
    email?: string;
    error: string;
  }>;
}

const UserBulkUpload: React.FC<UserBulkUploadProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const resetFileInput = () => {
    // file input の value をリセット（再選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    // setResult(null) は削除（結果表示を維持するため）
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/users/csv_template/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      // ダウンロード処理
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('テンプレートのダウンロードに失敗しました:', error);
      alert('テンプレートのダウンロードに失敗しました');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('ファイルを選択してください');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/users/bulk_upload/', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      
      if (response.data.error_count === 0) {
        // alert は削除（結果UIで統一）
        resetFileInput();  // file input のみリセット
        
        // 親コンポーネントに成功を通知
        if (onSuccess) {
          onSuccess();
        }
      } else if (response.data.success_count > 0) {
        // 一部成功の場合も通知
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('アップロードに失敗しました:', error);
      
      // エラーの種類に応じた表示
      if (error.response?.status === 400) {
        // バリデーションエラー
        const errorData = error.response.data;
        
        if (errorData.error) {
          // 単一エラーメッセージ
          alert(`⚠️ アップロードエラー\n\n${errorData.error}`);
        } else if (errorData.errors && errorData.errors.length > 0) {
          // 複数行エラー（セキュリティエラーを含む）
          const firstError = errorData.errors[0];
          const totalErrors = errorData.errors.length;
          
          // セキュリティエラーの検出
          const isSecurityError = firstError.error.includes('禁止されたフィールド') || 
                                   firstError.error.includes('不正なフィールド') ||
                                   firstError.error.includes('使用できない');
          
          if (isSecurityError) {
            alert(
              `🔒 セキュリティエラー\n\n` +
              `${firstError.error}\n\n` +
              `詳細: 行${firstError.row}\n` +
              `※ファイルに不正なフィールドが含まれています。\n` +
              `公式テンプレートをご使用ください。`
            );
          } else {
            alert(
              `⚠️ データエラー（${totalErrors}件）\n\n` +
              `最初のエラー: ${firstError.error}\n` +
              `行: ${firstError.row}\n\n` +
              `詳細はエラーリストをご確認ください。`
            );
          }
          
          // エラー詳細をresultに保存
          setResult(errorData);
        } else {
          alert('アップロードに失敗しました');
        }
      } else if (error.response?.status === 403) {
        alert('⛔ 権限エラー\n\n管理者のみがユーザー一括登録を実行できます。');
      } else {
        alert(`❌ エラー\n\n${error.response?.data?.error || 'アップロードに失敗しました'}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-header">
        <h2>ユーザー登録（Excel/CSV）</h2>
        <button onClick={handleDownloadTemplate} className="template-button">
          📥 テンプレートをダウンロード（Excel）
        </button>
      </div>

      <div className="upload-instructions">
        <h3>📝 使い方</h3>
        <ol>
          <li>「テンプレートをダウンロード」ボタンで Excel ファイルをダウンロード</li>
          <li>Excel ファイル内の<strong>学校向け</strong>または<strong>企業向け</strong>シートを使用</li>
          <li>サンプル行（3行目以降）を参考にユーザー情報を入力</li>
          <li>Excel または CSV 形式で保存してアップロード</li>
          <li>「登録実行」ボタンをクリック</li>
        </ol>
        
        <div className="required-fields">
          <h4>📋 Excel テンプレート構成</h4>
          <ul style={{ fontSize: '14px' }}>
            <li><strong>シート1 - 学校向け:</strong> 学籍番号、氏名、フリガナ、学年、組、性別、生年月日、メールアドレス</li>
            <li><strong>シート2 - 企業向け:</strong> 社員番号、氏名、フリガナ、所属、役職、性別、生年月日、メールアドレス</li>
          </ul>
          <p style={{ fontSize: '13px', color: '#999', marginTop: '12px' }}>
            ※必須項目: <strong>氏名</strong>、<strong>メールアドレス</strong><br />
            ※2行目の英語キーを削除しないでください（システム処理に使用）
          </p>
        </div>
      </div>

      <div className="upload-section">
        <div className="file-input-container">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            id="csv-file"
            disabled={uploading}
          />
          <label htmlFor="csv-file" className="file-label">
            {file ? `📄 ${file.name}` : '📁 Excel/CSV ファイルを選択'}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="upload-button"
        >
          {uploading ? 'アップロード中...' : '登録実行'}
        </button>
      </div>

      {result && (
        <div className="result-section">
          <h3>登録結果</h3>
          <div className="result-summary">
            <div className="result-card success">
              <span className="result-icon">✅</span>
              <div>
                <p className="result-label">成功</p>
                <p className="result-number">{result.success_count}件</p>
              </div>
            </div>
            <div className="result-card error">
              <span className="result-icon">❌</span>
              <div>
                <p className="result-label">失敗</p>
                <p className="result-number">{result.error_count}件</p>
              </div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="error-list">
              <h4>エラー詳細</h4>
              <table className="error-table">
                <thead>
                  <tr>
                    <th>行番号</th>
                    <th>メールアドレス</th>
                    <th>エラー内容</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((error, index) => (
                    <tr key={index}>
                      <td>{error.row}</td>
                      <td>{error.email || '-'}</td>
                      <td>{error.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserBulkUpload;
