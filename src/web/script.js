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

async function register() {
    console.log('Register function called');
    const username = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password1 = document.getElementById('regPassword1').value;
    const password2 = document.getElementById('regPassword2').value;
    const regError = document.getElementById('regError');

    if (!username || !email || !password1 || !password2) {
        regError.textContent = 'Заполните все поля';
        return;
    }else if (!validateEmail(email)) {
        regError.textContent = 'Введите корректный email';
        return;
    }else if (password1 !== password2){
        regError.textContent = 'Пароли не совподают';
    }else{

        response = await eel.do_Register(username,email,password1,password2)();
        if (response === true){
            regError.textContent = '';
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword1').value = '';
            document.getElementById('regPassword2').value = '';
            showNotification('Регистрация успешна! Теперь войдите в систему');
            showScreen('projects');
        }else{
        regError.textContent = '';
        
        showNotification('Ошибка регистрации');            
        }
    }
}

async function login() {
    console.log('Login function called');
    const username = document.getElementById('loginName').value.trim();
    const passwd = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');

    

    if (!username || !passwd){
        loginError.textContent = "Все поля должны быть заполнены!"
    }else{
        response = await eel.do_Login(username, passwd)();   
        if (response === true){
            regError.textContent = '';
            document.getElementById('loginName').value = '';
            document.getElementById('loginPassword').value = '';
            showNotification('Регистрация успешна! Теперь войдите в систему');
            showScreen('projects');
        }else{
         regError.textContent = '';
        
        showNotification('Ошибка регистрации');   
        }
    }
    
    // Очищаем поля
    //document.getElementById('loginEmail').value = '';
   //document.getElementById('loginPassword').value = '';
    
    //showNotification('Вход выполнен успешно!');
   // showScreen('projects');
}

function logout() {
    console.log('Logout function called');
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        showScreen('start');
        showNotification('Вы вышли из системы');
    }
}

// ===== УПРАВЛЕНИЕ ПРОЕКТАМИ =====

function showEmptyProjects(grid) {
    grid.innerHTML = `
        <div class="empty-projects">
            <div class="empty-container">
                <i class="fas fa-folder-open"></i>
                <h3>Нет проектов</h3>
                <p>У вас пока нет созданных проектов микрочипов.<br>Создайте свой первый проект!</p>
                <button id="createFirstProjectBtn" class="big-create-btn">
                    <i class="fas fa-plus"></i>
                    <span>Создать первый проект</span>
                </button>
            </div>
        </div>
    `;
    
    // Добавляем обработчик для кнопки создания проекта
    const createBtn = document.getElementById('createFirstProjectBtn');
    if (createBtn) {
        createBtn.addEventListener('click', createNewProject);
    }
}

