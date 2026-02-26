# Mind Status

メンタルヘルス管理システム - 組織内のメンバーの健康状態を可視化・管理するWebアプリケーション

## 🎯 概要

学校や企業において、メンバー（生徒・従業員）が日々のメンタル・体調状態を記録し、管理者（教師・管理職）が早期に異変に気づけるシステムです。

### 主な機能

- **ステータス記録**: 〇/△/✕の3段階 + 任意コメント
- **管理者ダッシュボード**: グラフによる可視化、アラート検知、トレンド分析
- **一括登録機能**: Excel（2シート構成）/CSVでメンバーを一括登録、招待メール自動送信
- **セキュアな招待フロー**: 完全未認証フロー、JWT/Session分離、多層防御
- **データエクスポート**: Excel形式でのエクスポート、フィルタリング・期間指定機能
- **パスワード管理**: パスワード変更、リセット機能

---

## 🛠️ 技術スタック

### フロントエンド
- **TypeScript** - 型安全性の確保
- **React 18** - UIライブラリ
- **React Router v6** - SPAルーティング（BrowserRouter方式）
- **Axios** - HTTP通信（interceptorパターン）
- **Recharts** - データ可視化

### バックエンド
- **Python 3.11+** - プログラミング言語
- **Django 5.0** - Webフレームワーク
- **Django REST Framework** - REST API
- **PostgreSQL 15+** - データベース
- **openpyxl** - Excel操作

### 認証・セキュリティ
- **JWT (Simple JWT)** - トークン認証
- **Django Session** - セッション管理
- **bcrypt** - パスワードハッシュ化
- **完全未認証フロー** - 招待URL専用publicApi + InviteRouteHandler

### インフラ
- **Docker / Docker Compose** - 開発環境
- **Render.com** - 本番環境（予定）
- **Gmail SMTP** - メール送信

---

## 🚀 セットアップ手順

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること
- Gmail アカウント（招待メール送信用）

### 1. リポジトリのクローン

```bash
git clone <your-repository-url>
cd mind-status-app
```

### 2. 環境変数の設定

```bash
# .env ファイルを作成
# プロジェクトルートに .env ファイルを配置
```

**`.env` の内容例:**

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

# Email Settings (Gmail SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-digit-app-password
DEFAULT_FROM_EMAIL=Mind Status <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=7  # days
```

### 3. Gmail アプリパスワードの取得

招待メール機能を使用するには、Gmail のアプリパスワードが必要です。

1. Google アカウントの[セキュリティ設定](https://myaccount.google.com/security)を開く
2. 2段階認証を有効化
3. [アプリパスワード](https://myaccount.google.com/apppasswords)を生成
4. 16桁のパスワードを `.env` の `EMAIL_HOST_PASSWORD` に設定

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

# Django管理者作成
docker-compose exec backend python manage.py createsuperuser

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
│   │   ├── models.py         # データモデル
│   │   ├── serializers.py    # シリアライザー
│   │   ├── views.py          # ビュー
│   │   ├── validators.py     # バリデーター
│   │   └── admin.py          # 管理画面設定
│   ├── Dockerfile            # Dockerイメージ定義
│   └── requirements.txt      # Python依存関係
│
├── frontend/                  # Reactフロントエンド
│   ├── src/
│   │   ├── api/              # API通信
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
│   │   │   └── ChangePasswordPage.tsx
│   │   ├── App.tsx           # ルートコンポーネント
│   │   └── index.tsx         # エントリーポイント（BrowserRouter配置）
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
- **多層防御**:
  - バックエンド: `AllowAny` + `logout(request)` で強制ログアウト
  - フロントエンド: `localStorage`削除 + `publicApi`（interceptor）
  - ルーティング: `useLocation` + `InviteRouteHandler`（useLayoutEffect）
- **HTTPS通信**: 本番環境で強制
- **CSRF保護**: Django標準機能
- **XSS対策**: React標準機能 + Content-Security-Policy
- **SQLインジェクション対策**: Django ORM使用
- **パスワードハッシュ化**: PBKDF2 + bcrypt
- **Gender バリデーション**: Unicode正規化（NFKC） + マッピング
- **メールバリデーション**: 重複チェック + 形式チェック

---

## 🎯 技術的な工夫ポイント

このプロジェクトは、実務レベルのWebアプリケーション開発のベストプラクティスを実装しています。

### 1. 完全未認証フローの実装（招待システム）

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

---

## 📄 ライセンス

このプロジェクトはポートフォリオ用途として作成されています。

---

## 👤 作成者

作成日: 2026年2月
