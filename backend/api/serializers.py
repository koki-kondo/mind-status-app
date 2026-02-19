"""
Serializers for Mind Status API.
"""

from rest_framework import serializers
from .models import Organization, User, StatusLog, InviteToken


class OrganizationSerializer(serializers.ModelSerializer):
    """組織シリアライザー"""
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'org_type', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    """ユーザーシリアライザー"""
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_type = serializers.CharField(source='organization.org_type', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'full_name_kana', 'gender', 'birth_date',
            'role', 'organization', 'organization_name', 'organization_type', 'is_activated',
            # 企業用
            'employee_number', 'department', 'position',
            # 学校用
            'student_number', 'grade', 'class_name',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class StatusLogSerializer(serializers.ModelSerializer):
    """ステータス記録シリアライザー"""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = StatusLog
        fields = ['id', 'user', 'user_name', 'status', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class InviteTokenSerializer(serializers.ModelSerializer):
    """招待トークンシリアライザー"""
    
    class Meta:
        model = InviteToken
        fields = ['id', 'user', 'token', 'expires_at', 'is_used', 'created_at']
        read_only_fields = ['id', 'token', 'created_at']


class AdminRegistrationSerializer(serializers.Serializer):
    """管理者登録シリアライザー"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, min_length=8, write_only=True)
    full_name = serializers.CharField(required=True, max_length=100)
    organization_name = serializers.CharField(required=True, max_length=255)
    org_type = serializers.ChoiceField(
        required=True,
        choices=['SCHOOL', 'COMPANY'],
        error_messages={'invalid_choice': '組織タイプは SCHOOL または COMPANY を選択してください'}
    )
    
    def validate_email(self, value):
        """メールアドレスの重複チェック"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('このメールアドレスは既に登録されています')
        return value
    
    def create(self, validated_data):
        """組織と管理者アカウントを作成"""
        # 組織を作成
        organization = Organization.objects.create(
            name=validated_data['organization_name'],
            org_type=validated_data['org_type']
        )
        
        # 管理者アカウントを作成
        user = User.objects.create_superuser(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password'],
            organization=organization,
            role='ADMIN',
            is_activated=True
        )
        
        return user


class BulkUploadUserSerializer(serializers.ModelSerializer):
    """一括登録専用Serializer（セキュリティ強化版 + UX改善版）
    
    責務:
    - ユーザー属性のバリデーション（性別・生年月日・メール重複など）
    - エラーメッセージの統一
    - 内部値への変換（「男」→ MALE）
    - organization, role, password はサーバー側で注入
    """
    
    # gender を CharField で上書き（Model の ChoiceField を無効化）
    gender = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    
    class Meta:
        model = User
        fields = [
            'full_name', 'full_name_kana', 'email', 'gender', 'birth_date',
            'employee_number', 'department', 'position',
            'student_number', 'grade', 'class_name',
            'role', 'is_activated', 'organization'
        ]
        extra_kwargs = {
            'email': {
                'error_messages': {
                    'unique': 'このメールアドレスは既に登録されています。',
                    'required': 'メールアドレスは必須です。',
                    'invalid': '有効なメールアドレスを入力してください。',
                }
            },
            'full_name': {
                'error_messages': {
                    'required': '氏名は必須です。',
                }
            },
            'birth_date': {
                'required': False,
                'allow_null': True,
                'error_messages': {
                    'invalid': '生年月日は YYYY-MM-DD 形式で入力してください。（例：2000-01-01）',
                }
            },
            'role': {'read_only': True},
            'is_activated': {'read_only': True},
            'organization': {'read_only': True},
        }
    
    def normalize_text(self, value):
        """
        文字列を正規化（Excel/LibreOffice対応）
        
        処理:
        - Unicode正規化（NFKC）
        - 全角半角スペース除去
        - トリム
        """
        if value is None:
            return None
        
        # 文字列化
        value = str(value)
        
        # Unicode正規化（全角半角統一）
        import unicodedata
        value = unicodedata.normalize('NFKC', value)
        
        # 全角スペース削除 + トリム
        value = value.strip().replace('　', '')
        
        # 空文字列は None
        return value if value else None
    
    def validate_email(self, value):
        """
        メールアドレスの検証
        
        - 形式チェック
        - 重複チェック（同一組織内）
        - 正規化（小文字化・トリム）
        """
        if not value or '@' not in value:
            raise serializers.ValidationError('有効なメールアドレスを入力してください。')
        
        email = value.lower().strip()
        
        # 重複チェック（同一組織内・更新時は自分自身を除外）
        queryset = User.objects.filter(email=email)
        
        # 更新時は自分自身を除外
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        # 組織フィルタ（context から取得）
        organization = self.context.get('organization')
        if organization:
            queryset = queryset.filter(organization=organization)
        
        # アクティブ済みユーザーの重複はエラー
        if queryset.filter(is_activated=True).exists():
            raise serializers.ValidationError('このメールアドレスは既に登録されています。')
        
        return email
    
    def validate_gender(self, value):
        """
        性別の検証と変換（完全対応版）
        
        入力: 「男」「女」「その他」
        出力: "MALE", "FEMALE", "OTHER"
        """
        # 正規化
        value = self.normalize_text(value)
        
        # 空の場合は許容
        if not value:
            return None
        
        # マッピングテーブル
        mapping = {
            '男': 'MALE',
            '女': 'FEMALE',
            'その他': 'OTHER',
            'MALE': 'MALE',
            'FEMALE': 'FEMALE',
            'OTHER': 'OTHER',
            '男性': 'MALE',
            '女性': 'FEMALE',
        }
        
        # マッピング
        if value in mapping:
            return mapping[value]
        
        # エラー
        raise serializers.ValidationError(
            f'性別は「男」「女」「その他」のいずれかで入力してください。（入力値: {value}）'
        )
    
    def validate_birth_date(self, value):
        """
        生年月日の検証
        
        形式: YYYY-MM-DD
        LibreOffice で先頭に ' が付く問題に対応
        """
        if not value:
            return None
        
        # 文字列の場合、先頭の ' を削除
        if isinstance(value, str):
            value = value.lstrip("'").strip()
            
            # 空文字列になった場合は None
            if not value:
                return None
            
            # YYYY-MM-DD 形式に変換
            try:
                from datetime import datetime
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError('生年月日は YYYY-MM-DD 形式で入力してください。（例：2000-01-01）')
        
        # date オブジェクトの場合はそのまま返す
        return value
    
    def validate_grade(self, value):
        """
        学年の検証
        
        LibreOffice で先頭に ' が付く問題に対応
        """
        if value is not None:
            # 文字列の場合、先頭の ' を削除
            if isinstance(value, str):
                value = value.lstrip("'").strip()
            
            if not isinstance(value, int) and not str(value).isdigit():
                raise serializers.ValidationError('学年は数値で入力してください。')
            grade_int = int(value)
            if grade_int < 1 or grade_int > 12:
                raise serializers.ValidationError('学年は1〜12の範囲で入力してください。')
            return grade_int
        return value
    
    def create(self, validated_data):
        """
        ユーザー作成
        
        role, is_activated, organization, password は save() 時に注入される
        """
        password = validated_data.pop('password', None)
        
        if password:
            user = User.objects.create_user(password=password, **validated_data)
        else:
            user = User.objects.create(**validated_data)
        
        return user
    
    def update(self, instance, validated_data):
        """
        ユーザー更新
        
        password は更新しない
        """
        validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
