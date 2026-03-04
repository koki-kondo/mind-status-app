# Mind Status - デプロイ手順

本番環境（Render.com + Vercel）へのデプロイ手順を説明します。

---

## 🚀 デプロイ先

- **バックエンド**: Render.com（PostgreSQL内蔵、無料プラン）
- **フロントエンド**: Vercel（推奨）または Render.com
- **メール送信**: SendGrid（無料枠: 100通/日）

---

## 📝 デプロイ手順

### 準備: SendGrid アカウント作成

1. [SendGrid](https://signup.sendgrid.com/) でアカウント作成
2. メール認証完了
3. **Single Sender Verification**:
   - Settings → Sender Authentication → Single Sender Verification
   - From Address を認証
4. **API Key 取得**:
   - Settings → API Keys → Create API Key
   - Name: `Mind Status Production`
   - Permissions: **Full Access**
   - API Key をコピー（例: `SG.xxxxxxxxxxxxx...`）

---

### Step 1: GitHubにプッシュ

```bash
cd D:\ポートフォリオ\mind-status-app

# 初回の場合、Gitリポジトリを初期化
git init

# リモートリポジトリを追加
git remote add origin https://github.com/your-username/mind-status-app.git

# すべてのファイルを追加
git add .

# コミット
git commit -m "feat: 本番環境デプロイ準備完了"

# プッシュ
git push -u origin main
```

---

### Step 2: Render.com でバックエンドデプロイ

#### 2-1. PostgreSQL データベース作成

1. [Render.com](https://render.com) にログイン
2. ダッシュボードから **「New +」** → **「PostgreSQL」** を選択
3. 設定:
   - **Name**: `mind-status-db`
   - **Database**: `mindstatus`
   - **User**: `mindstatus`
   - **Region**: `Oregon (US West)` または最寄りのリージョン
   - **PostgreSQL Version**: `15`
   - **Instance Type**: **Free**
4. **「Create Database」** をクリック
5. 作成後、**Internal Database URL** をコピー
   - 形式: `postgresql://mindstatus:xxxxx@xxxxx.oregon-postgres.render.com/mindstatus`

#### 2-2. Web Service 作成

1. ダッシュボードから **「New +」** → **「Web Service」** を選択
2. **GitHubリポジトリを接続**
   - 対象のリポジトリ（`mind-status-app`）を選択
3. 設定:
   - **Name**: `mind-status-backend`
   - **Region**: `Oregon (US West)` （**DBと同じリージョン推奨**）
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`
   - **Instance Type**: **Free**

#### 2-3. 環境変数設定

**「Environment」** タブで以下を追加:

```env
# Django基本設定
DJANGO_SECRET_KEY=<ランダムな文字列を生成>
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
ALLOWED_HOSTS=mind-status-backend.onrender.com

# データベース
DATABASE_URL=<Step 2-1でコピーしたInternal Database URL>

# SendGrid（メール送信）
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# 管理者作成（初回デプロイ時のみ）
SUPERUSER_EMAIL=admin@example.com
SUPERUSER_PASSWORD=SecurePassword123!
SUPERUSER_NAME=管理者
SUPERUSER_ORG_NAME=本番組織
SUPERUSER_ORG_TYPE=COMPANY

# CORS設定（フロントエンドデプロイ後に更新）
CORS_ALLOWED_ORIGINS=https://your-frontend-app.vercel.app

# フロントエンドURL（フロントエンドデプロイ後に更新）
FRONTEND_URL=https://your-frontend-app.vercel.app
```

**SECRET_KEY 生成方法:**
```python
# Python で生成
import secrets
print(secrets.token_urlsafe(50))
```

#### 2-4. デプロイ完了確認

1. **Logs** タブで確認:
```
✅ Build completed successfully!
Running migrations:
  Applying api.0001_initial... OK
  Applying api.0002_invitetoken_token_type... OK
✅ 管理者ユーザー admin@example.com を作成しました
==> Your service is live 🎉
```

2. バックエンドURL を取得:
   - 例: `https://mind-status-backend.onrender.com`

---

### Step 3: Vercel でフロントエンドデプロイ

#### 3-1. Vercel プロジェクト作成

1. [Vercel](https://vercel.com) にログイン
2. **「Add New...」** → **「Project」** を選択
3. GitHubリポジトリを接続
4. 設定:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

#### 3-2. 環境変数設定

**「Environment Variables」** セクションで追加:

```env
REACT_APP_API_URL=https://mind-status-backend.onrender.com
```

#### 3-3. デプロイ

1. **「Deploy」** をクリック
2. デプロイ完了後、URLを取得
   - 例: `https://mind-status-app.vercel.app`

---

### Step 4: CORS設定の更新

フロントエンドのURLが確定したら、Render.com の環境変数を更新:

1. Render.com → `mind-status-backend` → **「Environment」** タブ
2. 以下を更新:

```env
CORS_ALLOWED_ORIGINS=https://mind-status-app.vercel.app
FRONTEND_URL=https://mind-status-app.vercel.app
```

3. **「Save Changes」** をクリック
4. 自動的に再デプロイが開始されます

---

### Step 5: 管理者環境変数の削除（セキュリティ）

初回デプロイ後、管理者作成用の環境変数を削除:

1. Render.com → `mind-status-backend` → **「Environment」** タブ
2. 以下を削除:
   - `SUPERUSER_EMAIL`
   - `SUPERUSER_PASSWORD`
   - `SUPERUSER_NAME`
   - `SUPERUSER_ORG_NAME`
   - `SUPERUSER_ORG_TYPE`
3. **「Save Changes」** をクリック

---

## ✅ 動作確認

### 1. バックエンド確認

```bash
# ヘルスチェック
curl https://mind-status-backend.onrender.com/api/

# 管理画面アクセス
https://mind-status-backend.onrender.com/admin
```

### 2. フロントエンド確認

```bash
# アクセス
https://mind-status-app.vercel.app
```

### 3. 管理者ログイン

```
Email: admin@example.com
Password: SecurePassword123!
```

### 4. 一括登録テスト

1. 管理者ダッシュボード → 「メンバー一括登録」
2. テストユーザー1件を登録
3. SendGrid → Activity で送信確認
4. メール受信確認

---

## 🔧 トラブルシューティング

### デプロイエラー

#### エラー: `No module named 'sendgrid'`

**原因:** requirements.txt に追加し忘れ

**解決:**
```bash
# backend/requirements.txt に追加
sendgrid==6.11.0

git add backend/requirements.txt
git commit -m "fix: sendgrid追加"
git push origin main
```

#### エラー: `CORS policy: No 'Access-Control-Allow-Origin'`

**原因:** CORS設定ミス

**解決:**
```env
# Render.com の環境変数を確認
CORS_ALLOWED_ORIGINS=https://正しいフロントエンドURL.vercel.app
```

### メール送信エラー

#### エラー: `The from email does not contain a valid address`

**原因:** SendGrid で認証されていないアドレス

**解決:**
1. SendGrid → Settings → Sender Authentication
2. `DEFAULT_FROM_EMAIL` のアドレスを認証
3. Render.com の環境変数を更新

#### エラー: `Forbidden` (401)

**原因:** API Key が無効

**解決:**
1. SendGrid で新しい API Key を生成
2. Render.com の `SENDGRID_API_KEY` を更新

### データベースエラー

#### エラー: `could not connect to server`

**原因:** DATABASE_URL が間違っている

**解決:**
1. Render.com → PostgreSQL → Internal Database URL をコピー
2. Render.com → Web Service → Environment で `DATABASE_URL` を更新

---

## 📊 Render.com 無料プランの制限

| 項目 | 制限 |
|------|------|
| **Web Service** | 月750時間（常時稼働可能） |
| **PostgreSQL** | 90日間無料 → 以降有料（$7/月）|
| **同時接続数** | 25接続 |
| **ストレージ** | 1GB |
| **帯域幅** | 100GB/月 |
| **スリープ** | 15分間アクセスなしでスリープ |

**注意:**
- 初回アクセス時、スリープ解除に30秒〜1分かかる場合があります
- PostgreSQL は90日後に有料（$7/月）に切り替わります

---

## 🎯 本番運用のベストプラクティス

### 1. 環境変数管理

- ✅ `DEBUG=False` を確認
- ✅ `SECRET_KEY` を定期的に変更
- ✅ 管理者環境変数をデプロイ後に削除

### 2. セキュリティ

- ✅ HTTPS 強制（Render.com/Vercelで自動）
- ✅ SendGrid API Key を定期的に再生成
- ✅ CORS設定を最小限に

### 3. モニタリング

- ✅ Render.com Logs で定期的にエラー確認
- ✅ SendGrid Activity で送信履歴確認
- ✅ PostgreSQL の使用量を確認（90日後課金注意）

### 4. バックアップ

```bash
# PostgreSQL バックアップ（ローカルで実行）
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

## 🔄 アップデート手順

```bash
# 1. コード修正
git add .
git commit -m "fix: バグ修正"
git push origin main

# 2. 自動デプロイ
# Render.com と Vercel が自動的に検知して再デプロイ

# 3. ログ確認
# Render.com → Logs タブ
# Vercel → Deployments タブ
```

---

## 📝 チェックリスト

### デプロイ前
- [ ] GitHubにプッシュ済み
- [ ] SendGrid アカウント作成
- [ ] SendGrid API Key 取得
- [ ] Sender Authentication 完了

### Render.com（バックエンド）
- [ ] PostgreSQL 作成
- [ ] Web Service 作成
- [ ] 環境変数設定（全項目）
- [ ] デプロイ成功確認
- [ ] 管理者作成確認
- [ ] 管理者環境変数削除

### Vercel（フロントエンド）
- [ ] プロジェクト作成
- [ ] 環境変数設定（`REACT_APP_API_URL`）
- [ ] デプロイ成功確認

### 動作確認
- [ ] 管理者ログイン成功
- [ ] 一括登録成功
- [ ] 招待メール送信成功
- [ ] 招待URL アクセス成功
- [ ] パスワード設定成功
- [ ] 一般ユーザーログイン成功

---

## 🎉 完了

デプロイ成功！本番環境で Mind Status が動作しています。

**本番URL:**
- フロントエンド: `https://mind-status-app.vercel.app`
- バックエンドAPI: `https://mind-status-backend.onrender.com/api`
- 管理画面: `https://mind-status-backend.onrender.com/admin`
