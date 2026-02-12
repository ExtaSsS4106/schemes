#views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from .forms import RegisterForm
from .models import Schemes, Components
from django.http import JsonResponse, HttpResponse
import json
# Create your views here.

def index(request):
    return render(request, "main/start.html")

@login_required
def home(request):
    schemas = Schemes.objects.filter(user=request.user)
    return render(request, "main/project.html", {'schemas':schemas})

@login_required
def work_table(request):
    project_id = request.GET.get('project_id')
    schema = Schemes.objects.get(id=project_id, user=request.user)
    components = Components.objects.all()
    return render(request, "main/editor.html", {"schema": schema, "components":components})



@login_required
def get_schema(request):
    user = request.user
    Json_ = json.loads(request.body)
    print( Json_)
    schema_id = Json_.get('schema_id')
    data = get_object_or_404(Schemes, user=user, id=schema_id)
    return JsonResponse(data.data)

@login_required
def save_schema(request):
    user = request.user
    data = json.loads(request.body)
    Schemes.objects.update(user=user, id=data.get('schema_id'), title=data.get('schema_title'), data=data.get('dump'))
    return HttpResponse("OK")

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