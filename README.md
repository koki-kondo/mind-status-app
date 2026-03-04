# Mind Status

メンタルヘルス管理システム - 組織内のメンバーの健康状態を可視化・管理するWebアプリケーション

## 🎯 概要

学校や企業において、メンバー（生徒・従業員）が日々のメンタル・体調状態を記録し、管理者（教師・管理職）が早期に異変に気づけるシステムです。

### 主な機能

- **ステータス記録**: 〇/△/✕の3段階 + 任意コメント
- **管理者ダッシュボード**: グラフによる可視化、アラート検知、トレンド分析
- **一括登録機能**: Excel（2シート構成）/CSVでメンバーを一括登録、招待メール自動送信
- **セキュアな招待フロー**: 完全未認証フロー（token_type区別）、JWT/Session分離、多層防御
- **データエクスポート**: Excel形式でのエクスポート、フィルタリング・期間指定機能
- **パスワード管理**: パスワード変更、リセット機能

---

## 🛠️ 技術スタック

### フロントエンド
- **TypeScript** - 型安全性の確保
- **React 18** - UIライブラリ
- **React Router v6** - SPAルーティング（BrowserRouter方式）
- **Axios** - HTTP通信（interceptorパターン、APIクライアント一元化）
- **Recharts** - データ可視化

### バックエンド
- **Python 3.11+** - プログラミング言語
- **Django 5.0** - Webフレームワーク
- **Django REST Framework** - REST API
- **PostgreSQL 15+** - データベース
- **openpyxl** - Excel操作

### 認証・セキュリティ
- **JWT (Simple JWT)** - トークン認証
- **SendGrid** - メール送信（本番環境）
- **SMTP（開発環境のみ）** - ローカルメール送信
- **bcrypt** - パスワードハッシュ化
- **完全未認証フロー** - 招待URL専用publicApi + InviteRouteHandler
- **トークン用途区別** - INVITE/RESET 型で誤用防止

### インフラ
- **Docker / Docker Compose** - 開発環境
- **Render.com** - 本番バックエンド（PostgreSQL内蔵）
- **Vercel** - 本番フロントエンド
- **SendGrid** - 本番メール送信（無料枠: 100通/日）

---

## 🚀 セットアップ手順

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること
- SendGrid アカウント（本番環境用）または Gmail アカウント（開発環境用）

### 1. リポジトリのクローン

```bash
git clone <your-repository-url>
cd mind-status-app
```

### 2. 環境変数の設定

```bash
# フロントエンド環境変数
cd frontend
cp .env.example .env

# バックエンド環境変数（Docker Composeで自動読み込み）
cd ..
cp .env.example .env
```

#### **`frontend/.env` の内容例:**

```env
# バックエンドAPI URL
REACT_APP_API_URL=http://localhost:8000
```

#### **`.env`（プロジェクトルート）の内容例:**

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here-change-this-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Database
DB_NAME=mindstatus
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# Email Settings
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@mindstatus.com
FRONTEND_URL=http://localhost:3000

# SendGrid（本番環境用 - 開発環境では不要）
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxx

# SMTP（開発環境用 - 本番では使用しない）
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-16-digit-app-password

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=7
```

### 3. メール設定（開発環境）

#### オプション1: コンソール出力（推奨）
デフォルトで `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` が設定されており、招待URLがコンソールに出力されます。

```bash
# Docker ログで確認
docker-compose logs -f backend
```

#### オプション2: Gmail SMTP

1. Google アカウントの[セキュリティ設定](https://myaccount.google.com/security)を開く
2. 2段階認証を有効化
3. [アプリパスワード](https://myaccount.google.com/apppasswords)を生成
4. `.env` を更新:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-digit-app-password
```

### 4. Docker起動

```bash
# すべてのコンテナを起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

### 5. データベース初期化

```bash
# マイグレーション実行
docker-compose exec backend python manage.py migrate
```

### 6. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000/api
- **Django管理画面**: http://localhost:8000/admin

### 7. 初回登録

1. http://localhost:3000/register にアクセス
2. 管理者情報を入力して組織を作成
3. ログイン後、一括登録機能でメンバーを追加

---

## 📦 開発コマンド

### Docker操作

```bash
# コンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# コンテナ再ビルド
docker-compose up -d --build

# ログ確認（全体）
docker-compose logs -f

# ログ確認（特定サービス）
docker-compose logs -f backend
docker-compose logs -f frontend

# コンテナ再起動
docker-compose restart backend
docker-compose restart frontend
```

### バックエンド操作

```bash
# シェルに入る
docker-compose exec backend bash

