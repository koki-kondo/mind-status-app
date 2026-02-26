import React, { useLayoutEffect, useRef } from 'react';
import InvitePage from '../pages/InvitePage';

interface InviteRouteHandlerProps {
  isAuthenticated: boolean;
  handleLogout: () => void;
}

/**
 * InviteRouteHandler
 * 
 * 責務:
 * - ルーティングレベルで認証状態を制御
 * - 認証済みの場合は即座にログアウト
 * - 招待フローを常に未認証状態で実行
 * 
 * 設計意図:
 * - useLayoutEffect を使用（画面描画前に同期実行）
 * - useEffect よりも早いタイミングで実行される
 * - フラッシュを完全に防止
 * 
 * なぜ useLayoutEffect なのか:
 * - render phase では state 更新できない（React のルール）
 * - useEffect は画面描画後（遅すぎる）
 * - useLayoutEffect は描画前に同期実行（最適）
 * 
 * 無限ループ対策:
 * - useRef で実行済みフラグを管理
 * - 1回だけ実行されることを保証
 */
const InviteRouteHandler: React.FC<InviteRouteHandlerProps> = ({
  isAuthenticated,
  handleLogout,
}) => {
  // 実行済みフラグ（無限ループ防止）
  const hasLoggedOut = useRef(false);

  useLayoutEffect(() => {
    // 認証済み かつ 未実行の場合のみログアウト
    if (isAuthenticated && !hasLoggedOut.current) {
      console.log('[InviteRouteHandler] 認証済み状態を検出 → ログアウト実行');
      hasLoggedOut.current = true;
      handleLogout();
    }
  }, [isAuthenticated, handleLogout]);

  // 認証中は何も表示しない（ログアウト完了まで待機）
  if (isAuthenticated) {
    return null;
  }

  // 未認証状態なら InvitePage を表示
  console.log('[InviteRouteHandler] 未認証状態 → InvitePage 表示');
  return <InvitePage />;
};

export default InviteRouteHandler;
