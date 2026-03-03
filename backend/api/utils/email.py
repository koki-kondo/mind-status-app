# backend/api/utils/email.py (メールクライアント互換性最優先版)
import logging
from django.conf import settings
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from python_http_client.exceptions import HTTPError

logger = logging.getLogger(__name__)


def send_invite_email(user_email, user_name, invite_url):
    """
    招待メールを送信
    
    本番環境（DEBUG=False）では SendGrid のみ使用。
    開発環境（DEBUG=True）では SMTP フォールバック可能。
    
    Args:
        user_email: 送信先メールアドレス
        user_name: ユーザー名
        invite_url: 招待URL
    
    Returns:
        bool: 成功時True、失敗時False
    
    Raises:
        Exception: メール送信失敗時（呼び出し側でキャッチすること）
    """
    
    # ① settings 安全参照（AttributeError 防止）
    api_key = getattr(settings, 'SENDGRID_API_KEY', None)
    is_production = not getattr(settings, 'DEBUG', False)
    
    # SendGrid API Key が設定されている場合
    if api_key:
        return _send_via_sendgrid(api_key, user_email, user_name, invite_url)
    
    # 本番環境で SendGrid 未設定の場合はエラー
    if is_production:
        logger.error(
            f'❌ 本番環境でSENDGRID_API_KEYが未設定です。'
            f'メール送信をスキップします: {user_email}'
        )
        return False
    
    # 開発環境のみ SMTP フォールバック許可
    logger.warning(
        f'⚠️ 開発環境のため SMTP にフォールバックします: {user_email}'
    )
    return _send_via_smtp(user_email, user_name, invite_url)


def send_password_reset_email(user_email, user_name, reset_url):
    """
    パスワードリセットメールを送信
    
    Args:
        user_email: 送信先メールアドレス
        user_name: ユーザー名
        reset_url: リセットURL
    
    Returns:
        bool: 成功時True、失敗時False
    """
    
    api_key = getattr(settings, 'SENDGRID_API_KEY', None)
    is_production = not getattr(settings, 'DEBUG', False)
    
    if api_key:
        return _send_password_reset_via_sendgrid(api_key, user_email, user_name, reset_url)
    
    if is_production:
        logger.error(
            f'❌ 本番環境でSENDGRID_API_KEYが未設定です。'
            f'パスワードリセットメール送信をスキップします: {user_email}'
        )
        return False
    
    logger.warning(
        f'⚠️ 開発環境のため SMTP にフォールバックします: {user_email}'
    )
    return _send_password_reset_via_smtp(user_email, user_name, reset_url)


def _send_via_sendgrid(api_key, user_email, user_name, invite_url):
    """
    SendGrid経由で招待メール送信
    
    Args:
        api_key: SendGrid API Key
        user_email: 送信先メールアドレス
        user_name: ユーザー名
        invite_url: 招待URL
    
    Returns:
        bool: 成功時True、失敗時False
    """
    try:
        default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindstatus.com')
        
        message = Mail(
            from_email=default_from,
            to_emails=user_email,
            subject='Mind Status への招待',
            html_content=f'''
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- ヘッダー -->
                                <tr>
                                    <td bgcolor="#667eea" style="background-color: #667eea; padding: 40px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Mind Status</h1>
                                    </td>
                                </tr>
                                
                                <!-- メインコンテンツ -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">ようこそ、{user_name} 様</h2>
                                        
                                        <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                            Mind Status へのご招待です。<br>
                                            以下のボタンからパスワードを設定してアカウントを有効化してください。
                                        </p>
                                        
                                        <!-- ボタン（メールクライアント互換性最優先） -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td bgcolor="#667eea" style="background-color: #667eea; border-radius: 8px; padding: 16px 40px;">
                                                                <a href="{invite_url}" style="display: inline-block; color:#ffffff !important; text-decoration: none; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                                                    アカウントを有効化
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- リンクのフォールバック -->
                                        <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 10px 0; text-align: center;">
                                            ボタンが表示されない場合は、以下のURLをコピーしてブラウザで開いてください：<br>
                                            <a href="{invite_url}" style="color: #667eea; word-break: break-all;">{invite_url}</a>
                                        </p>
                                        
                                        <!-- 注意事項 -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                            <tr>
                                                <td bgcolor="#fff3cd" style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                                                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                                                        <strong>⏰ このリンクは7日間有効です</strong><br>
                                                        期限切れの場合は、管理者に再発行を依頼してください。
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
                                            ※このメールに心当たりがない場合は、このまま削除してください。<br>
                                            第三者がメールアドレスを誤って入力した可能性があります。
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- フッター -->
                                <tr>
                                    <td bgcolor="#f8f9fa" style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="margin: 5px 0; color: #999999; font-size: 12px;">Mind Status 運営チーム</p>
                                        <p style="margin: 5px 0; color: #999999; font-size: 12px;">このメールは自動送信されています</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            '''
        )
        
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        # 成功ログ（URLは含めない）
        logger.info(
            f'✅ SendGrid送信成功（招待）: {user_email} '
            f'(Status: {response.status_code})'
        )
        return True
        
    except HTTPError as e:
        # SendGrid APIエラー（400, 401, 403など）
        logger.error(
            f'❌ SendGrid APIエラー（招待）: {user_email} '
            f'(Status: {e.status_code}, Reason: {e.reason})'
        )
        return False
        
    except Exception as e:
        # その他の予期しないエラー
        logger.error(
            f'❌ SendGrid送信失敗（招待・予期しないエラー）: {user_email} '
            f'- {type(e).__name__}: {str(e)}'
        )
        return False