# マイグレーション作成
docker-compose exec backend python manage.py makemigrations

# マイグレーション実行
docker-compose exec backend python manage.py migrate

# Djangoシェル
docker-compose exec backend python manage.py shell
```

### フロントエンド操作

```bash
# シェルに入る
docker-compose exec frontend sh

# パッケージ追加
docker-compose exec frontend npm install <package-name>

# ビルド
docker-compose exec frontend npm run build
```

### データベース操作

```bash
# PostgreSQLに接続
docker-compose exec db psql -U postgres -d mindstatus

# データベース一覧
docker-compose exec db psql -U postgres -c "\l"

# テーブル一覧
docker-compose exec db psql -U postgres -d mindstatus -c "\dt"
```

---

## 🧪 テスト

```bash
# バックエンドテスト
docker-compose exec backend python manage.py test

# フロントエンドテスト
docker-compose exec frontend npm test

# カバレッジ測定
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
```

---

## 📁 プロジェクト構成

```
mind-status-app/
├── backend/                    # Djangoバックエンド
│   ├── config/                # プロジェクト設定
│   │   ├── settings/         # 環境別設定
│   │   │   ├── base.py       # 共通設定
│   │   │   ├── development.py # 開発環境
│   │   │   └── production.py # 本番環境
│   │   ├── urls.py           # URLルーティング
│   │   └── wsgi.py           # WSGI設定
│   ├── api/                   # APIアプリケーション
│   │   ├── models.py         # データモデル（token_type追加）
│   │   ├── serializers.py    # シリアライザー（JWT修正済み）
│   │   ├── views.py          # ビュー（logger統一）
│   │   ├── utils/
│   │   │   └── email.py      # メール送信（SendGrid対応）
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── create_superuser.py  # 環境変数から管理者作成
│   │   └── admin.py          # 管理画面設定
│   ├── Dockerfile            # Dockerイメージ定義
│   ├── build.sh              # Render.comビルドスクリプト
│   └── requirements.txt      # Python依存関係
│
├── frontend/                  # Reactフロントエンド
│   ├── src/
│   │   ├── api/              # API通信
│   │   │   ├── client.ts     # APIクライアント（一元化）
│   │   │   └── public.ts     # 未認証API（interceptor）
│   │   ├── components/       # 再利用コンポーネント
│   │   │   ├── InviteRouteHandler.tsx  # 招待ルート制御
│   │   │   ├── StatusTrend.tsx          # 時系列グラフ
│   │   │   └── UserBulkUpload.tsx       # 一括登録
│   │   ├── pages/            # ページコンポーネント
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── InvitePage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── ChangePasswordPage.tsx
│   │   │   └── AdminRegisterPage.tsx
│   │   ├── App.tsx           # ルートコンポーネント
│   │   └── index.tsx         # エントリーポイント
│   ├── public/               # 静的ファイル
│   ├── Dockerfile            # Dockerイメージ定義
│   └── package.json          # npm依存関係
│
├── docker-compose.yml         # Docker構成
├── .env                       # 環境変数（要作成）
├── .env.example              # 環境変数テンプレート
├── README.md                 # このファイル
└── DEPLOY.md                 # デプロイ手順
```

---

## 🔒 セキュリティ

### 実装済みセキュリティ機能

- **JWT + Session 認証**: トークン認証とセッション管理の併用
- **完全未認証フロー**: 招待URLは認証チェックを完全スキップ
- **トークン用途区別**: `token_type='INVITE'` / `'RESET'` で誤用防止
- **多層防御**:
  - バックエンド: `AllowAny` + `logout(request)` で強制ログアウト
  - フロントエンド: `localStorage`削除 + `publicApi`（interceptor）
  - ルーティング: `useLocation` + `InviteRouteHandler`（useLayoutEffect）
- **HTTPS通信**: 本番環境で強制
- **CSRF保護**: Django標準機能
- **XSS対策**: React標準機能 + Content-Security-Policy
- **SQLインジェクション対策**: Django ORM使用
- **パスワードハッシュ化**: PBKDF2（必ず create_user() 経由）
- **Gender バリデーション**: Unicode正規化（NFKC） + マッピング
- **メールバリデーション**: 重複チェック + 形式チェック
- **メール送信安全設計**:
  - 本番環境: SendGrid（HTTP API）のみ使用
  - 開発環境: SMTP フォールバック可能
  - settings 安全参照（`getattr`）でAttributeError防止
  - try-except保護でワーカークラッシュ防止

---

## 🎯 技術的な工夫ポイント

このプロジェクトは、実務レベルのWebアプリケーション開発のベストプラクティスを実装しています。

### 1. 完全未認証フローの実装（招待システム）

#### トークン用途区別による誤用防止
```python
# models.py
TOKEN_TYPE_CHOICES = [
    ('INVITE', '招待'),
    ('RESET', 'パスワードリセット'),
]
token_type = models.CharField(max_length=10, choices=TOKEN_TYPE_CHOICES, default='INVITE')

