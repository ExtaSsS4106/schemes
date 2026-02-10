from django.contrib import admin
from django.urls import path, re_path
from .import views 

urlpatterns = [
    path('login', views.login_api),
    path('sign_up', views.sign_up_api),
    path('logout', views.logout_api),
    path('test_token', views.test_token),
]
