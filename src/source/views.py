from random import randint
import eel, requests, json
from .settings import *


@eel.expose
def GET_HOST():
    return HOST

@eel.expose
def do_Login(username, passwd):
    print(username, passwd)
    r = requests.post(
            url=f"{HOST}/api/login",
            data=json.dumps({  # data + json.dumps, НЕ json=
                "username": username,
                "password": passwd
            }),
            headers={
                'Content-Type': 'application/json'
            }
        )
    print(r.status_code)
    print(r.json())
    if r.status_code == 200:
        with open("data.json", "w", encoding="utf-8") as f:
            json.dump(r.json(), f, indent=4, ensure_ascii=False)
        return True
    return False

@eel.expose
def do_Register(username,email,password1,password2):
    print(username,email,password1,password2)
    r = requests.post(
            url=f"{HOST}/api/sign_up",
            data=json.dumps({  # data + json.dumps, НЕ json=
                "username": username,
                "email": email,
                "password1": password1,
                "password2": password2
            }),
            headers={
                'Content-Type': 'application/json'
            }
        )
    print(r.status_code)
    print(r.json())
    if r.status_code == 200:
        with open("data.json", "w", encoding="utf-8") as f:
            json.dump(r.json(), f, indent=4, ensure_ascii=False)
        return True
    return False

@eel.expose
def get_projects():
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    r = requests.get(
            url=f"{HOST}/api/get_schemas",
            headers={
                'Authorization':f'Token {data.get('token')}',
                'Content-Type': 'application/json'
            }
        )
    print(r.status_code)
    print(r.json()["list_projects"])
    if r.status_code == 200:
        return r.json()["list_projects"]
    return False

@eel.expose
def get_schema_data(schema_id):
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    response = requests.get(
        url=f"{HOST}/api/get_schema_data",
        data=json.dumps({"schema_id": schema_id}),
        headers={
            'Authorization': f'Token {data.get("token")}',
            'Content-Type': 'application/json'
        }
    )
    
    if response.status_code == 200:
        result = response.json()
        # API возвращает ['{...}'] - массив с JSON строкой
        if isinstance(result, list) and len(result) > 0:
            print(json.loads(result[0]))
            return json.loads(result[0])
        return result
    return False


@eel.expose
def get_components():
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    r = requests.get(
            url=f"{HOST}/api/get_components",
            headers={
                'Authorization':f'Token {data.get('token')}',
                'Content-Type': 'application/json'
            }
        )
    print(r.status_code)
    print(r.json())
    if r.status_code == 200:
        return r.json(), HOST
    return False

@eel.expose
def save_schema(project):
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    r = requests.post(
        url=f"{HOST}/api/save_schema/",
        headers={
            'Authorization': f'Token {data.get("token")}',  
            'Content-Type': 'application/json'
        },
        json=project 
    )
    
    print(f"Status code: {r.status_code}")
    
    if r.status_code == 200:
        result = r.json()
        print(f"Response: {result}")
        return result
    
    print(f"Error response: {r.text}")
    return False