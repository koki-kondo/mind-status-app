// src/api/public.ts
// 招待URL用の完全未認証APIクライアント

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

/**
 * 完全未認証のAPIクライアント
 * 
 * 設計意図:
 * - Authorization ヘッダーを絶対に送らない
 * - Cookieを送らない（withCredentials: false）
 * - グローバルaxios設定の影響を受けない
 * 
 * 用途:
 * - 招待URL関連API（verify_invite, set_password_with_invite）
 * - パスワードリセット
 * - 管理者登録
 */
const publicApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Cookieを送らない
  withCredentials: false,
});

/**
 * リクエストインターセプター
 * 
 * 目的:
 * - Authorization ヘッダーを完全に削除
 * - グローバル設定されたヘッダーも削除
 * - transformRequest より優先度が高い
 */
publicApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Authorization ヘッダーを完全に削除
    delete config.headers['Authorization'];
    delete config.headers.Authorization;
    
    // common ヘッダーからも削除（グローバル設定対策）
    if (config.headers.common) {
      delete config.headers.common['Authorization'];
      delete config.headers.common.Authorization;
    }
    
    // デバッグログ（本番環境では削除推奨）
    console.log('[publicApi] Request:', {
      url: config.url,
      method: config.method,
      hasAuth: !!config.headers['Authorization'],
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * レスポンスインターセプター
 * 
 * 目的:
 * - エラーハンドリングの統一
 * - デバッグログ出力
 */
publicApi.interceptors.response.use(
  (response) => {
    // デバッグログ（本番環境では削除推奨）
    console.log('[publicApi] Response:', {
      url: response.config.url,
      status: response.status,
    });
    return response;
  },
  (error) => {
    // エラーログ
    console.error('[publicApi] Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
    });
    return Promise.reject(error);
  }
);

export default publicApi;