async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    grid.innerHTML = '';
    grid.classList.remove('has-projects');

    try {
        // ВАЖНО: eel.get_projects() возвращает Promise, нужно await!
        const projects = await eel.get_projects()();  // обратите внимание на ()()
        
        console.log('Получены проекты:', projects);
        
        if (!projects || projects.length === 0) {
            showEmptyProjects(grid);
        } else {
            // Есть проекты - показываем сетку
            grid.classList.add('has-projects');
            
            projects.forEach((project) => {
                const projectDiv = document.createElement('div');
                projectDiv.className = 'project';
                projectDiv.setAttribute('data-id', project.id);
                projectDiv.innerHTML = `
                    <i class="fas fa-microchip project-icon"></i>
                    <h3>${project.title || 'Без названия'}</h3>
                    <div class="project-controls">
                        <button class="project-btn rename-btn" data-id="${project.id}" title="Переименовать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="project-btn delete-btn" data-id="${project.id}" title="Удалить">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                
                // Обработчик клика на проект
                projectDiv.addEventListener('click', (e) => {
                    if (!e.target.closest('.project-btn')) {
                        openProject(project.id);
                    }
                });
                
                grid.appendChild(projectDiv);
            });

            // Добавляем обработчики для кнопок управления проектами
            document.querySelectorAll('.rename-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const projectId = btn.getAttribute('data-id');
                    await renameProject(projectId);
                });
            });
            
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const projectId = btn.getAttribute('data-id');
                    await deleteProject(projectId);
                });
            });

            // Добавляем кнопку для создания нового проекта
            const addProjectDiv = document.createElement('div');
            addProjectDiv.className = 'project add';
            addProjectDiv.innerHTML = `
                <i class="fas fa-plus"></i>
                <p>Новый проект</p>
                <p class="add-hint">Добавить микрочип</p>
            `;
            addProjectDiv.addEventListener('click', createNewProject);
            grid.appendChild(addProjectDiv);
        }
    } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
        showEmptyProjects(grid, 'Ошибка загрузки проектов');
    }
}

function createNewProject() {
    console.log('Creating new project');
    currentProjectIndex = -1;
    currentProjectData = null;
    showScreen('editor');
}

async function openProject(index) {
    console.log('Opening project:', index);
    currentProjectIndex = index;
    showScreen('editor');
    
    data = await eel.get_schema_data(index)();

    // Даем время на инициализацию редактора
    setTimeout(() => {
        if (chipCanvas) {
            loadChipProject(data);
        }
    }, 100);
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

// ===== РЕДАКТОР МИКРОЧИПОВ =====

function initChipEditor() {
    console.log('Initializing chip editor');
    if (!chipCanvas) {
        const container = document.getElementById('chipCanvasContainer');
        chipCanvas = new fabric.Canvas('chipCanvas', {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: '#0f172a',
            selectionColor: 'rgba(102, 126, 234, 0.3)',
            selectionBorderColor: '#667eea',
            selectionLineWidth: 2
        });
        
        setupCanvasEvents();
        updateCanvasSize();
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', updateCanvasSize);
    }
    
    // Загружаем проект если есть индекс
    if (currentProjectIndex >= 0) {
        loadChipProject(currentProjectIndex);
    } else {
        // Новый проект
        chipCanvas.clear();
        chipConnections = [];
        currentProjectData = {
            name: `Микрочип ${new Date().toLocaleDateString('ru-RU')}`,
            date: new Date().toISOString(),
            components: [],
            connections: []
        };
        document.getElementById('projectNameDisplay').textContent = currentProjectData.name;
        updateComponentCount();
        updateConnectionCount();
    }
    
    updateEditorStatus('Готов к работе');
}

function setupCanvasEvents() {
    // Обновление соединений при перемещении
    chipCanvas.on('object:moving', function(e) {
        updateConnectionsForObject(e.target);
    });
    
    // Обновление соединений при масштабировании
    chipCanvas.on('object:scaling', function(e) {
        updateConnectionsForObject(e.target);
    });
    
    // Обновление статуса при выделении
    chipCanvas.on('selection:created', function() {
        updateEditorStatus();
    });
    
    chipCanvas.on('selection:cleared', function() {
        updateEditorStatus();
    });
    
    // Обновление счетчиков
    chipCanvas.on('object:added', updateComponentCount);
    chipCanvas.on('object:removed', updateComponentCount);
    
    // Удаление по двойному клику
    chipCanvas.on('mouse:dblclick', function(options) {
        if (options.target) {
            deleteObject(options.target);
        }
    });
    
    // Горячие клавиши
    document.addEventListener('keydown', handleEditorHotkeys);
}

function updateCanvasSize() {
    if (chipCanvas) {
        const container = document.getElementById('chipCanvasContainer');
        chipCanvas.setDimensions({
            width: container.clientWidth,
            height: container.clientHeight
        });
        chipCanvas.renderAll();
    }
}

function addChipComponent(id, ico, title) {
    
    const left = 100 + Math.random() * 400;
    const top = 100 + Math.random() * 200;
    
    fabric.Image.fromURL(ico, function(img) {

        img.set({
            left: left,
            top: top,

            scaleX: 60 / img.width,
            scaleY: 60 / img.height,
            rx: 5,
            ry: 5,
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            componentId: id,
            title: title,
            ico: ico,
            componentType: 'component',
            hasControls: true,
            hasBorders: true,
            lockRotation: true,
            borderColor: '#667eea',
            cornerColor: '#667eea'
        });

        
        
        chipCanvas.add(img);
        chipCanvas.setActiveObject(img);
        chipCanvas.renderAll();
        
        updateEditorStatus(`Добавлен ${title}`);
        updateComponentCount();
    });
}

function connectSelected() {
    const activeObjects = chipCanvas.getActiveObjects();
    
    if (activeObjects.length === 2) {
        const obj1 = activeObjects[0];
        const obj2 = activeObjects[1];
        
        if (obj1.componentType && obj2.componentType) {
            createConnection(obj1, obj2);
            updateEditorStatus('Компоненты соединены');
        } else {
            updateEditorStatus('Выберите два компонента микрочипа');
        }
    } else {
        updateEditorStatus('Выберите два компонента для соединения');
    }
}

function createConnection(obj1, obj2) {
    const center1 = getComponentCenter(obj1);
    const center2 = getComponentCenter(obj2);
    
    const line = new fabric.Line([
        center1.x, center1.y,
        center2.x, center2.y
    ], {
        stroke: '#94a3b8',
        strokeWidth: 3,
        fill: '',
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        class: 'connection-line',
        connectedObjects: [obj1, obj2],
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    chipCanvas.add(line);
    chipCanvas.sendToBack(line);
    
    chipConnections.push({
        line: line,
        obj1: obj1,
        obj2: obj2
    });
    
    updateConnectionCount();
    chipCanvas.renderAll();
}

function getComponentCenter(obj) {
    const bounds = obj.getBoundingRect();
    return {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2
    };
}

function updateConnectionsForObject(obj) {
    chipConnections.forEach(conn => {
        if (conn.obj1 === obj || conn.obj2 === obj) {
            const center1 = getComponentCenter(conn.obj1);
            const center2 = getComponentCenter(conn.obj2);
            
            conn.line.set({
                x1: center1.x,
                y1: center1.y,
                x2: center2.x,
                y2: center2.y
            });
            conn.line.setCoords();
        }
    });
    chipCanvas.renderAll();
}

function clearSelection() {
    chipCanvas.discardActiveObject();
    chipCanvas.renderAll();
    updateEditorStatus('Выделение снято');
}

function deleteSelected() {
    const activeObject = chipCanvas.getActiveObject();
    if (activeObject) {
        deleteObject(activeObject);
    } else {
        updateEditorStatus('Выберите объект для удаления');
    }
}

function deleteObject(obj) {
    // Удаляем связанные соединения
    chipConnections = chipConnections.filter(conn => {
        if (conn.obj1 === obj || conn.obj2 === obj) {
            chipCanvas.remove(conn.line);
            return false;
        }
        return true;
    });
    
    chipCanvas.remove(obj);
    updateComponentCount();
    updateConnectionCount();
    updateEditorStatus('Объект удален');
}

function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.1, 3);
    applyZoom();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
    applyZoom();
}

function applyZoom() {
    document.getElementById('zoomLevel').textContent = Math.round(zoomLevel * 100) + '%';
    chipCanvas.setZoom(zoomLevel);
    chipCanvas.renderAll();
}

function saveChipProject() {

    
    const projectName = prompt('Введите название проекта:', 
        currentProjectData?.name || `Микрочип ${new Date().toLocaleDateString('ru-RU')}`);
    
    if (!projectName || projectName.trim() === '') {
        return;
    }
    
    // Собираем данные проекта
    const components = chipCanvas.getObjects()
        .filter(obj => obj.componentType)
        .map(obj => ({
            id: obj.id,
            type: obj.componentType,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY
        }));
    
    const connections = chipConnections.map(conn => ({
        id: conn.line.id,
        fromId: conn.obj1.id,
        toId: conn.obj2.id
    }));
    
    const projectData = {
        name: projectName.trim(),
        date: new Date().toISOString(),
        components: components,
        connections: connections,
        zoom: zoomLevel,
        lastModified: new Date().toISOString()
    };
    
    // Сохраняем в localStorage
    let users = JSON.parse(localStorage.getItem('users'));
    if (!users || !users[currentUser]) return;
    
    if (currentProjectIndex >= 0) {
        // Обновляем существующий проект
        users[currentUser].projects[currentProjectIndex] = projectData;
    } else {
        // Добавляем новый проект
        users[currentUser].projects.push(projectData);
        currentProjectIndex = users[currentUser].projects.length - 1;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    document.getElementById('projectNameDisplay').textContent = projectData.name;
    currentProjectData = projectData;
    
    showNotification('Проект сохранен!');
    updateEditorStatus('Проект сохранен');
}

function loadChipProject(data) {
    // Очищаем canvas
    chipCanvas.clear();
    chipConnections = [];
    
    // Получаем данные проекта (уже не нужно переприсваивать)
    const projectData = data.list_projects || data;
    
    // Восстанавливаем компоненты
    const componentMap = new Map();
    
    if (projectData.objects && Array.isArray(projectData.objects)) {
        projectData.objects.forEach((compData, index) => {
            
            const uniqueCompData = {
                ...compData,
                id: compData.id + '_' + index 
            };
            
            const component = createComponentFromData(uniqueCompData);
            if (component) {
                componentMap.set(compData.id, component); 
                chipCanvas.add(component);
            }
        });
    }
    
    // Восстанавливаем соединения
    if (projectData.connections && Array.isArray(projectData.connections)) {
        projectData.connections.forEach(connData => {
            // Ищем компоненты по оригинальным id
            const components = Array.from(componentMap.entries())
                .filter(([id, comp]) => id === connData.fromObjectId || id === connData.toObjectId);
            
            if (components.length >= 2) {
                const obj1 = componentMap.get(connData.fromObjectId);
                const obj2 = componentMap.get(connData.toObjectId);
                
                if (obj1 && obj2) {
                    createConnection(obj1, obj2);
                }
            }
        });
    }
    
    currentProjectData = projectData;
    
    // Правильно отображаем название проекта
    const projectName = projectData.metadata?.name || projectData.metadata || 'Без названия';
    document.getElementById('projectNameDisplay').textContent = projectName;
    
    updateComponentCount();
    updateConnectionCount();
    updateEditorStatus(`Проект "${projectName}" загружен`);
}


function createComponentFromData(data) {
    const colors = {
        cpu: '#FF6B6B',
        gpu: '#4ECDC4',
        ram: '#FFD166',
        io: '#06D6A0',
        cache: '#118AB2'
    };
    
    const labels = {
        cpu: 'CPU',
        gpu: 'GPU',
        ram: 'RAM',
        io: 'I/O',
        cache: 'Cache'
    };
    
    const rect = new fabric.Rect({
        width: data.width || 100,
        height: data.height || 60,
        fill: colors[data.type] || '#667eea',
        stroke: '#ffffff',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        shadow: new fabric.Shadow({
            color: 'rgba(0, 0, 0, 0.3)',
            blur: 5,
            offsetX: 0,
            offsetY: 2
        })
    });
    
    const text = new fabric.Text(labels[data.type] || data.type, {
        fontSize: 16,
        fill: 'white',
        fontWeight: 'bold',
        fontFamily: 'Arial'
    });
    
    const group = new fabric.Group([rect, text], {
        left: data.left || 100,
        top: data.top || 100,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        componentType: data.type,
        id: data.id || `comp_${Date.now()}`,
        scaleX: data.scaleX || 1,
        scaleY: data.scaleY || 1
    });
    
    return group;
}

function exportAsPNG() {
    const link = document.createElement('a');
    const projectName = currentProjectData?.name || 'microchip_design';
    link.download = `${projectName.replace(/\s+/g, '_')}.png`;
    link.href = chipCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
    });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    updateEditorStatus('Экспортировано как PNG');
}

function exportAsJSON() {
    const projectData = {
        name: currentProjectData?.name || 'Microchip Design',
        date: new Date().toISOString(),
        components: chipCanvas.getObjects()
            .filter(obj => obj.componentType)
            .map(obj => ({
                id: obj.id,
                type: obj.componentType,
                left: obj.left,
                top: obj.top,
                width: obj.width,
                height: obj.height,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY
            })),
        connections: chipConnections.map(conn => ({
            id: conn.line.id,
            fromId: conn.obj1.id,
            toId: conn.obj2.id
        }))
    };
    
    const jsonStr = JSON.stringify(projectData, null, 2);
    const link = document.createElement('a');
    const projectName = currentProjectData?.name || 'microchip_design';
    link.download = `${projectName.replace(/\s+/g, '_')}.json`;
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    updateEditorStatus('Экспортировано как JSON');
}

function updateComponentCount() {
    if (!chipCanvas) return;
    const components = chipCanvas.getObjects().filter(obj => obj.componentType);
    document.getElementById('compCount').textContent = components.length;
}

function updateConnectionCount() {
    document.getElementById('connCount').textContent = chipConnections.length;
}

function updateEditorStatus(message) {
    const statusElement = document.getElementById('workspaceStatus');
    if (message) {
        statusElement.textContent = message;
        return;
    }
    
    const selected = chipCanvas.getActiveObjects();
    if (selected.length === 0) {
        statusElement.textContent = 'Выберите компонент для редактирования';
    } else if (selected.length === 1) {
        statusElement.textContent = 'Выбран 1 компонент. Перетаскивайте для перемещения';
    } else if (selected.length === 2) {
        statusElement.textContent = 'Выбрано 2 компонента. Нажмите "Соединить"';
    } else {
        statusElement.textContent = `Выбрано ${selected.length} компонентов`;
    }
}

function handleEditorHotkeys(e) {
    // Проверяем что мы в редакторе
    if (!document.getElementById('editor').classList.contains('active')) return;
    
    // Delete - удалить выделенное
    if (e.key === 'Delete') {
        deleteSelected();
        e.preventDefault();
    }
    
    // Ctrl+S - сохранить
    if (e.ctrlKey && e.key === 's') {
        saveChipProject();
        e.preventDefault();
    }
    
    // Ctrl+D - снять выделение
    if (e.ctrlKey && e.key === 'd') {
        clearSelection();
        e.preventDefault();
    }
    
    // Ctrl+C - соединить
    if (e.ctrlKey && e.key === 'c') {
        connectSelected();
        e.preventDefault();
    }
    
    // +/- - масштаб
    if (e.key === '+' || e.key === '=') {
        zoomIn();
        e.preventDefault();
    }
    if (e.key === '-' || e.key === '_') {
        zoomOut();
        e.preventDefault();
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, setting up event listeners');

    const components_array = await eel.get_components()();

    const projectDiv = document.querySelector('.components-elements'); // Добавил точку

    if (projectDiv) {
            
            components_array.forEach((ca) => {
                projectDiv.innerHTML += `                
                    <button class="tool-btn component-btn" data-type="component"
                        data-id="${ca.id}"
                        data-title="${ca.title}"
                        data-ico="${ca.ico}"
                    >
                        <div class="component-icon-container">
                            <img src="${ca.ico}" alt="${ca.title}" class="component-icon">
                        </div>
                        <span class="component-title">${ca.title}</span>
                    </button>
                `;
            });
        }
    // УСТАНАВЛИВАЕМ ВСЕ ОБРАБОТЧИКИ СОБЫТИЙ
    
    // Кнопки на стартовом экране
    document.getElementById('registerBtn').addEventListener('click', () => showScreen('register'));
    document.getElementById('loginBtn').addEventListener('click', () => showScreen('login'));
    
    // Кнопки регистрации
    document.getElementById('doRegisterBtn').addEventListener('click', register);
    document.getElementById('backFromRegister').addEventListener('click', () => showScreen('start'));
    
    // Кнопки входа
    document.getElementById('doLoginBtn').addEventListener('click', login);
    document.getElementById('backFromLogin').addEventListener('click', () => showScreen('start'));
    
    // Кнопка выхода
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Кнопки редактора
    document.getElementById('backToProjectsBtn').addEventListener('click', showProjects);
    document.getElementById('saveChipBtn').addEventListener('click', saveChipProject);
    
    // Кнопки инструментов редактора
    document.querySelectorAll('.component-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const id = this.getAttribute('data-id');
            const ico = this.getAttribute('data-ico');
            const title = this.getAttribute('data-title');
            
            console.log('Adding component:', {id, title, ico});
            
            // Вызываем функцию добавления
            addChipComponent(id, ico, title);
        });
    });
    
    document.getElementById('clearSelectionBtn').addEventListener('click', clearSelection);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
    document.getElementById('connectSelectedBtn').addEventListener('click', connectSelected);
    document.getElementById('zoomInBtn').addEventListener('click', zoomIn);
    document.getElementById('zoomOutBtn').addEventListener('click', zoomOut);
    document.getElementById('zoomInSmallBtn').addEventListener('click', zoomIn);
    document.getElementById('zoomOutSmallBtn').addEventListener('click', zoomOut);
    document.getElementById('saveProjectBtn').addEventListener('click', saveChipProject);
    document.getElementById('exportPngBtn').addEventListener('click', exportAsPNG);
    document.getElementById('exportJsonBtn').addEventListener('click', exportAsJSON);
    
    // Проверяем авторизацию
    const savedUser = localStorage.getItem('currentUser');
    console.log('Saved user from localStorage:', savedUser);
    
    if (savedUser) {
        currentUser = savedUser;
        showScreen('projects');
    } else {
        showScreen('start');
    }
    
    // Горячие клавиши для навигации
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const activeScreen = document.querySelector('.screen.active').id;
            if (activeScreen === 'register' || activeScreen === 'login') {
                showScreen('start');
            } else if (activeScreen === 'editor') {
                showScreen('projects');
            }
        }
    });
});