# backend/api/management/commands/create_superuser.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Organization
import os

User = get_user_model()

class Command(BaseCommand):
    help = '環境変数から管理者ユーザーを作成'

    def handle(self, *args, **options):
        # 環境変数から取得
        email = os.getenv('SUPERUSER_EMAIL')
        password = os.getenv('SUPERUSER_PASSWORD')
        full_name = os.getenv('SUPERUSER_NAME', '管理者')
        org_name = os.getenv('SUPERUSER_ORG_NAME', 'デフォルト組織')
        org_type = os.getenv('SUPERUSER_ORG_TYPE', 'COMPANY')
        
        # 環境変数が設定されていない場合はスキップ
        if not email or not password:
            self.stdout.write(
                self.style.WARNING('SUPERUSER_EMAIL と SUPERUSER_PASSWORD が設定されていません。スキップします。')
            )
            return
        
        # 既に存在する場合はスキップ
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'ユーザー {email} は既に存在します。スキップします。')
            )
            return
        
        try:
            # 組織を作成または取得
            organization, created = Organization.objects.get_or_create(
                name=org_name,
                defaults={'org_type': org_type}
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'組織 "{org_name}" を作成しました')
                )
            
            # 管理者を作成
            user = User.objects.create_superuser(
                email=email,
                password=password,
                full_name=full_name,
                organization=organization,
                role='ADMIN',
                is_activated=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ 管理者ユーザー {email} を作成しました')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ エラー: {str(e)}')
            )
