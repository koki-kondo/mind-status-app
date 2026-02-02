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
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'full_name_kana', 'gender',
            'role', 'organization', 'organization_name', 'is_activated',
            'employee_number', 'department', 'grade', 'class_name',
            'attendance_number', 'created_at'
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
