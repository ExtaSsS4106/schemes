from django.contrib import admin
from django.urls import path, re_path
from .import views 

urlpatterns = [
    path('login', views.login_api),
    path('sign_up', views.sign_up_api),
    path('logout', views.logout_api),
    path('get_schemas', views.get_schemas),
    path('get_schema_data', views.get_schema_data),
    path('get_components', views.get_components),
]
