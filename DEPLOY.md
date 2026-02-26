# Mind Status - デプロイ手順

本番環境（Render.com）へのデプロイ手順を説明します。

---

## 🚀 Render.com へのデプロイ

### 前提条件
- ✅ GitHubアカウント
- ✅ Render.comアカウント（無料プランで可能）
- ✅ Gmail アカウント（招待メール送信用）
- ✅ プロジェクトがGitHubにプッシュ済み

---

## 📝 デプロイ手順

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

### Step 2: Render.com でデータベース作成

1. [Render.com](https://render.com) にログイン
2. ダッシュボードから **「New +」** → **「PostgreSQL」** を選択
3. 設定:
   - **Name**: `mind-status-db`
   - **Database**: `mindstatus`
   - **User**: `mindstatus`
   - **Region**: `Oregon (US West)` または最寄りのリージョン
   - **PostgreSQL Version**: `15` （推奨）
   - **Datadog API Key**: 空欄でOK
   - **Instance Type**: **Free** （90日間無料）
4. **「Create Database」** をクリック
5. 作成後、**Internal Database URL** をコピー（後で使用）
   - 形式: `postgresql://mindstatus:xxxxx@xxxxx.oregon-postgres.render.com/mindstatus`

---

### Step 3: Render.com でWebサービス作成

1. ダッシュボードから **「New +」** → **「Web Service」** を選択
2. **GitHubリポジトリを接続**
   - 「Connect a repository」をクリック
   - 対象のリポジトリ（`mind-status-app`）を選択
3. 設定:
   - **Name**: `mind-status-backend`
   - **Region**: `Oregon (US West)` （**DBと同じリージョン推奨**）
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3`
   - **Instance Type**: **Free** （月750時間無料）

---

### Step 4: 環境変数設定

**「Environment」** タブで以下を追加:

#### 必須の環境変数

```env
# Django基本設定
DJANGO_SECRET_KEY=<ランダムな文字列を生成>
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
ALLOWED_HOSTS=mind-status-backend.onrender.com

# データベース
DATABASE_URL=<Step 2でコピーしたInternal Database URL>

# CORS設定（フロントエンドデプロイ後に更新）
CORS_ALLOWED_ORIGINS=https://your-frontend-app.onrender.com

# フロントエンドURL（フロントエンドデプロイ後に更新）
FRONTEND_URL=https://your-frontend-app.onrender.com

# Gmail SMTP設定（招待メール送信用）
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=<16桁のアプリパスワード>
DEFAULT_FROM_EMAIL=Mind Status <your-email@gmail.com>

# JWT設定
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=7
```

#### 🔑 DJANGO_SECRET_KEY の生成

```python
# Pythonシェルで実行
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

または、[オンラインジェネレーター](https://djecrety.ir/)を使用

#### 📧 Gmail アプリパスワードの取得

1. [Google アカウント セキュリティ設定](https://myaccount.google.com/security) にアクセス
2. **2段階認証を有効化**（必須）
3. [アプリパスワード](https://myaccount.google.com/apppasswords)にアクセス
4. アプリを選択: 「メール」
5. デバイスを選択: 「その他（カスタム名）」→ 「Mind Status」
6. **生成** をクリック
7. 表示された16桁のパスワード（スペースなし）を `EMAIL_HOST_PASSWORD` に設定

---

### Step 5: デプロイ実行

1. **「Create Web Service」** をクリック
2. 自動デプロイが開始されます（数分かかります）
3. **ログを確認**:
   - ✅ `Building...`
   - ✅ `Running build command...`
   - ✅ `Installing requirements...`
   - ✅ `Collecting static files...`
   - ✅ `Running migrations...`
   - ✅ `Deploy live 🚀`

#### デプロイが成功したら

- サービスURL（例: `https://mind-status-backend.onrender.com`）が表示されます
- このURLを **ALLOWED_HOSTS** と **CORS_ALLOWED_ORIGINS** に追加（後述）

---

### Step 6: 初期設定

#### 管理者アカウントの作成

Render.com のシェル機能を使用:

1. サービスページの **「Shell」** タブを開く
2. 以下を実行:

```bash
python manage.py shell
```

```python
from api.models import User, Organization

# 組織作成
org = Organization.objects.create(
    name='本番組織',
    org_type='COMPANY'  # 企業の場合（学校の場合は 'SCHOOL'）
)

# 管理者作成
User.objects.create_superuser(
    email='admin@your-domain.com',
    full_name='管理者',
    password='SecurePassword123!',
    organization=org,
    role='ADMIN',
    is_activated=True
)

print('管理者アカウント作成完了')
exit()
```

---

### Step 7: 動作確認

1. **バックエンドAPI**
   - `https://mind-status-backend.onrender.com/api/` にアクセス
   - APIルート一覧が表示されればOK

2. **Django管理画面**
   - `https://mind-status-backend.onrender.com/admin` にアクセス
   - 作成した管理者アカウントでログイン
   - ✅ ログイン成功 → バックエンドは正常

---

## 🎨 フロントエンドデプロイ

### Vercel へのデプロイ（推奨）

#### なぜVercelを推奨するか
- ✅ React に最適化
- ✅ 自動ビルド・デプロイ
- ✅ 高速なCDN
- ✅ 無料枠が充実

#### 手順

1. [Vercel](https://vercel.com) にログイン（GitHubアカウント連携）
2. **「Add New...」** → **「Project」** を選択
3. GitHubリポジトリ（`mind-status-app`）を選択
4. 設定:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

5. **環境変数設定**:
```env
REACT_APP_API_URL=https://mind-status-backend.onrender.com
```

6. **「Deploy」** をクリック
7. デプロイ完了後、URLが表示される（例: `https://mind-status-frontend.vercel.app`）

#### バックエンドの環境変数を更新

Render.com のバックエンドサービスに戻り、環境変数を更新:

```env
# フロントエンドのURLに更新
FRONTEND_URL=https://mind-status-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://mind-status-frontend.vercel.app

# ALLOWED_HOSTSも更新（バックエンドのURLを追加）
ALLOWED_HOSTS=mind-status-backend.onrender.com
```

**保存後、バックエンドを再デプロイ**（Manual Deploy → Deploy latest commit）

---

### Render.com Static Site でのデプロイ

Vercelの代わりにRender.comでフロントエンドもホストする場合:

1. **「New +」** → **「Static Site」** を選択
2. GitHubリポジトリを選択
3. 設定:
   - **Name**: `mind-status-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

4. 環境変数:
```env
REACT_APP_API_URL=https://mind-status-backend.onrender.com
```

5. デプロイ完了後、バックエンドの環境変数を更新（上記と同様）

---

## ✅ 最終確認

### 1. フロントエンドにアクセス

`https://mind-status-frontend.vercel.app`（または Render.com URL）にアクセス

### 2. 管理者でログイン

- Email: 作成した管理者メール
- Password: 設定したパスワード

### 3. 一括登録をテスト

1. **Excelテンプレートダウンロード**
2. **テストユーザーを1件追加**
3. **アップロード**
4. **招待メールが送信されることを確認**
   - 実際のメールボックスに届く
   - リンクをクリックしてパスワード設定

### 4. ユーザーとしてログイン

- 招待メールでパスワード設定したユーザーでログイン
- ステータス記録機能をテスト

---

## 🔧 本番環境の最適化

### パフォーマンス改善

#### バックエンド（既に設定済み）

1. **Gunicorn ワーカー数**
```bash
# build.sh で既に設定
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3
```

2. **静的ファイル配信**
- WhiteNoise 使用（設定済み）
- 自動的にgzip圧縮

3. **データベースコネクションプーリング**
- Django標準のコネクション管理

#### フロントエンド

1. **ビルド最適化**
```json
// package.json に追加
"build": "GENERATE_SOURCEMAP=false react-scripts build"
```

2. **遅延ロード（将来的に実装）**
```typescript
// React.lazy() でコンポーネント分割
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
```

---

## 🔒 セキュリティ強化

### SSL/TLS証明書

- ✅ Render.com は自動的に Let's Encrypt 証明書を設定
- ✅ HTTPS 強制（`settings/production.py` で設定済み）

### セキュリティヘッダー（設定済み）

`config/settings/production.py`:

```python
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1年
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### 定期的なセキュリティチェック

```bash
# Djangoのセキュリティチェック
python manage.py check --deploy

# 依存関係の脆弱性チェック
pip list --outdated
```

---

## 📈 監視とログ

### Render.com のログ機能

- ✅ リアルタイムログ表示
- ✅ 過去7日間のログ保存（無料プラン）
- ✅ エラー検知

**ログの確認方法:**
1. サービスページの **「Logs」** タブ
2. リアルタイムでログをストリーミング表示
3. エラーや警告を確認

### 外部監視ツール（オプション）

- **Sentry**: エラートラッキング（無料プラン: 5,000イベント/月）
- **Uptime Robot**: サイト稼働監視（無料プラン: 50モニター）
- **Google Analytics**: アクセス解析（無料）

---

## 🐛 トラブルシューティング

### ビルドエラー

#### エラー1: `No module named 'xxx'`

```
ModuleNotFoundError: No module named 'openpyxl'
```

**原因**: `requirements.txt` に依存関係が含まれていない

**解決方法:**
```bash
# ローカルで確認
pip list | grep openpyxl

# requirements.txt に追加
openpyxl==3.1.2
et-xmlfile==2.0.0

# コミット・プッシュして再デプロイ
git add requirements.txt
git commit -m "fix: add openpyxl to requirements"
git push origin main
```

#### エラー2: `./build.sh: Permission denied`

**原因**: `build.sh` に実行権限がない

**解決方法:**
```bash
# ローカルで実行権限を付与
chmod +x backend/build.sh

# Gitに記録
git add backend/build.sh
git commit -m "fix: add execute permission to build.sh"
git push origin main
```

---

### データベース接続エラー

#### エラー: `could not connect to server`

```
django.db.utils.OperationalError: could not connect to server
```

**原因:**
1. `DATABASE_URL` が間違っている
2. データベースが起動していない
3. リージョンが異なる

**解決方法:**
1. Render.com のデータベースページで **Internal Database URL** を再確認
2. バックエンドの環境変数 `DATABASE_URL` を更新
3. **バックエンドとDBを同じリージョン**にする（推奨: Oregon US West）
4. バックエンドを再デプロイ

---

### 静的ファイルが表示されない

#### エラー: `404 Not Found: /static/...`

**原因**: `collectstatic` が実行されていない

**解決方法:**
1. `build.sh` に以下が含まれているか確認:
```bash
python manage.py collectstatic --no-input
```

2. WhiteNoise の設定確認（`settings/production.py`）:
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # ← これが2番目
    ...
]
```

3. 再デプロイ

---

### メール送信失敗

#### エラー: `SMTPAuthenticationError`

```
SMTPAuthenticationError: Username and Password not accepted
```

**原因:**
1. Gmail アプリパスワードが間違っている
2. 2段階認証が無効
3. アプリパスワードにスペースが含まれている

**解決方法:**
1. Gmail アプリパスワードを**再生成**
2. 2段階認証が有効か確認
3. **16桁のパスワード（スペースなし）** を環境変数に設定
```env
EMAIL_HOST_PASSWORD=abcdefghijklmnop  # 正しい
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop  # 間違い（スペース含む）
```

4. 環境変数を保存後、バックエンドを再デプロイ

---

### CORS エラー

#### エラー: `CORS policy: No 'Access-Control-Allow-Origin' header`

**原因**: フロントエンドのURLが `CORS_ALLOWED_ORIGINS` に含まれていない

**解決方法:**
1. バックエンドの環境変数を確認:
```env
CORS_ALLOWED_ORIGINS=https://mind-status-frontend.vercel.app
```

2. **https** になっているか確認（http ではない）
3. **末尾にスラッシュがない** ことを確認（`/` なし）
4. 保存後、バックエンドを再デプロイ

---

### 招待URLでリダイレクトされる

#### 症状: 招待URLにアクセスすると管理画面に飛ばされる

**原因:**
1. `FRONTEND_URL` が間違っている
2. フロントエンドのビルドが古い

**解決方法:**
1. バックエンドの環境変数 `FRONTEND_URL` を確認
2. フロントエンドを再デプロイ
3. ブラウザのキャッシュをクリア（Ctrl + Shift + R）

---

## 🔄 継続的デプロイ (CD)

### 自動デプロイの設定

Render.com は **GitHub への push で自動デプロイ** されます。

**ワークフロー:**
```
1. ローカルで開発
   ↓
2. git add . && git commit -m "feat: xxx"
   ↓
3. git push origin main
   ↓
4. Render.com が自動検知
   ↓
5. ビルド・テスト・デプロイ
   ↓
6. デプロイ完了 🚀
```

### デプロイ前のチェックリスト

- [ ] ローカルでテスト実行（`npm test`, `python manage.py test`）
- [ ] マイグレーションファイルをコミット
- [ ] 環境変数の確認（特に `DATABASE_URL`, `FRONTEND_URL`）
- [ ] データベースのバックアップ（重要なデータがある場合）
- [ ] ログの確認準備（デプロイ後すぐに確認）

---

## 📊 本番環境での一括登録フロー

### 開発環境との違い

| 項目 | 開発環境 | 本番環境 |
|------|---------|---------|
| メール送信 | コンソール出力 | 実際に送信（Gmail SMTP） |
| 招待URL確認 | Dockerログ | ユーザーのメールボックス |
| アクセス方法 | 手動コピペ | リンククリック |

### 本番環境での手順

#### 1. 管理者がExcel/CSVでユーザー一括登録

1. 管理者ダッシュボード → **「📤 ユーザー一括登録」** タブ
2. **「📥 テンプレートをダウンロード（Excel）」** をクリック
3. ダウンロードした `user_template.xlsx` を開く
4. **シート1（学校向け）** または **シート2（企業向け）** にユーザー情報を入力

**学校向けExcel例:**
```
学籍番号    氏名      フリガナ      学年  組・クラス  性別  生年月日      メールアドレス
S2024001   田中太郎   タナカタロウ   1    A組        MALE  2010-04-15   tanaka@example.com
S2024002   鈴木花子   スズキハナコ   1    A組        FEMALE 2010-05-20  suzuki@example.com
```

**企業向けExcel例:**
```
社員番号  氏名      フリガナ      所属・部署  役職    性別  生年月日      メールアドレス
E001     田中太郎   タナカタロウ   営業部     課長    MALE  1985-04-15   tanaka@example.com
E002     鈴木花子   スズキハナコ   人事部     主任    FEMALE 1990-05-20  suzuki@example.com
```

5. **Excelファイルをアップロード**
6. **「登録実行」** ボタンをクリック

#### 2. システムが自動処理

- ✅ ユーザーアカウント作成（`is_activated=False` で未アクティブ状態）
- ✅ 招待トークン生成（7日間有効）
- ✅ **招待メールを実際に送信**（Gmail SMTP経由）

**送信されるメール:**
```
件名: Mind Status への招待

田中太郎 様

Mind Status へようこそ!

以下のURLからパスワードを設定してアカウントを有効化してください:
https://mind-status-frontend.vercel.app/invite/abc123-def456-ghi789

※このリンクは7日間有効です。

---
Mind Status 運営チーム
```

#### 3. ユーザーがメール受信

- 📧 メール受信箱に届く
- 🔗 リンクをクリック
- 🌐 招待ページが表示される

#### 4. パスワード設定

1. ユーザー名とメールアドレスが表示される
2. パスワード入力（8文字以上、大小文字・数字含む）
3. パスワード強度チェック（リアルタイム）
   - ✅ 8文字以上
   - ✅ 大文字を含む
   - ✅ 小文字を含む
   - ✅ 数字を含む
4. **「パスワードを設定」** ボタンをクリック

#### 5. アカウント有効化

- ✅ `is_activated=True` に更新
- ✅ 自動的にログイン画面にリダイレクト

#### 6. ログイン

- 📧 メールアドレスとパスワードでログイン
- 👤 一般ユーザー → ユーザーダッシュボード
- 👔 管理者 → 管理者ダッシュボード

---

### トラブル時の対応

#### メールが届かない場合

**ユーザー側の対処:**
1. 迷惑メールフォルダを確認
2. 管理者に連絡

**管理者側の対処:**
1. Django Admin (`/admin/api/invitetoken/`) で招待トークンを確認
   - トークンが生成されているか
   - 有効期限内か（7日以内）
   - 使用済みでないか（`is_used=False`）
2. メール設定が正しいか確認（環境変数）
3. Render.com のログでエラーを確認
4. 必要に応じて再度CSV登録（新しい招待メール送信）

#### トークンが期限切れの場合

1. 管理者が再度Excel/CSVで登録
2. 新しい招待トークンが生成される
3. 新しい招待メールが送信される
4. ユーザーは新しいリンクでパスワード設定

---

## 🔐 パスワード管理機能

### パスワード忘れ（ユーザー自己解決）

1. ログイン画面 → **「パスワード忘れ？」** リンク
2. メールアドレス入力
3. **「リセットリンクを送信」** ボタンをクリック
4. リセットメール送信（Gmail SMTP経由）
5. メール内のリンクをクリック
6. 新しいパスワード設定
7. ログイン

**セキュリティ対策:**
- ✅ 列挙攻撃対策: 存在しないメールアドレスでも成功レスポンス
- ✅ トークン有効期限: 24時間（デフォルト）
- ✅ ワンタイムトークン: 使用後は無効化

### パスワード変更（ログイン済み）

1. ユーザーダッシュボード → ヘッダー **「🔐 PW変更」** ボタン
2. 現在のパスワード入力
3. 新しいパスワード入力（8文字以上、大小文字・数字含む）
4. 確認用パスワード入力
5. **「変更」** ボタンをクリック

---

## 📚 参考資料

- [Render.com公式ドキュメント](https://render.com/docs)
- [Django デプロイチェックリスト](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [Gunicorn設定ガイド](https://docs.gunicorn.org/en/stable/settings.html)
- [WhiteNoise公式ドキュメント](http://whitenoise.evans.io/)
- [Vercel公式ドキュメント](https://vercel.com/docs)

---

## 🎉 デプロイ完了！

本番環境が稼働したら:

1. ✅ 動作確認（全機能テスト）
2. ✅ パフォーマンステスト（レスポンス時間確認）
3. ✅ セキュリティ監査（`python manage.py check --deploy`）
4. ✅ ドキュメント更新（README.md に本番URLを記載）
5. ✅ 監視設定（Uptime Robot など）

お疲れ様でした！ 🚀
