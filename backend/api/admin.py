"""
Django Admin configuration for Mind Status.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Organization, User, InviteToken, StatusLog


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'org_type', 'created_at']
    list_filter = ['org_type', 'created_at']
    search_fields = ['name']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'organization', 'is_activated', 'created_at']
    list_filter = ['role', 'is_activated', 'organization', 'created_at']
    search_fields = ['email', 'full_name', 'employee_number']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('個人情報', {'fields': ('full_name', 'full_name_kana', 'gender')}),
        ('組織情報', {'fields': ('organization', 'role', 'is_activated')}),
        ('企業用', {'fields': ('employee_number', 'department')}),
        ('学校用', {'fields': ('grade', 'class_name', 'attendance_number')}),
        ('権限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('日時', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'organization', 'role', 'password1', 'password2'),
        }),
    )
    
    ordering = ['-created_at']


@admin.register(InviteToken)
class InviteTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'is_used', 'expires_at', 'created_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__email', 'user__full_name']
    readonly_fields = ['token', 'created_at']


@admin.register(StatusLog)
class StatusLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'created_at', 'comment_preview']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'user__full_name', 'comment']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']
    
    def comment_preview(self, obj):
        """コメントのプレビュー表示"""
        if obj.comment:
            return obj.comment[:50] + '...' if len(obj.comment) > 50 else obj.comment
        return '-'
    comment_preview.short_description = 'コメント'
