# Node.js 18 ベースイメージ
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

# ポート3000を公開
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "start"]
