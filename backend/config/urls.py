"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def health_check(request):
    return HttpResponse("OK")

urlpatterns = [
    path('', health_check),  # ← 追加
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]