def _send_password_reset_via_sendgrid(api_key, user_email, user_name, reset_url):
    """SendGrid経由でパスワードリセットメール送信"""
    try:
        default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindstatus.com')
        
        message = Mail(
            from_email=default_from,
            to_emails=user_email,
            subject='Mind Status - パスワードリセット',
            html_content=f'''
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- ヘッダー -->
                                <tr>
                                    <td bgcolor="#667eea" style="background-color: #667eea; padding: 40px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Mind Status</h1>
                                    </td>
                                </tr>
                                
                                <!-- メインコンテンツ -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">{user_name} 様</h2>
                                        
                                        <p style="color: #555555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                            パスワードリセットのリクエストを受け付けました。<br>
                                            以下のボタンから新しいパスワードを設定してください。
                                        </p>
                                        
                                        <!-- ボタン（メールクライアント互換性最優先） -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td bgcolor="#667eea" style="background-color: #667eea; border-radius: 8px; padding: 16px 40px;">
                                                                <a href="{reset_url}" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                                                    パスワードをリセット
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- リンクのフォールバック -->
                                        <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 10px 0; text-align: center;">
                                            ボタンが表示されない場合は、以下のURLをコピーしてブラウザで開いてください：<br>
                                            <a href="{reset_url}" style="color: #667eea; word-break: break-all;">{reset_url}</a>
                                        </p>
                                        
                                        <!-- 注意事項 -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                            <tr>
                                                <td bgcolor="#fff3cd" style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                                                    <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                                                        <strong>⏰ このリンクは1時間有効です</strong>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 20px 0 0 0;">
                                            ※このリクエストに心当たりがない場合は、このメールを無視してください。<br>
                                            パスワードは変更されません。
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- フッター -->
                                <tr>
                                    <td bgcolor="#f8f9fa" style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                                        <p style="margin: 5px 0; color: #999999; font-size: 12px;">Mind Status 運営チーム</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            '''
        )
        
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        logger.info(
            f'✅ SendGrid送信成功（パスワードリセット）: {user_email} '
            f'(Status: {response.status_code})'
        )
        return True
        
    except HTTPError as e:
        logger.error(
            f'❌ SendGrid APIエラー（パスワードリセット）: {user_email} '
            f'(Status: {e.status_code}, Reason: {e.reason})'
        )
        return False
        
    except Exception as e:
        logger.error(
            f'❌ SendGrid送信失敗（パスワードリセット）: {user_email} '
            f'- {type(e).__name__}: {str(e)}'
        )
        return False


def _send_via_smtp(user_email, user_name, invite_url):
    """Django標準SMTP経由で招待メール送信（開発環境専用）"""
    
    # 二重チェック: 本番環境では絶対に実行しない
    is_production = not getattr(settings, 'DEBUG', False)
    if is_production:
        logger.critical(
            f'🚨 CRITICAL: 本番環境でSMTP送信が呼ばれました！ '
            f'これは設計上あり得ないエラーです。'
        )
        return False
    
    try:
        from django.core.mail import send_mail
        default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindstatus.com')
        
        result = send_mail(
            subject='Mind Status への招待',
            message=f'''{user_name} 様

Mind Status へようこそ!

以下のURLからパスワードを設定してアカウントを有効化してください:
{invite_url}

※このリンクは7日間有効です。

---
Mind Status 運営チーム
''',
            from_email=default_from,
            recipient_list=[user_email],
            fail_silently=False,
        )
        
        logger.info(f'✅ SMTP送信成功（開発環境・招待）: {user_email}')
        return bool(result)
        
    except Exception as e:
        logger.error(
            f'❌ SMTP送信失敗（開発環境・招待）: {user_email} '
            f'- {type(e).__name__}: {str(e)}'
        )
        return False


def _send_password_reset_via_smtp(user_email, user_name, reset_url):
    """Django標準SMTP経由でパスワードリセットメール送信（開発環境専用）"""
    
    is_production = not getattr(settings, 'DEBUG', False)
    if is_production:
        logger.critical(
            f'🚨 CRITICAL: 本番環境でSMTP送信が呼ばれました！'
        )
        return False
    
    try:
        from django.core.mail import send_mail
        default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindstatus.com')
        
        result = send_mail(
            subject='Mind Status - パスワードリセット',
            message=f'''{user_name} 様

パスワードリセットの申し込みを受け付けました。

以下のURLからパスワードを再設定してください:
{reset_url}

※このリンクは1時間有効です。
※このメールに覚えがない場合は無視してください。

---
Mind Status 運営チーム
''',
            from_email=default_from,
            recipient_list=[user_email],
            fail_silently=False,
        )
        
        logger.info(f'✅ SMTP送信成功（開発環境・パスワードリセット）: {user_email}')
        return bool(result)
        
    except Exception as e:
        logger.error(
            f'❌ SMTP送信失敗（開発環境・パスワードリセット）: {user_email} '
            f'- {type(e).__name__}: {str(e)}'
        )
        return False