# views.py - 招待検証
invite_token = InviteToken.objects.get(token=token, token_type='INVITE')

# views.py - リセット検証
reset_token = InviteToken.objects.get(token=token, token_type='RESET')
```

#### useLayoutEffect による画面描画前の制御
- **render phase** では state 更新が禁止されている
- **useEffect** は画面描画後に実行されるため、一瞬フラッシュが発生する可能性
- **useLayoutEffect** は画面描画前に同期実行されるため、最も早く実行される合法的な方法

#### useCallback による関数参照の安定化
- JavaScript では関数は参照型
- 通常の関数定義は毎レンダリングで新しい関数オブジェクトが生成される
- useCallback を使うと初回のみ関数を生成し、以降は同じ参照を返す
- 子コンポーネントの不要な再レンダリング防止と useEffect の依存配列が正しく機能

#### axios interceptor による認証ヘッダーの完全削除
- グローバル設定の影響を排除
- transformRequest より優先度が高く確実
- 招待URL専用の publicApi を完全分離

#### useRef による無限ループ防止
- useLayoutEffect で logout を呼ぶと、state が更新されて再レンダリング
- 再レンダリングで useLayoutEffect が再実行されて無限ループ
- useRef でフラグを管理することで、1回のみ実行を保証

### 2. React Router v6 ベストプラクティス

#### BrowserRouter の適切な配置
- App コンポーネント外（index.tsx）での配置により useLocation が使用可能に
- ルーティング状態の一元管理

#### useLocation による動的ルート判定
- `window.location` 依存を排除（React の管理外）
- SPA遷移での正しい再評価を実現
- location.pathname を dependency array に含めることで、ルート変更時に自動再評価

### 3. メール送信の安全設計

#### SendGrid HTTP API使用
```python
# 本番環境では SMTP ポートがブロックされている
# → HTTP API（SendGrid）を使用
api_key = getattr(settings, 'SENDGRID_API_KEY', None)
is_production = not getattr(settings, 'DEBUG', False)

if api_key:
    return _send_via_sendgrid(api_key, user_email, user_name, invite_url)

if is_production:
    logger.error('本番環境でAPIキー未設定')
    return False  # SMTP に絶対にフォールバックしない
```

#### メールクライアント互換性
```html
<!-- グラデーション非対応 → 単色背景 -->
<td bgcolor="#667eea" style="background-color: #667eea;">
    <a href="{url}" style="color: #ffffff;">ボタン</a>
</td>
```

### 4. JWT認証の確実な動作保証

#### 必ず create_user() を使用
```python
# serializers.py - BulkUploadUserSerializer
def create(self, validated_data):
    password = validated_data.pop('password', None)
    
    # 必ず create_user() を使用（password が None でも OK）
    # → set_password() が必ず実行される
    # → JWT認証が正常動作する
    user = User.objects.create_user(password=password, **validated_data)
    return user
```

---

## 📄 ライセンス

このプロジェクトはポートフォリオ用途として作成されています。

---

## 👤 作成者

作成日: 2026年2月

---

## 🔄 最新の改善内容（2026年3月）

### セキュリティ・設計改善
- ✅ トークン用途区別（INVITE/RESET）追加
- ✅ is_valid() メソッドの一元化
- ✅ settings 安全参照（getattr使用）
- ✅ print → logger 統一
- ✅ メール送信 try-except 保護
- ✅ 不要なDBインデックス削除

### メール送信改善
- ✅ SendGrid HTTP API 完全対応
- ✅ 本番SMTP完全無効化
- ✅ メールクライアント互換性対応（グラデーション削除）
- ✅ HTMLメールテンプレート最適化

### JWT認証修正
- ✅ BulkUploadUserSerializer で必ず create_user() 使用
- ✅ パスワードハッシュ化保証
- ✅ 401エラー解消

### API設計改善
- ✅ APIクライアント一元化（frontend/src/api/client.ts）
- ✅ 相対パス → 環境変数URL使用
- ✅ JWTトークン自動付与（interceptor）
- ✅ 401時自動ログアウト

詳細は `DEPLOY.md` を参照してください。
