# api/views.py
from django.contrib.auth.models import User

from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import UserSerializer
from django.contrib.auth import login, logout
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.authtoken.models import Token
import json

from main_app.models import Schemes, Components


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([]) 
@csrf_exempt
def login_api(request):
    """
    {
        "username": "your_name",
        "password": "your_passwd"
    }
    """
    print("DATA",request.data['username'], request.data['password'])
    user = get_object_or_404(User, username=request.data['username'])
    serializer = UserSerializer(instance=user)
    if not user.check_password(request.data['password']):
        return Response({'detail':'not_found'}, status=status.HTTP_400_NOT_FOUND)
    token, created=Token.objects.get_or_create(user=user)
    
    return Response({"token": token.key, "user":serializer.data})

@api_view(['POST'])
@permission_classes([AllowAny])
def sign_up_api(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.create(request.data)
        user = User.objects.get(username=request.data['username'])
        login(request, user)
        token = Token.objects.create(user=user)
        return Response({"token": token.key, "user":serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    try:
        request.user.auth_token.delete()
        return Response({'detail': 'Успешный выход'})
    except:
        return Response({'detail': 'Выполнен выход'})
        

@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_schemas(request):
    us_projects = Schemes.objects.filter(user=request.auth.user.id)
    list_projects = []
    for p in us_projects:
        list_projects.append({"id":p.id, "title":p.title})
    print(list_projects)
    return Response({"list_projects": list_projects})

@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_schema_data(request):
    data = Schemes.objects.get(user=request.auth.user.id, id=request.data['schema_id'])
    return Response({data.data})

@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_components(request):
    components = Components.objects.all()
    data = []
    for comp in components:
        data.append({
            'id': comp.id,
            'title': comp.title,
            'ico': comp.ico.url,
        })
    return Response(data)

@api_view(['POST'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def save_schema(request):
        try:
            user = request.user
            data = json.loads(request.body)
            print(data)
            schema_id = data.get('id')
            schema_title = data.get('name')
            schema_dump = data  
            print(f"""
                  {schema_id}
                  {schema_title}
                  {schema_dump}
                  """)
            dump_json = json.dumps(schema_dump)
 
            if schema_id:
                try:
                    schema = Schemes.objects.get(id=schema_id, user=user)
                    schema.id = schema_id
                    schema.title = schema_title
                    schema.data = dump_json  
                    schema.save()
                except Schemes.DoesNotExist:
                    schema = Schemes.objects.create(
                        id = schema_id,
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
            
            return Response({
                'status': 'success',
                'schema_id': schema.id,
                'message': 'Схема сохранена'
            })
            
        except Exception as e:
            print(f"Error saving schema: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=500)
    