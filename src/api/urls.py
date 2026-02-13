from django.contrib import admin
from django.urls import path, re_path
from .import views 
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('login', views.login_api),
    path('sign_up', views.sign_up_api),
    path('logout', views.logout_api),
    path('get_schemas', views.get_schemas),
    path('get_schema_data', views.get_schema_data),
    path('get_components', views.get_components),
    path('save_schema/', views.save_schema),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
