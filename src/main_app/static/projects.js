// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let chipCanvas = null;
let chipConnections = [];
let currentProjectData = null;
let zoomLevel = 1;
let currentProjectIndex = -1;

// ===== ДОБАВЛЯЕМ ЭТУ СТРОЧКУ ДЛЯ ОТЛАДКИ =====
console.log('Script loaded! Current user:', currentUser);

// ===== ОСНОВНЫЕ ФУНКЦИИ =====

// Показать экран
function showScreen(id) {
    console.log('Showing screen:', id);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    if (id === 'projects') {
        updateUserInfo();
        loadProjects();
    } else if (id === 'editor') {
        initChipEditor();
    }
}

// Функция для показа проектов
function showProjects() {
    showScreen('projects');
}

// Обновить информацию о пользователе
function updateUserInfo() {
    if (!currentUser) return;
    
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        let users = JSON.parse(localStorage.getItem('users'));
        if (users && users[currentUser]) {
            const userData = users[currentUser];
            const displayName = userData.name || 'Пользователь';
            const displayEmail = currentUser.split('@')[0];
            
            userInfo.innerHTML = `
                <i class="fas fa-user-circle"></i> 
                ${displayName} 
                <span style="color: #aaa;">|</span> 
                ${displayEmail}
            `;
        }
    }
}

// Проверка email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Показать уведомление
function showNotification(message, type = 'success') {
    console.log('Notification:', message);
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===== РЕГИСТРАЦИЯ И АВТОРИЗАЦИЯ =====

function register() {
    console.log('Register function called');
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const regError = document.getElementById('regError');

    if (!name || !email || !password) {
        regError.textContent = 'Заполните все поля';
        return;
    }

    if (!validateEmail(email)) {
        regError.textContent = 'Введите корректный email';
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (users[email]) {
        regError.textContent = 'Аккаунт с таким email уже существует';
        return;
    }

    users[email] = {
        name: name,
        password: password,
        projects: []
    };

    localStorage.setItem('users', JSON.stringify(users));
    regError.textContent = '';
    
    // Очищаем поля
    document.getElementById('regName').value = '';
    document.getElementById('regEmail').value = '';
    document.getElementById('regPassword').value = '';
    
    showNotification('Регистрация успешна! Теперь войдите в систему');
    showScreen('login');
}

function login() {
    console.log('Login function called');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');

    if (!email || !password) {
        loginError.textContent = 'Заполните все поля';
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || {};

    if (!users[email]) {
        loginError.textContent = 'Аккаунт не найден';
        return;
    }

    if (users[email].password !== password) {
        loginError.textContent = 'Неверный пароль';
        return;
    }

    currentUser = email;
    localStorage.setItem('currentUser', email);
    loginError.textContent = '';
    
    // Очищаем поля
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    
    showNotification('Вход выполнен успешно!');
    showScreen('projects');
}

function logout() {
    console.log('Logout function called');
    if (confirm('Вы уверены, что хотите выйти?')) {
        window.location.href='/logout'
        showNotification('Вы вышли из системы');
    }
}

// ===== УПРАВЛЕНИЕ ПРОЕКТАМИ =====







async function openProject(projectId) {
    console.log('Opening project:', projectId);
    // Редирект на страницу работы с проектом
    window.location.href = `/work_table`;
}

function deleteProject(index) {
    if (confirm('Вы уверены, что хотите удалить этот проект?')) {
        let users = JSON.parse(localStorage.getItem('users'));
        if (!users || !users[currentUser]) return;
        
        users[currentUser].projects.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        showNotification('Проект удален');
        loadProjects();
    }
}

function renameProject(index) {
    let users = JSON.parse(localStorage.getItem('users'));
    if (!users || !users[currentUser]) return;
    
    const project = users[currentUser].projects[index];
    const newName = prompt('Введите новое название проекта:', project.name);
    
    if (newName && newName.trim() !== '') {
        users[currentUser].projects[index].name = newName.trim();
        localStorage.setItem('users', JSON.stringify(users));
        showNotification('Проект переименован');
        loadProjects();
    }
}




// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
     
    // Кнопка выхода
    document.getElementById('logoutBtn').addEventListener('click', logout);
    // Обработчик клика на проект
    document.querySelectorAll('.project[data-id]').forEach(projectDiv => {
        projectDiv.addEventListener('click', (e) => {
            if (e.target.closest('.project-btn')) return;
            window.location.href = `/work_table?project_id=${projectDiv.dataset.id}`;
        });
    });
        

    document.querySelectorAll('.delete-btn').forEach(btn => {
         btn.addEventListener('click', async (e) => {
             e.stopPropagation();
             const projectId = btn.getAttribute('data-id');
             await deleteProject(projectId);
         });
     });    
    // Добавляем обработчики для кнопок управления проектами
    document.querySelectorAll('.rename-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const projectId = btn.getAttribute('data-id');
            await renameProject(projectId);
        });
    });
});