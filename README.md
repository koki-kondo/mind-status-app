# Mind Status

メンタルヘルス管理システム - 組織内のメンバーの健康状態を可視化・管理するWebアプリケーション

## 🎯 概要

学校や企業において、メンバー（生徒・従業員）が日々のメンタル・体調状態を記録し、管理者（教師・管理職）が早期に異変に気づけるシステムです。

### 主な機能

- **ステータス記録**: GREEN/YELLOW/REDの3段階 + 任意コメント
- **管理者ダッシュボード**: グラフによる可視化、アラート検知
- **CSV一括登録**: メンバーを一括登録、招待メール自動送信
- **招待方式**: セキュアなアカウント作成フロー

---

## 🛠️ 技術スタック

### フロントエンド
- TypeScript
- React
- Recharts (データ可視化)
- Tailwind CSS

### バックエンド
- Python 3.11+
- Django 5.0
- Django REST Framework
- PostgreSQL 15+

### インフラ
- Docker / Docker Compose (開発環境)
- Render.com (本番環境)
- AWS構成も対応済み (将来の移行用)

---

## 🚀 セットアップ手順

### 前提条件

- Docker Desktop がインストールされていること
- Git がインストールされていること

### 1. リポジトリのクローン

```bash
git clone <your-repository-url>
cd mind-status-app
```

### 2. 環境変数の設定

```bash
# .env.example をコピー
cp .env.example .env

# .env ファイルを編集（必要に応じて）
```

### 3. Docker起動

```bash
# すべてのコンテナを起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

### 4. データベース初期化

```bash
# マイグレーション実行
docker-compose exec backend python manage.py migrate

# 管理者ユーザー作成
docker-compose exec backend python manage.py createsuperuser
```

### 5. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000/api
- **Django管理画面**: http://localhost:8000/admin

---

## 📦 開発コマンド

```bash
# コンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# コンテナ再ビルド
docker-compose up -d --build

# ログ確認
docker-compose logs -f [service-name]

# バックエンドのシェルに入る
docker-compose exec backend bash

# フロントエンドのシェルに入る
docker-compose exec frontend sh

# データベースに接続
docker-compose exec db psql -U postgres -d mindstatus
```

---

## 🧪 テスト

```bash
# バックエンドテスト
docker-compose exec backend python manage.py test

# フロントエンドテスト
docker-compose exec frontend npm test
```

---

## 📁 プロジェクト構成

```
mind-status-app/
├── backend/              # Djangoバックエンド
│   ├── config/          # プロジェクト設定
│   ├── api/             # APIアプリケーション
│   ├── Dockerfile       # Dockerイメージ定義
│   └── requirements.txt # Python依存関係
│
├── frontend/            # Reactフロントエンド
│   ├── src/            # ソースコード
│   ├── public/         # 静的ファイル
│   ├── Dockerfile      # Dockerイメージ定義
│   └── package.json    # npm依存関係
│
├── docker-compose.yml   # Docker構成
├── .env.example         # 環境変数テンプレート
└── README.md           # このファイル
```

---

## 🎨 開発ワークフロー

### ブランチ戦略

```
main          - 本番環境
develop       - 開発環境
feature/*     - 機能開発
bugfix/*      - バグ修正
```

### コミットメッセージ

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加
chore: ビルド・設定変更
```

---

## 🔒 セキュリティ

- JWT認証
- HTTPS通信（本番環境）
- CSRF保護
- XSS対策
- SQLインジェクション対策（ORM使用）
- パスワードハッシュ化（PBKDF2）

---

## 📈 デプロイ

### Render.com へのデプロイ

1. GitHubリポジトリをRender.comに接続
2. Web Service として backend をデプロイ
3. Static Site として frontend をデプロイ
4. PostgreSQL データベースを作成
5. 環境変数を設定

詳細は `/docs/deployment.md` を参照

---

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

## 📄 ライセンス

このプロジェクトはポートフォリオ用途として作成されています。

---

## 👤 作成者

作成日: 2026年1月

---

## 📚 参考資料

- [Django公式ドキュメント](https://docs.djangoproject.com/)
- [React公式ドキュメント](https://react.dev/)
- [Docker公式ドキュメント](https://docs.docker.com/)
- [システム仕様書](./docs/Mind_Status_System_Specification_v2.0.docx)
