# schemes



[![Python Version](https://img.shields.io/badge/python-3.12%2B-blue)](https://www.python.org/)
[![Django Version](https://img.shields.io/badge/django-5.2.5%2B-green)](https://www.djangoproject.com/)


### Ключевые особенности

- ✅ Проектирование микросхем
- ✅ Возможность иметь множество проектов
- ✅ Скачивать изображение

## 🚀 Быстрый старт

### Предварительные требования

Перед началом работы убедитесь, что у вас установлены:

- Python 3.12
- pip
- virtualenv (рекомендуется)
- PostgreSQL/MySQL (если используется)

### Установка

1. **Клонирование репозитория**
   ```bash
   git clone https://github.com/yourusername/yourproject.git
   cd /path/to/folder/
   ```
2. **Установка виртуального окружения (venv)**

    - Создайте файл .env в директории /conf/ и вставьте
    ```bash
    SECRET_KEY = 'секретный-ключ-джанго'
    CSRF_TRUSTED_ORIGINS = ["https://разрешённые-ссылки-для-csrf_protect"]
   ```
    - Linux
    ```bash
    python3 -m venv venv
    source /venv/bin/activate
    pip install -r requirements.txt
   ```
    - Windows
    ```bash
    python -m venv venv
    .\venv\Scripts\activate.bat
    pip install -r requirements.txt
   ```
3. **Запуск**
    - Linux
    ```bash
    python3 manage.py runserver 0.0.0.0:8000
   ```
    - Windows
    ```bash
    python manage.py runserver 0.0.0.0:8000
   ```
