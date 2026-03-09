# Mind Status - デプロイガイド

本番環境へのデプロイ手順を説明します。

---

## 📋 デプロイ構成

```
GitHub Repository
    │
    ├─→ Vercel (Frontend)
    │     React SPA
    │
    └─→ Render.com (Backend)
          Django REST API + PostgreSQL
          └─→ SendGrid (Email)
```

### 使用サービス

- **Vercel**: フロントエンド（無料プラン）
- **Render.com**: バックエンド + PostgreSQL（無料プラン）
- **SendGrid**: メール送信（無料枠: 100通/日）

---

## 🚀 デプロイ手順

### 1. SendGrid セットアップ

[SendGrid](https://signup.sendgrid.com/) でアカウント作成後:

1. **Sender Authentication** で送信元メールアドレスを認証
2. **API Key** を作成（Full Access）
3. API Key をコピー（例: `SG.xxxxxxxxxxxxx`）

---

### 2. GitHub にプッシュ

```bash
git add .
git commit -m "deploy: production setup"
git push origin main
```

---

### 3. Render.com - データベース作成

1. [Render.com](https://render.com) で **New +** → **PostgreSQL**
2. 設定:
   - Name: `mind-status-db`
   - Region: `Oregon (US West)`
   - Instance Type: **Free**
3. 作成後、**Internal Database URL** をコピー

---

### 4. Render.com - バックエンドデプロイ

1. **New +** → **Web Service**
2. GitHubリポジトリを接続
3. 設定:
   - Name: `mind-status-backend`
   - Region: `Oregon (US West)`（DBと同じ）
   - Root Directory: `backend`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
4. **Environment Variables** を設定:

```env
DJANGO_SECRET_KEY=<ランダム文字列>
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
ALLOWED_HOSTS=mind-status-backend.onrender.com
DATABASE_URL=<Step 3でコピーしたURL>
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

**SECRET_KEY 生成:**
```bash
python - <<EOF
import secrets
print(secrets.token_urlsafe(50))
EOF
```

5. **Deploy** をクリック

---

### 5. Render.com - 管理者作成

デプロイ完了後、**Shell** タブで実行:

```bash
python manage.py createsuperuser
```

対話形式で入力:
```
Email: admin@example.com
Full name: 管理者
Password: <強力なパスワード>
Organization name: 本番組織
Organization type (SCHOOL/COMPANY): COMPANY
```

---

### 6. Vercel - フロントエンドデプロイ

1. [Vercel](https://vercel.com) で **New Project**
2. GitHubリポジトリを接続
3. 設定:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
4. **Environment Variables** を追加:

```env
REACT_APP_API_URL=https://mind-status-backend.onrender.com
```

5. **Deploy** をクリック

---

### 7. CORS設定の更新

Render.com → Web Service → **Environment** で更新:

```env
CORS_ALLOWED_ORIGINS=https://mind-status-app.vercel.app
FRONTEND_URL=https://mind-status-app.vercel.app
```

**Save Changes** → 自動再デプロイ

---

## ✅ 動作確認

### 1. バックエンド確認

```bash
curl https://mind-status-backend.onrender.com/api/
```

### 2. 管理画面ログイン

```
URL: https://mind-status-backend.onrender.com/admin
Email: admin@example.com
Password: <Step 5で設定したパスワード>
```

### 3. フロントエンドアクセス

```
https://mind-status-app.vercel.app
```

### 4. 招待メールテスト

1. 管理者ダッシュボード → 一括登録
2. テストユーザーを登録
3. SendGrid → Activity で送信確認

---

## 🔧 トラブルシューティング

### CORS エラー

**症状:** `No 'Access-Control-Allow-Origin'`

**解決:**
```env
CORS_ALLOWED_ORIGINS=https://正しいURL.vercel.app
```

### メール送信エラー

**症状:** `The from email does not contain a valid address`

**解決:**
SendGrid で `DEFAULT_FROM_EMAIL` のアドレスを認証

### データベース接続エラー

**症状:** `could not connect to server`

**解決:**
`DATABASE_URL` が正しいか確認（Render.com → PostgreSQL → Internal URL）

---

## 📊 無料プランの制限

| サービス | 制限 |
|---------|------|
| Render (Web) | 月750時間 |
| Render (DB) | 90日間無料 → 以降 $7/月 |
| Vercel | デプロイ 100回/日 |
| SendGrid | 100通/日 |

**注意:**

Render.com 無料プランでは  
15分間アクセスがないとサービスがスリープします。

初回アクセス時は起動のため  
**30〜60秒程度**かかる場合があります。

---

## 🔄 アップデート

```bash
git add .
git commit -m "fix: 修正内容"
git push origin main
```

→ Render.com / Vercel が自動デプロイ

---

## 📝 デプロイチェックリスト

- [ ] SendGrid アカウント作成
- [ ] GitHub にプッシュ
- [ ] Render.com - PostgreSQL 作成
- [ ] Render.com - Web Service 作成
- [ ] Render.com - 環境変数設定
- [ ] Render.com - 管理者作成
- [ ] Vercel - フロントエンドデプロイ
- [ ] CORS設定更新
- [ ] 動作確認（4項目）

---

## 🎉 完了

本番環境で稼働しています。

- **Frontend**: https://mind-status-app.vercel.app
- **Backend**: https://mind-status-backend.onrender.com/api
- **Admin**: https://mind-status-backend.onrender.com/admin
