"""
Views for Mind Status API.
"""

from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Organization, User, StatusLog
from .serializers import OrganizationSerializer, UserSerializer, StatusLogSerializer


class OrganizationViewSet(viewsets.ModelViewSet):
    """組織API"""
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserViewSet(viewsets.ModelViewSet):
    """ユーザーAPI"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """組織でフィルタリング"""
        user = self.request.user
        if user.role == 'ADMIN':
            return User.objects.filter(organization=user.organization)
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bulk_upload(self, request):
        """CSV一括登録"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': '管理者のみアクセス可能です'},
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response(
                {'error': 'ファイルが選択されていません'},
                status=http_status.HTTP_400_BAD_REQUEST
            )
        
        # CSVファイルの検証
        if not csv_file.name.endswith('.csv'):
            return Response(
                {'error': 'CSVファイルのみアップロード可能です'},
                status=http_status.HTTP_400_BAD_REQUEST
            )
        
        import csv
        import io
        
        # CSVファイルを読み込み
        try:
            decoded_file = csv_file.read().decode('utf-8-sig')  # BOM付きUTF-8対応
            csv_reader = csv.DictReader(io.StringIO(decoded_file))
            
            success_count = 0
            error_count = 0
            errors = []
            
            for row_num, row in enumerate(csv_reader, start=2):  # ヘッダー行=1なので2から
                try:
                    # 必須項目チェック
                    email = row.get('email', '').strip()
                    full_name = row.get('full_name', '').strip()
                    
                    if not email or not full_name:
                        errors.append({
                            'row': row_num,
                            'error': '必須項目が入力されていません（email, full_name）'
                        })
                        error_count += 1
                        continue
                    
                    # メールアドレス重複チェック
                    if User.objects.filter(email=email).exists():
                        errors.append({
                            'row': row_num,
                            'email': email,
                            'error': 'このメールアドレスは既に登録されています'
                        })
                        error_count += 1
                        continue
                    
                    # ユーザー作成
                    user = User.objects.create_user(
                        email=email,
                        full_name=full_name,
                        full_name_kana=row.get('full_name_kana', '').strip() or None,
                        organization=request.user.organization,
                        role='USER',
                        is_activated=True,
                        password=User.objects.make_random_password(length=12),
                        department=row.get('department', '').strip() or None,
                        gender=row.get('gender', '').strip() or None,
                        employee_number=row.get('employee_number', '').strip() or None,
                        grade=int(row.get('grade', 0)) if row.get('grade', '').strip() else None,
                        class_name=row.get('class_name', '').strip() or None,
                        attendance_number=int(row.get('attendance_number', 0)) if row.get('attendance_number', '').strip() else None,
                    )
                    success_count += 1
                    
                except Exception as e:
                    errors.append({
                        'row': row_num,
                        'error': str(e)
                    })
                    error_count += 1
            
            return Response({
                'success_count': success_count,
                'error_count': error_count,
                'errors': errors
            })
            
        except Exception as e:
            return Response(
                {'error': f'CSVファイルの読み込みに失敗しました: {str(e)}'},
                status=http_status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def csv_template(self, request):
        """CSVテンプレートダウンロード"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': '管理者のみアクセス可能です'},
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        import csv
        from django.http import HttpResponse
        
        # CSVレスポンス作成
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename="user_template.csv"'
        
        writer = csv.writer(response)
        
        # 組織タイプに応じてヘッダーを変更
        org = request.user.organization
        if org.org_type == 'COMPANY':
            writer.writerow(['email', 'full_name', 'full_name_kana', 'department', 'gender', 'employee_number'])
            writer.writerow(['tanaka@example.com', '田中太郎', 'タナカタロウ', '営業部', 'male', 'E001'])
            writer.writerow(['suzuki@example.com', '鈴木花子', 'スズキハナコ', '人事部', 'female', 'E002'])
        else:  # SCHOOL
            writer.writerow(['email', 'full_name', 'full_name_kana', 'grade', 'class_name', 'attendance_number', 'gender'])
            writer.writerow(['tanaka@example.com', '田中太郎', 'タナカタロウ', '1', 'A組', '1', 'male'])
            writer.writerow(['suzuki@example.com', '鈴木花子', 'スズキハナコ', '1', 'A組', '2', 'female'])
        
        return response


class StatusLogViewSet(viewsets.ModelViewSet):
    """ステータス記録API"""
    queryset = StatusLog.objects.all()
    serializer_class = StatusLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """ユーザーの権限に応じてフィルタリング"""
        user = self.request.user
        if user.role == 'ADMIN':
            # 管理者: 同じ組織の全ユーザーのステータス
            return StatusLog.objects.filter(user__organization=user.organization)
        # 一般ユーザー: 自分のステータスのみ
        return StatusLog.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """ステータス作成時に自動的にユーザーを設定（管理者は記録不可）"""
        if self.request.user.role == 'ADMIN':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('管理者はステータスを記録できません')
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_summary(self, request):
        """管理者用ダッシュボードサマリー"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': '管理者のみアクセス可能です'}, 
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        organization = request.user.organization
        
        # 日本時間で本日の日付を取得
        import pytz
        jst = pytz.timezone('Asia/Tokyo')
        now_jst = timezone.now().astimezone(jst)
        today = now_jst.date()
        
        # デバッグログ
        print(f"[DEBUG] Current time (JST): {now_jst}")
        print(f"[DEBUG] Today's date: {today}")
        
        # 全ユーザー数（管理者を除外）
        total_users = User.objects.filter(
            organization=organization,
            role='USER'
        ).count()
        
        # 各ユーザーの本日の最新ステータスを取得
        users = User.objects.filter(
            organization=organization,
            role='USER'
        )
        
        status_distribution = {
            'GREEN': 0,
            'YELLOW': 0,
            'RED': 0
        }
        today_recorded = 0
        red_alerts = 0
        
        for user in users:
            # このユーザーの本日の最新ステータス
            latest_status = StatusLog.objects.filter(
                user=user,
                created_at__date=today
            ).order_by('-created_at').first()
            
            if latest_status:
                # デバッグログ
                print(f"[DEBUG] User: {user.full_name}, Status: {latest_status.status}, Time: {latest_status.created_at}")
                
                today_recorded += 1
                status_distribution[latest_status.status] += 1
                if latest_status.status == 'RED':
                    red_alerts += 1
        
        return Response({
            'total_users': total_users,
            'today_recorded': today_recorded,
            'red_alerts': red_alerts,
            'status_distribution': status_distribution,
            'date': today.isoformat()
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def alerts(self, request):
        """REDステータスのアラート一覧（最新ステータスがREDのユーザーのみ）"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': '管理者のみアクセス可能です'}, 
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        organization = request.user.organization
        
        # 日本時間で本日の日付を取得
        import pytz
        jst = pytz.timezone('Asia/Tokyo')
        now_jst = timezone.now().astimezone(jst)
        today = now_jst.date()
        
        # 一般ユーザーのみ取得
        users = User.objects.filter(
            organization=organization,
            role='USER'
        )
        
        alerts = []
        for user in users:
            # このユーザーの本日の最新ステータス
            latest_status = StatusLog.objects.filter(
                user=user,
                created_at__date=today
            ).order_by('-created_at').first()
            
            # 最新ステータスがREDの場合のみアラートに追加
            if latest_status and latest_status.status == 'RED':
                # 所属を正しく表示
                if organization.org_type == 'COMPANY':
                    department = user.department or '-'
                else:  # SCHOOL
                    if user.grade and user.class_name:
                        department = f'{user.grade}年{user.class_name}'
                    else:
                        department = '-'
                
                alerts.append({
                    'id': str(latest_status.id),
                    'user_id': str(user.id),
                    'user_name': user.full_name,
                    'department': department,
                    'status': latest_status.status,
                    'comment': latest_status.comment,
                    'created_at': latest_status.created_at.isoformat()
                })
        
        return Response(alerts)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def user_latest_status(self, request):
        """全ユーザーの最新ステータス（管理者を除外）"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': '管理者のみアクセス可能です'}, 
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        organization = request.user.organization
        # 一般ユーザーのみ取得
        users = User.objects.filter(
            organization=organization,
            role='USER'
        ).order_by('full_name')
        
        user_status_list = []
        for user in users:
            latest_log = StatusLog.objects.filter(user=user).order_by('-created_at').first()
            
            # 所属を正しく表示
            if organization.org_type == 'COMPANY':
                department = user.department or '-'
            else:  # SCHOOL
                if user.grade and user.class_name:
                    department = f'{user.grade}年{user.class_name}'
                else:
                    department = '-'
            
            user_status_list.append({
                'id': str(user.id),
                'full_name': user.full_name,
                'email': user.email,
                'department': department,
                'latest_status': latest_log.status if latest_log else None,
                'latest_comment': latest_log.comment if latest_log else None,
                'latest_date': latest_log.created_at.isoformat() if latest_log else None
            })
        
        return Response(user_status_list)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def trend_data(self, request):
        """ステータス推移データ（管理者用）- 期間指定可能"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': '管理者のみアクセス可能です'},
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        organization = request.user.organization
        
        # 期間パラメータ取得（デフォルト: 7日間）
        days = int(request.query_params.get('days', 7))
        if days not in [7, 14, 30]:
            days = 7  # 不正な値の場合は7日間
        
        # 日本時間で日付を生成
        import pytz
        jst = pytz.timezone('Asia/Tokyo')
        today_jst = timezone.now().astimezone(jst).date()
        
        trend_data = []
        
        for i in range(days - 1, -1, -1):  # N日前から今日まで
            target_date = today_jst - timedelta(days=i)
            
            # 一般ユーザーのみ取得
            users = User.objects.filter(
                organization=organization,
                role='USER'
            )
            
            status_count = {
                'GREEN': 0,
                'YELLOW': 0,
                'RED': 0
            }
            
            # 各ユーザーのその日の最新ステータスを取得
            for user in users:
                latest_status = StatusLog.objects.filter(
                    user=user,
                    created_at__date=target_date
                ).order_by('-created_at').first()
                
                if latest_status:
                    status_count[latest_status.status] += 1
            
            trend_data.append({
                'date': target_date.isoformat(),
                'green': status_count['GREEN'],
                'yellow': status_count['YELLOW'],
                'red': status_count['RED'],
                'total': status_count['GREEN'] + status_count['YELLOW'] + status_count['RED']
            })
        
        return Response(trend_data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def export_csv(self, request):
        """ユーザーステータスをCSV出力（管理者用・期間指定可能）"""
        if request.user.role != 'ADMIN':
            return Response(
                {'error': '管理者のみアクセス可能です'},
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        import csv
        from django.http import HttpResponse
        from datetime import datetime
        import pytz
        
        organization = request.user.organization
        
        # 期間パラメータ取得
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # 日本時間のタイムゾーン
        jst = pytz.timezone('Asia/Tokyo')
        
        # 期間指定の有無で処理を分岐
        if start_date_str and end_date_str:
            # 期間指定モード: 全ステータス記録を出力
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': '日付形式が正しくありません（YYYY-MM-DD）'},
                    status=http_status.HTTP_400_BAD_REQUEST
                )
            
            # フィルタパラメータ取得
            department_filter = request.query_params.get('department')
            status_filter = request.query_params.get('status')
            search_query = request.query_params.get('search')
            
            # 指定期間内のステータス記録を取得
            logs = StatusLog.objects.filter(
                user__organization=organization,
                user__role='USER',
                created_at__date__gte=start_date,
                created_at__date__lte=end_date
            )
            
            # フィルタ適用
            if department_filter and department_filter != 'all':
                logs = logs.filter(user__department=department_filter)
            
            if status_filter and status_filter != 'all':
                logs = logs.filter(status=status_filter)
            
            if search_query:
                logs = logs.filter(user__full_name__icontains=search_query)
            
            logs = logs.select_related('user').order_by('user__full_name', 'created_at')
            
            # CSVレスポンス作成
            response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
            filename = f'user_status_{start_date}_{end_date}.csv'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            writer = csv.writer(response)
            
            # ヘッダー行
            writer.writerow([
                '氏名',
                '氏名カナ',
                'メールアドレス',
                '所属',
                'ステータス',
                'コメント',
                '記録日時'
            ])
            
            # データ行
            for log in logs:
                # 所属を正しく表示
                if organization.org_type == 'COMPANY':
                    department = log.user.department or '-'
                else:  # SCHOOL
                    if log.user.grade and log.user.class_name:
                        department = f'{log.user.grade}年{log.user.class_name}'
                    else:
                        department = '-'
                
                # ステータスラベル
                status_labels = {
                    'GREEN': '健康',
                    'YELLOW': '注意',
                    'RED': '警告'
                }
                status_label = status_labels.get(log.status, log.status)
                
                writer.writerow([
                    log.user.full_name,
                    log.user.full_name_kana or '-',
                    log.user.email,
                    department,
                    status_label,
                    log.comment or '-',
                    log.created_at.astimezone(jst).strftime('%Y-%m-%d %H:%M:%S')
                ])
        
        else:
            # 最新ステータスモード（従来の機能）
            # フィルタパラメータ取得
            department_filter = request.query_params.get('department')
            status_filter = request.query_params.get('status')
            search_query = request.query_params.get('search')
            
            users = User.objects.filter(
                organization=organization,
                role='USER'
            )
            
            # フィルタ適用
            if department_filter and department_filter != 'all':
                users = users.filter(department=department_filter)
            
            if search_query:
                users = users.filter(full_name__icontains=search_query)
            
            users = users.order_by('full_name')
            
            # CSVレスポンス作成
            response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
            response['Content-Disposition'] = 'attachment; filename="user_status_latest.csv"'
            
            writer = csv.writer(response)
            
            # ヘッダー行
            writer.writerow([
                '氏名',
                '氏名カナ',
                'メールアドレス',
                '所属',
                '最新ステータス',
                'コメント',
                '記録日時'
            ])
            
            # データ行
            for user in users:
                latest_log = StatusLog.objects.filter(user=user).order_by('-created_at').first()
                
                # ステータスフィルタを適用
                if status_filter and status_filter != 'all':
                    if not latest_log or latest_log.status != status_filter:
                        continue  # このユーザーはスキップ
                
                # 所属を正しく表示
                if organization.org_type == 'COMPANY':
                    department = user.department or '-'
                else:  # SCHOOL
                    if user.grade and user.class_name:
                        department = f'{user.grade}年{user.class_name}'
                    else:
                        department = '-'
                
                # ステータスラベル
                status_labels = {
                    'GREEN': '健康',
                    'YELLOW': '注意',
                    'RED': '警告'
                }
                status_label = status_labels.get(latest_log.status, '未記録') if latest_log else '未記録'
                
                writer.writerow([
                    user.full_name,
                    user.full_name_kana or '-',
                    user.email,
                    department,
                    status_label,
                    latest_log.comment if latest_log else '-',
                    latest_log.created_at.astimezone(jst).strftime('%Y-%m-%d %H:%M:%S') if latest_log else '-'
                ])
        
        return response

