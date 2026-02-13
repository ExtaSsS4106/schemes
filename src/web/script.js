

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let chipCanvas = null;
let chipConnections = [];
let currentProjectData = null;
let zoomLevel = 1;
let currentProjectIndex = -1;
let currentProjectId = null;
let projectName = null;
let host = 'http://localhost:8000'; // глобальная переменная



// ===== ДОБАВЛЯЕМ ЭТУ СТРОЧКУ ДЛЯ ОТЛАДКИ =====
console.log('Script loaded! Current user:', currentUser, host);

























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
                <p>У вас пока нет созданных проектов.<br>Создайте свой первый проект!</p>
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
    
    const container = document.getElementById('chipCanvasContainer');
    if (!container) {
        console.error('Canvas container not found');
        return;
    }
    
    if (!chipCanvas) {
        chipCanvas = new fabric.Canvas('chipCanvas', {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: '#ffffff',
            selectionColor: 'rgba(102, 126, 234, 0.3)',
            selectionBorderColor: '#667eea',
            selectionLineWidth: 2
        });
        
        setupCanvasEvents();
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    // Загружаем проект если есть данные
    if (currentProjectData) {
        loadChipProject(currentProjectData);
    } else {
        // Новый проект
        chipCanvas.clear();
        chipConnections = [];
        currentProjectData = {
            name: `Микрочип ${new Date().toLocaleDateString('ru-RU')}`,
            components: [],
            connections: [],
            zoom: 1
        };
        const nameDisplay = document.getElementById('projectNameDisplay');
        if (nameDisplay) nameDisplay.textContent = currentProjectData.name;
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
    if (!chipCanvas) {
        console.error('Canvas not initialized');
        return;
    }
    const left = 100 + Math.random() * 400;
    const top = 100 + Math.random() * 200;
    fabric.Image.fromURL(ico, function(img) {
        // Создаем уникальный ID для компонента
        const componentId = 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Масштабируем изображение
        const scaleX = 60 / img.width;
        const scaleY = 60 / img.height;
        
        img.set({
            left: left,
            top: top,
            scaleX: scaleX,
            scaleY: scaleY,
            rx: 5,
            ry: 5,
            id: componentId,
            componentId: id,  // ID из базы данных
            title: title,
            ico: ico,
            componentType: 'component',
            hasControls: true,
            hasBorders: true,
            lockRotation: true,
            borderColor: '#667eea',
            cornerColor: '#667eea',
            cornerSize: 8,
            transparentCorners: false
        });
        
        // Добавляем ограничение перемещения
        img.on('moving', function() {
            constrainObject(img);
        });
        
        img.on('scaling', function() {
            constrainObject(img);
        });
        
        chipCanvas.add(img);
        chipCanvas.setActiveObject(img);
        chipCanvas.renderAll();
        
        updateEditorStatus(`Добавлен ${title}`);
        updateComponentCount();
        
        console.log('Component added:', {
            id: componentId,
            title: title,
            position: {left, top}
        });
        
    }, function(error) {
        console.error('Error loading image:', error);
        showNotification('Ошибка загрузки изображения компонента', 'error');
    }, {
        crossOrigin: 'anonymous'
    });
}

// Ограничение перемещения за пределы canvas
function constrainObject(obj) {
    if (!chipCanvas) return;
    
    const canvasWidth = chipCanvas.getWidth();
    const canvasHeight = chipCanvas.getHeight();
    const objWidth = obj.getScaledWidth();
    const objHeight = obj.getScaledHeight();
    
    if (obj.left < 0) obj.set('left', 0);
    if (obj.top < 0) obj.set('top', 0);
    if (obj.left + objWidth > canvasWidth) {
        obj.set('left', canvasWidth - objWidth);
    }
    if (obj.top + objHeight > canvasHeight) {
        obj.set('top', canvasHeight - objHeight);
    }
    obj.setCoords();
}

// ===== СОЕДИНЕНИЯ С ПРЯМЫМИ УГЛАМИ =====

function connectSelected() {
    if (!chipCanvas) return;
    
    const activeObjects = chipCanvas.getActiveObjects();
    
    if (activeObjects.length === 2) {
        const obj1 = activeObjects[0];
        const obj2 = activeObjects[1];
        
        // Проверяем, не соединены ли уже
        const alreadyConnected = chipConnections.some(conn => 
            (conn.obj1 === obj1 && conn.obj2 === obj2) || 
            (conn.obj1 === obj2 && conn.obj2 === obj1)
        );
        
        if (alreadyConnected) {
            updateEditorStatus('Компоненты уже соединены');
            return;
        }
        
        if (obj1.componentType && obj2.componentType) {
            createConnection(obj1, obj2);
            updateEditorStatus('Компоненты соединены');
        } else {
            updateEditorStatus('Выберите два компонента');
        }
    } else {
        updateEditorStatus('Выберите два компонента для соединения');
    }
}

function createConnection(obj1, obj2) {
    if (!chipCanvas) return;
    
    const center1 = getComponentCenter(obj1);
    const center2 = getComponentCenter(obj2);
    
    const points = calculateOrthogonalPoints(center1, center2);
    
    const line = new fabric.Polyline(points, {
        stroke: '#2563eb',
        strokeWidth: 2.5,
        fill: '',
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        class: 'connection-line',
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        objectCaching: false,
        perPixelTargetFind: false
    });
    
    // Сохраняем связанные объекты
    line.connectedObjects = [obj1, obj2];
    line.obj1Id = obj1.id;
    line.obj2Id = obj2.id;
    
    chipCanvas.add(line);
    chipCanvas.sendToBack(line);
    
    chipConnections.push({
        line: line,
        obj1: obj1,
        obj2: obj2,
        points: points
    });
    
    updateConnectionCount();
    chipCanvas.renderAll();
}

function calculateOrthogonalPoints(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    // Вертикальное соединение
    if (absDx < 20) {
        return [
            { x: p1.x, y: p1.y },
            { x: p1.x, y: p2.y }
        ];
    }
    
    // Горизонтальное соединение
    if (absDy < 20) {
        return [
            { x: p1.x, y: p1.y },
            { x: p2.x, y: p1.y }
        ];
    }
    
    const offset = 30;
    const dirX = dx > 0 ? 1 : -1;
    const dirY = dy > 0 ? 1 : -1;
    
    // Г-образное соединение
    if (absDx > absDy * 1.5) {
        const midX = p1.x + (dx / 2);
        return [
            { x: p1.x, y: p1.y },
            { x: midX, y: p1.y },
            { x: midX, y: p2.y },
            { x: p2.x, y: p2.y }
        ];
    }
    
    if (absDy > absDx * 1.5) {
        const midY = p1.y + (dy / 2);
        return [
            { x: p1.x, y: p1.y },
            { x: p1.x, y: midY },
            { x: p2.x, y: midY },
            { x: p2.x, y: p2.y }
        ];
    }
    
    // Z-образное соединение
    return [
        { x: p1.x, y: p1.y },
        { x: p1.x + (offset * dirX), y: p1.y },
        { x: p1.x + (offset * dirX), y: p2.y - (offset * dirY) },
        { x: p2.x - (offset * dirX), y: p2.y - (offset * dirY) },
        { x: p2.x - (offset * dirX), y: p2.y },
        { x: p2.x, y: p2.y }
    ];
}

function getComponentCenter(obj) {
    const bounds = obj.getBoundingRect();
    return {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2
    };
}

function updateConnectionsForObject(obj) {
    if (!chipCanvas) return;
    
    chipConnections.forEach(conn => {
        if (conn.obj1 === obj || conn.obj2 === obj) {
            const center1 = getComponentCenter(conn.obj1);
            const center2 = getComponentCenter(conn.obj2);
            
            const points = calculateOrthogonalPoints(center1, center2);
            
            conn.line.set({
                points: points.map(p => new fabric.Point(p.x, p.y))
            });
            conn.line.setCoords();
            conn.points = points;
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











































// ===== СОХРАНЕНИЕ ПРОЕКТА =====

async function saveChipProject() {
    if (!chipCanvas) return;

    if (!projectName) {
        projectName = prompt('Введите название проекта:', 
        currentProjectData?.name || `Микрочип ${new Date().toLocaleDateString('ru-RU')}`);
    
        if (!projectName || projectName.trim() === '') {
            return;
    }
    };
    
    const components = chipCanvas.getObjects()
        .filter(obj => obj.componentType === 'component')
        .map(obj => ({
            id: obj.id,
            componentId: obj.componentId,
            title: obj.title,
            ico: obj.ico,
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY
        }));
    
    const connections = chipConnections.map(conn => ({
        id: conn.line.id,
        fromId: conn.obj1.id,
        toId: conn.obj2.id
    }));
    
    const projectData = {
        id: currentProjectId || Date.now().toString(),
        name: projectName,
        date: new Date().toISOString(),
        components: components,
        connections: connections,
        zoom: zoomLevel,
        lastModified: new Date().toISOString()
    };
    
    console.log('Project saved:', projectData);
    try {
        // ✅ ПРАВИЛЬНО: добавляем () и await
        const result = await eel.save_schema(projectData)();
        console.log('Save result:', result);
        
        if (result && result.status === 'success') {
            showNotification('✅ Проект сохранен');
            currentProjectId = result.id || currentProjectId;
        } else {
            showNotification('❌ Ошибка сохранения', 'error');
        }
        
    } catch(error) {
        console.error('Save error:', error);
        showNotification('❌ Ошибка сохранения', 'error');
    }
    
    
}

































// ===== ЗАГРУЗКА ПРОЕКТА ИЗ БД =====
async function loadChipProject(project) {

    if (!chipCanvas) {
        console.error('Canvas not initialized');
        return;
    }
    
    showNotification('Загрузка проекта...', 'info');
    
    projectName = project.name;
    try {
  
        
        // Очищаем canvas
        chipCanvas.clear();
        chipConnections = [];
        
        // Получаем данные проекта (result.data или сам result)
        
        // Обновляем название
        const nameDisplay = document.getElementById('projectNameDisplay');
        if (nameDisplay) nameDisplay.textContent = project.name || 'Без названия';
        
        // Сохраняем ID проекта
        currentProjectId = project.id;
        currentProjectData = project;
        
        // Карта для соответствия старых и новых ID компонентов
        const componentMap = new Map();
        
        // Загружаем компоненты
        if (project.components && Array.isArray(project.components)) {
            const loadPromises = project.components.map(async (compData) => {
                try {
                    // Создаем компонент из данных
                    const component = await createComponentFromData(compData);
                    
                    // Сохраняем в карту
                    componentMap.set(compData.id, component);
                    
                    // Добавляем на canvas
                    chipCanvas.add(component);
                    
                    return component;
                    
                } catch (error) {
                    console.error('Error loading component:', error, compData);
                    return null;
                }
            });
            
            await Promise.all(loadPromises);
        }
        
        // Загружаем соединения
        if (project.connections && Array.isArray(project.connections)) {
            project.connections.forEach(connData => {
                const obj1 = componentMap.get(connData.fromId);
                const obj2 = componentMap.get(connData.toId);
                
                if (obj1 && obj2) {
                    createConnection(obj1, obj2);
                } else {
                    console.warn('Connection objects not found:', connData);
                }
            });
        }
        
        // Восстанавливаем масштаб
        if (project.zoom) {
            zoomLevel = project.zoom;
            applyZoom();
        }
        
        // Обновляем счетчики
        updateComponentCount();
        updateConnectionCount();
        
        chipCanvas.renderAll();
        
        showNotification('Проект загружен');
        updateEditorStatus(`Проект "${project.name}" загружен`);
        
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('❌ Ошибка загрузки проекта', 'error');
    }
}


function createComponentFromData(data) {
    return new Promise((resolve, reject) => {
        if (!data.ico) {
            console.warn('Component has no ico:', data);
            reject(new Error('No image URL'));
            return;
        }
        
        fabric.Image.fromURL(data.ico, function(img) {
            try {
                // Вычисляем масштаб
                const scaleX = data.scaleX || (60 / img.width);
                const scaleY = data.scaleY || (60 / img.height);
                img.set({
                    left: data.left || 100,
                    top: data.top || 100,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    rx: 5,
                    ry: 5,
                    id: data.id || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    componentId: data.componentId,
                    title: data.title,
                    ico: data.ico,
                    componentType: 'component',
                    hasControls: true,
                    hasBorders: true,
                    lockRotation: true,
                    borderColor: '#667eea',
                    cornerColor: '#667eea',
                    cornerSize: 8,
                    transparentCorners: false
                });
                
                // Добавляем обработчики
                img.on('moving', function() {
                    constrainObject(img);
                    updateConnectionsForObject(img);
                });
                
                img.on('scaling', function() {
                    constrainObject(img);
                    updateConnectionsForObject(img);
                });
                
                resolve(img);
                
            } catch (error) {
                console.error('Error setting image properties:', error);
                reject(error);
            }
            
        }, function(error) {
            console.error('Error loading image:', error, data.ico);
            reject(error);
            
        }, {
            crossOrigin: 'anonymous'
        });
    });
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

    const [components_array, fetchedHost] = await eel.get_components()();
    const projectDiv = document.querySelector('.components-elements'); // Добавил точку
    host = fetchedHost;
    if (projectDiv) {
            
            components_array.forEach((ca) => {
                projectDiv.innerHTML += `                
                    <button class="tool-btn component-btn" data-type="component"
                        data-id="${ca.id}"
                        data-title="${ca.title}"
                        data-ico="${host}/${ca.ico}"
                    >
                        <div class="component-icon-container">
                            <img src="${host}/${ca.ico}" alt="${ca.title}" class="component-icon">
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