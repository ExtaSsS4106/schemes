from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from .forms import RegisterForm

# Create your views here.
@login_required
def index(request):
    return render(request, "main/index.html")


# выход из аккаунта
@login_required(login_url='/login')
def logout_view(request):
    logout(request)
    return redirect('/')

# регистрация
def sign_up(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('/')
    else:
        form = RegisterForm()

    return render(request, 'registration/sign_up.html', {"form": form})