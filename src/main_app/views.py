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
def get_schema(request, schema_id):
    user = request.user
    schema = get_object_or_404(Schemes, user=user, id=schema_id)
    project_data = json.loads(schema.data)
    return JsonResponse({'status': 'success',"data":project_data, "schema": schema})

@login_required
def save_schema(request):
    if request.method == 'POST':
        try:
            user = request.user
            data = json.loads(request.body)
            
            schema_id = data.get('id')
            schema_title = data.get('name')
            schema_dump = data  
            
            dump_json = json.dumps(schema_dump)
            
            if schema_id:
                try:
                    schema = Schemes.objects.get(id=schema_id, user=user)
                    schema.title = schema_title
                    schema.data = dump_json  
                    schema.save()
                except Schemes.DoesNotExist:
                    schema = Schemes.objects.create(
                        user=user,
                        title=schema_title,
                        data=dump_json
                    )
            else:
                schema = Schemes.objects.create(
                    user=user,
                    title=schema_title,
                    data=dump_json
                )
            
            return JsonResponse({
                'status': 'success',
                'schema_id': schema.id,
                'message': 'Схема сохранена'
            })
            
        except Exception as e:
            print(f"Error saving schema: {e}")
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'status': 'error', 'message': 'Method not allowed'}, status=405)

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