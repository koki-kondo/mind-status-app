"""
Database models for Mind Status application.
"""

import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """カスタムユーザーマネージャー（emailでログイン）"""
    
    def create_user(self, email, full_name, password=None, **extra_fields):
        """一般ユーザーを作成"""
        if not email:
            raise ValueError('メールアドレスは必須です')
        if not full_name:
            raise ValueError('氏名は必須です')
        
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, full_name, password=None, **extra_fields):
        """管理者ユーザーを作成"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_activated', True)
        extra_fields.setdefault('role', 'ADMIN')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, full_name, password, **extra_fields)


class Organization(models.Model):
    """組織モデル（学校・企業）"""
    
    ORG_TYPE_CHOICES = [
        ('SCHOOL', '学校'),
        ('COMPANY', '企業'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('組織名', max_length=255)
    org_type = models.CharField('組織種別', max_length=20, choices=ORG_TYPE_CHOICES)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)
    
    class Meta:
        db_table = 'organizations'
        verbose_name = '組織'
        verbose_name_plural = '組織'
    
    def __str__(self):
        return self.name


class User(AbstractUser):
    """カスタムユーザーモデル（管理者・一般ユーザー統合）"""
    
    ROLE_CHOICES = [
        ('ADMIN', '管理者'),
        ('USER', '一般ユーザー'),
    ]
    
    GENDER_CHOICES = [
        ('MALE', '男性'),
        ('FEMALE', '女性'),
        ('OTHER', 'その他'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField('メールアドレス', unique=True)
    role = models.CharField('権限', max_length=20, choices=ROLE_CHOICES, default='USER')
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name='users',
        verbose_name='所属組織',
        null=True,  # システム管理者は組織未所属でもOK
        blank=True
    )
    is_activated = models.BooleanField('アカウント有効化済み', default=False)
    
    # 個人情報
    full_name = models.CharField('氏名', max_length=100)
    full_name_kana = models.CharField('氏名カナ', max_length=100, null=True, blank=True)
    gender = models.CharField('性別', max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    birth_date = models.DateField('生年月日', null=True, blank=True)
    
    # 企業用フィールド
    employee_number = models.CharField('社員番号', max_length=50, null=True, blank=True)
    department = models.CharField('部署・所属', max_length=100, null=True, blank=True)
    position = models.CharField('役職', max_length=100, null=True, blank=True)
    
    # 学校用フィールド
    student_number = models.CharField('学籍番号・出席番号', max_length=50, null=True, blank=True)
    grade = models.IntegerField('学年', null=True, blank=True)
    class_name = models.CharField('組・クラス', max_length=50, null=True, blank=True)
    
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)
    
    # AbstractUserのusernameは使わず、emailでログイン
    username = None
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    # カスタムUserManagerを使用
    objects = UserManager()
    
    class Meta:
        db_table = 'users'
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"


class InviteToken(models.Model):
    """招待トークンモデル"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='invite_tokens',
        verbose_name='招待されたユーザー'
    )
    token = models.UUIDField('トークン', default=uuid.uuid4, unique=True)
    expires_at = models.DateTimeField('有効期限')
    is_used = models.BooleanField('使用済み', default=False)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    
    class Meta:
        db_table = 'invite_tokens'
        verbose_name = '招待トークン'
        verbose_name_plural = '招待トークン'
    
    def __str__(self):
        return f"Invite for {self.user.email}"
    
    def is_valid(self):
        """トークンが有効かチェック"""
        return not self.is_used and timezone.now() < self.expires_at


class StatusLog(models.Model):
    """ステータス記録モデル"""
    
    STATUS_CHOICES = [
        ('GREEN', '健康'),
        ('YELLOW', '注意'),
        ('RED', '警告'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='status_logs',
        verbose_name='ユーザー'
    )
    status = models.CharField('ステータス', max_length=10, choices=STATUS_CHOICES)
    comment = models.TextField('コメント', blank=True)
    created_at = models.DateTimeField('記録日時', auto_now_add=True)
    
    class Meta:
        db_table = 'status_logs'
        verbose_name = 'ステータス記録'
        verbose_name_plural = 'ステータス記録'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.status} ({self.created_at.date()})"
