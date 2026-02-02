# Python 3.11 ベースイメージ
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# 環境変数設定
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Pythonパッケージのインストール
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# 起動コマンド（docker-compose.ymlで上書き可能）
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
