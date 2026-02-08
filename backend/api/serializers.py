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
            'student_number', 'grade', 'class_name', 'attendance_number',
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
