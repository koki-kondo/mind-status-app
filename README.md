# Mind Status

**組織内メンタルヘルス管理システム**

Django REST Framework + React (TypeScript) による 
**フルスタックSPAアプリケーション**

学校や企業において、メンバー（生徒・従業員）が日々のメンタル・体調状態を記録し、  
管理者（教師・管理職）が早期に異変に気づけるWebアプリケーションです。

---

## ✨ 主な機能

### ユーザー機能

- ステータス記録（〇 / △ / ✕ + コメント）
- ステータス履歴の確認
- パスワード変更

### 管理者機能

- 組織全体の状態を可視化するダッシュボード
- Excel / CSV によるメンバー一括登録
- ステータストレンド分析
- データのExcelエクスポート

### 招待システム

- メール招待によるユーザー登録
- トークンベースの安全な招待フロー
- SendGridによるメール送信

### パスワードリセット

- トークンベースリセット
- メールによるリセットリンク送信
- 二段階検証フロー

---

## 🛠 技術スタック

### Frontend

- React 18
- TypeScript
- React Router v6
- Axios
- Recharts

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- JWT (SimpleJWT)
- SendGrid
- openpyxl

### Infrastructure

- Vercel (Frontend)
- Render (Backend + PostgreSQL)
- SendGrid (Email)
- Docker / Docker Compose

---

## 📂 ディレクトリ構成

```

mind-status-app
│
├─ backend
│  ├─ Dockerfile
│  ├─ build.sh
│  ├─ manage.py
│  ├─ requirements.txt
│  │
│  ├─ api
│  │  ├─ models.py
│  │  ├─ serializers.py
│  │  ├─ views.py
│  │  ├─ urls.py
│  │  ├─ validators.py
│  │  ├─ admin.py
│  │  └─ utils
│  │     └─ email.py
│  │
│  └─ config
│     ├─ urls.py
│     ├─ asgi.py
│     ├─ wsgi.py
│     └─ settings
│        ├─ base.py
│        ├─ development.py
│        └─ production.py
│
├─ frontend
│  ├─ Dockerfile
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vercel.json
│  │
│  ├─ public
│  │  └─ index.html
│  │
│  └─ src
│     ├─ api
│     │  ├─ client.ts
│     │  └─ public.ts
│     │
│     ├─ components
│     │  ├─ InviteRouteHandler.tsx
│     │  ├─ StatusTrend.tsx
│     │  └─ UserBulkUpload.tsx
│     │
│     └─ pages
│        ├─ Login.tsx
│        ├─ Dashboard.tsx
│        ├─ AdminDashboard.tsx
│        ├─ AdminRegisterPage.tsx
│        ├─ InvitePage.tsx
│        ├─ ForgotPasswordPage.tsx
│        ├─ ResetPasswordPage.tsx
│        └─ ChangePasswordPage.tsx
│
├─ docs
│  └─ screenshots
│     ├─ login.png
│     ├─ admin-dashboard.png
│     ├─ bulk-upload.png
│     └─ user-dashboard.png
│
├─ docker-compose.yml
├─ render.yaml
├─ DEPLOY.md
└─ README.md
```

---

## 🎯 公開デモ

実際に操作できる公開環境です。

- **Frontend**: https://mind-status-app.vercel.app

### テストアカウント

```
学校管理者:
school_admin@example.com
testSchool123

学校ユーザー:
school_user@example.com
testSchool123

企業管理者:
company_admin@example.com
testCompany123

企業ユーザー:
company_user@example.com
testCompany123

```

---

## 📱 アプリ画面

### ログイン画面
![ログイン画面](./docs/screenshots/login.png)

### 管理者ダッシュボード
![管理者ダッシュボード](./docs/screenshots/admin-dashboard.png)

### 一括登録
![一括登録](./docs/screenshots/bulk-upload.png)

### ユーザーダッシュボード
![ユーザーダッシュボード](./docs/screenshots/user-dashboard.png)

---

## 🧠 技術的な工夫

### 1. 招待フローとパスワードリセットのトークン責務分離

```python
class InviteToken(models.Model):
    TOKEN_TYPE_CHOICES = [
        ('INVITE', '招待'),
        ('RESET', 'パスワードリセット'),
    ]
```

| 用途 | トークン |
|------|---------|
| 招待 | `INVITE` |
| パスワードリセット | `RESET` |

責務を分離することで  
**セキュリティとロジックの明確化**を実現。

---

### 2. 招待URL専用の未認証フロー

JWT認証が干渉しないように  
公開APIでは**認証を無効化**

```python
@action(
    detail=False,
    methods=['get'],
    permission_classes=[AllowAny],
    authentication_classes=[]  # JWT認証を無効化
)
```

---

### 3. Axios interceptor によるAPI認証の一元管理

```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
```

---

### 4. React Router による公開ルート制御

招待URLなどの公開ページでは  
**認証チェックをスキップ**

```typescript
const isPublicRoute =
  location.pathname.startsWith("/invite/") ||
  location.pathname.startsWith("/reset-password/");
```

---

## 🏗 システム構成

```
Vercel (React SPA)
        │
        │ HTTPS
        ▼
Render (Django REST API)
        │
        ▼
PostgreSQL
        
SendGrid (Email)
```

---

## 💻 ローカル開発

### Clone

```bash
git clone https://github.com/koki-kondo/mind-status-app.git
cd mind-status-app
```

### 環境変数

```bash
cp .env.example .env
```

### 起動

```bash
docker-compose up -d
```

### migrate

```bash
docker-compose exec backend python manage.py migrate
```

---

## 📦 デプロイ

### インフラ

- **Frontend** → Vercel
- **Backend** → Render
- **Database** → Render PostgreSQL
- **Email** → SendGrid

詳細は [`DEPLOY.md`](./DEPLOY.md) を参照してください。

---

## 🔮 今後の改善

### 機能

- リアルタイム通知
- グループ機能
- PDFレポート
- 多言語対応

### パフォーマンス

- Redisキャッシュ
- API最適化

### セキュリティ

- 二要素認証
- 監査ログ

---

## 👤 Author

**2026** | Portfolio project
