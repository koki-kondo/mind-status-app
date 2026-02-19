"""
Validators for Mind Status API.
"""

from rest_framework import serializers


# 組織タイプ別ホワイトリスト
SCHOOL_ALLOWED_FIELDS = {
    'full_name', 'full_name_kana', 'email', 'gender', 'birth_date',
    'student_number', 'grade', 'class_name'
}

COMPANY_ALLOWED_FIELDS = {
    'full_name', 'full_name_kana', 'email', 'gender', 'birth_date',
    'employee_number', 'department', 'position'
}

# 絶対に許可しないフィールド（権限系）
FORBIDDEN_FIELDS = {
    'role', 'is_staff', 'is_superuser', 'is_active', 'is_activated',
    'password', 'groups', 'user_permissions', 'organization',
    'id', 'created_at', 'updated_at'
}


def validate_bulk_upload_row(row_data: dict, org_type: str, row_num: int) -> dict:
    """
    1行のデータを検証
    
    Args:
        row_data: CSV/Excelの1行データ
        org_type: 組織タイプ（SCHOOL or COMPANY）
        row_num: 行番号（エラー表示用）
    
    Returns:
        検証済みデータ
    
    Raises:
        serializers.ValidationError: 検証エラー
    """
    
    # 空行チェック
    if not any(row_data.values()):
        raise serializers.ValidationError(f'空行です')
    
    # キーの取得（Noneは除外、空文字列は許容）
    provided_keys = {k for k, v in row_data.items() if k is not None}
    
    # 1. 禁止フィールドチェック（セキュリティ最重要）
    forbidden = provided_keys & FORBIDDEN_FIELDS
    if forbidden:
        raise serializers.ValidationError(
            f'禁止されたフィールドが含まれています: {", ".join(forbidden)}'
        )
    
    # 2. ホワイトリストチェック
    allowed = SCHOOL_ALLOWED_FIELDS if org_type == 'SCHOOL' else COMPANY_ALLOWED_FIELDS
    unknown = provided_keys - allowed
    if unknown:
        raise serializers.ValidationError(
            f'不正なフィールドが含まれています: {", ".join(unknown)}'
        )
    
    # 3. 組織タイプと矛盾するフィールドのチェック（値が入っている場合のみ）
    if org_type == 'SCHOOL':
        company_fields = {k for k in provided_keys & (COMPANY_ALLOWED_FIELDS - SCHOOL_ALLOWED_FIELDS) if row_data.get(k)}
        if company_fields:
            raise serializers.ValidationError(
                f'学校では使用できない企業用フィールドが含まれています: {", ".join(company_fields)}'
            )
    elif org_type == 'COMPANY':
        school_fields = {k for k in provided_keys & (SCHOOL_ALLOWED_FIELDS - COMPANY_ALLOWED_FIELDS) if row_data.get(k)}
        if school_fields:
            raise serializers.ValidationError(
                f'企業では使用できない学校用フィールドが含まれています: {", ".join(school_fields)}'
            )
    
    # 4. 必須フィールドチェック
    email = str(row_data.get('email', '')).strip()
    full_name = str(row_data.get('full_name', '')).strip()
    
    if not email:
        raise serializers.ValidationError(f'メールアドレスは必須です')
    if not full_name:
        raise serializers.ValidationError(f'氏名は必須です')
    
    # 5. メールアドレス形式チェック（簡易）
    if '@' not in email:
        raise serializers.ValidationError(f'メールアドレスの形式が正しくありません')
    
    # 6. データのクリーニング（空文字列をNoneに変換）
    cleaned_data = {}
    for key, value in row_data.items():
        if key in allowed:
            cleaned_value = str(value).strip() if value is not None else None
            cleaned_data[key] = cleaned_value if cleaned_value else None
    
    return cleaned_data


def validate_bulk_upload_file(file) -> None:
    """
    アップロードされたファイルを検証
    
    Args:
        file: アップロードファイル
    
    Raises:
        serializers.ValidationError: ファイル検証エラー
    """
    
    # ファイルサイズチェック（10MB制限）
    if file.size > 10 * 1024 * 1024:
        raise serializers.ValidationError('ファイルサイズは10MB以下にしてください')
    
    # ファイル拡張子チェック
    allowed_extensions = ['.csv', '.xlsx', '.xls']
    file_ext = file.name.lower().split('.')[-1]
    if f'.{file_ext}' not in allowed_extensions:
        raise serializers.ValidationError(
            f'CSV または Excel ファイルのみアップロード可能です（許可: {", ".join(allowed_extensions)}）'
        )


def normalize_string(value):
    """
    Excel/LibreOffice由来の文字列を正規化
    
    処理内容:
    - Unicode正規化（NFC形式）
    - 前後の空白削除
    - 全角スペース削除
    - 制御文字削除
    - 不可視文字削除
    
    Args:
        value: 入力値（str, int, None）
    
    Returns:
        str | None: 正規化後の文字列
    
    Examples:
        >>> normalize_string('  男  ')
        '男'
        >>> normalize_string('男　')  # 全角スペース
        '男'
        >>> normalize_string('　男\n')  # 全角スペース + 改行
        '男'
    """
    if value is None:
        return None
    
    # 文字列化
    if not isinstance(value, str):
        value = str(value)
    
    # 1. Unicode正規化（NFC: 最も一般的な形式）
    import unicodedata
    value = unicodedata.normalize('NFC', value)
    
    # 2. 全角スペースを半角スペースに変換
    value = value.replace('\u3000', ' ')  # 　→ (space)
    
    # 3. 制御文字・不可視文字を削除
    # (\r, \n, \t, BOM, ZERO WIDTH SPACE等)
    value = ''.join(char for char in value if not unicodedata.category(char).startswith('C'))
    
    # 4. 前後の空白削除
    value = value.strip()
    
    # 5. 空文字列は None
    if not value:
        return None
    
    return value


