# Mind Status - デプロイ手順

## 🚀 Render.com へのデプロイ

### 前提条件
- GitHubアカウント
- Render.comアカウント（無料）

---

## 📝 手順

### 1. GitHubにプッシュ

```bash
cd D:\ポートフォリオ\mind-status-app
git add .
git commit -m "feat: 本番環境デプロイ準備完了"
git push origin main
```

### 2. Render.com でデータベース作成

1. [Render.com](https://render.com) にログイン
2. 「New +」→「PostgreSQL」を選択
3. 設定:
   - Name: `mind-status-db`
   - Database: `mindstatus`
   - User: `mindstatus`
   - Region: `Oregon (US West)`
   - Instance Type: **Free**
4. 「Create Database」をクリック
5. 作成後、**Internal Database URL** をコピー

### 3. Render.com でWebサービス作成

1. 「New +」→「Web Service」を選択
2. GitHubリポジトリを接続
3. 設定:
   - Name: `mind-status-backend`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Python 3`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn config.wsgi:application`
   - Instance Type: **Free**

### 4. 環境変数設定

「Environment」タブで以下を追加:

```
DJANGO_SECRET_KEY=ランダムな文字列（自動生成可）
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
ALLOWED_HOSTS=your-app-name.onrender.com
DATABASE_URL=（手順2でコピーしたURL）
CORS_ALLOWED_ORIGINS=https://your-frontend-app.onrender.com
```

### 5. デプロイ実行

「Create Web Service」をクリック → 自動デプロイ開始

---

## ✅ 確認

デプロイ完了後:
1. `https://your-app-name.onrender.com/admin` にアクセス
2. 管理画面が表示されればOK!

---

## 🔧 初期設定

### スーパーユーザー作成

Render.com のシェルで実行:

```bash
python manage.py shell

from api.models import User, Organization

# 組織作成
org = Organization.objects.create(
    name='本番組織',
    org_type='COMPANY'
)

# 管理者作成
User.objects.create_superuser(
    email='admin@example.com',
    full_name='管理者',
    password='AdminPassword123!',
    organization=org,
    role='ADMIN',
    is_activated=True
)

exit()
```

---

## 📊 フロントエンドデプロイ

Render.com または Vercel でデプロイ可能（別途手順）

---

## 🐛 トラブルシューティング

### ビルドエラー
- Logs を確認
- `build.sh` の権限確認: `chmod +x build.sh`

### データベース接続エラー
- DATABASE_URL が正しいか確認
- データベースが起動しているか確認

### 静的ファイルが表示されない
- `collectstatic` が実行されたか確認
- STATIC_ROOT の設定確認
