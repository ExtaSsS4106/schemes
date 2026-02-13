// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let chipCanvas = null;
let chipConnections = [];
let currentProjectData = null;
let zoomLevel = 1;
let currentProjectId = null;
let projectName = document.getElementById('editor').getAttribute('data-title');
// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    // Получаем ID проекта из data-атрибута
    const editorScreen = document.getElementById('editor');
    currentProjectId = editorScreen?.getAttribute('data-id');
    
    console.log('Current project ID:', currentProjectId);
    
    // Инициализируем редактор
    initChipEditor();
    
    // Кнопки редактора
    const saveChipBtn = document.getElementById('saveChipBtn');
    if (saveChipBtn) saveChipBtn.addEventListener('click', saveChipProject);
    
    // Кнопки компонентов
    document.querySelectorAll('.component-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const btn = e.currentTarget;
            const id = btn.getAttribute('data-type');
            const ico = btn.getAttribute('data-ico');
            const title = btn.getAttribute('data-title');
            
            console.log('Adding component:', {id, title, ico});
            
            if (ico) {
                addChipComponent(id, ico, title);
            }
        });
    });
    
    // Кнопки управления
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');
    if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', clearSelection);
    
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', deleteSelected);
    
    const connectSelectedBtn = document.getElementById('connectSelectedBtn');
    if (connectSelectedBtn) connectSelectedBtn.addEventListener('click', connectSelected);
    
    // Зум кнопки
    const zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    
    const zoomInSmallBtn = document.getElementById('zoomInSmallBtn');
    if (zoomInSmallBtn) zoomInSmallBtn.addEventListener('click', zoomIn);
    
    const zoomOutSmallBtn = document.getElementById('zoomOutSmallBtn');
    if (zoomOutSmallBtn) zoomOutSmallBtn.addEventListener('click', zoomOut);
    
    // Кнопки проекта
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveChipProject);
    
    const exportPngBtn = document.getElementById('exportPngBtn');
    if (exportPngBtn) exportPngBtn.addEventListener('click', exportAsPNG);
    
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportAsJSON);
    
    // Кнопка назад
    const backToProjectsBtn = document.getElementById('backToProjectsBtn');
    if (backToProjectsBtn) {
        backToProjectsBtn.addEventListener('click', () => {
            window.location.href = '/home';
        });
    }
    
    // Горячие клавиши
    document.addEventListener('keydown', handleEditorHotkeys);
});

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
            backgroundColor: '#f8f8f8',
            selectionColor: 'rgba(102, 126, 234, 0.3)',
            selectionBorderColor: '#667eea',
            selectionLineWidth: 2
        });
        
        setupCanvasEvents();
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    // Получаем ID проекта из URL или data-атрибута
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('project_id');
    
    if (projectId) {
        currentProjectId = projectId;
        loadChipProject(projectId);
    } else {
        // Новый проект
        chipCanvas.clear();
        chipConnections = [];
        currentProjectData = {
            id: Date.now().toString(),
            name: `Микрочип ${new Date().toLocaleDateString('ru-RU')}`,
            components: [],
            connections: [],
            zoom: 1
        };
        const nameDisplay = document.getElementById('projectNameDisplay');
        if (nameDisplay) nameDisplay.textContent = currentProjectData.name;
        updateComponentCount();
        updateConnectionCount();
        updateEditorStatus('Новый проект');
    }
}


function setupCanvasEvents() {
    if (!chipCanvas) return;
    
    chipCanvas.on('object:moving', function(e) {
        if (e.target.type === 'image') {
            updateConnectionsForObject(e.target);
            constrainObject(e.target);
        }
    });
    
    chipCanvas.on('object:scaling', function(e) {
        if (e.target.type === 'image') {
            updateConnectionsForObject(e.target);
            constrainObject(e.target);
        }
    });
    
    chipCanvas.on('selection:created', updateEditorStatus);
    chipCanvas.on('selection:cleared', updateEditorStatus);
    chipCanvas.on('object:added', updateComponentCount);
    chipCanvas.on('object:removed', updateComponentCount);
    
    chipCanvas.on('mouse:dblclick', function(options) {
        if (options.target) {
            deleteObject(options.target);
        }
    });
}

function updateCanvasSize() {
    if (chipCanvas) {
        const container = document.getElementById('chipCanvasContainer');
        if (container) {
            chipCanvas.setDimensions({
                width: container.clientWidth,
                height: container.clientHeight
            });
            chipCanvas.renderAll();
        }
    }
}

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





























// ===== ДОБАВЛЕНИЕ КОМПОНЕНТОВ =====

function addChipComponent(id, ico, title) {
    if (!chipCanvas) return;
    
    const left = 100 + Math.random() * 400;
    const top = 100 + Math.random() * 200;
    
    fabric.Image.fromURL(ico, function(img) {
        const scaleX = 60 / img.width;
        const scaleY = 60 / img.height;
        
        img.set({
            crossOrigin: 'anonymous',
            left: left,
            top: top,
            scaleX: scaleX,
            scaleY: scaleY,
            rx: 5,
            ry: 5,
            id: 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            componentId: id,
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
    }, null, {
        crossOrigin: 'anonymous'
    });
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
        objectCaching: false
    });
    
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
    
    // Г-образное соединение
    if (absDx > absDy) {
        const midX = p1.x + (dx / 2);
        return [
            { x: p1.x, y: p1.y },
            { x: midX, y: p1.y },
            { x: midX, y: p2.y },
            { x: p2.x, y: p2.y }
        ];
    } else {
        const midY = p1.y + (dy / 2);
        return [
            { x: p1.x, y: p1.y },
            { x: p1.x, y: midY },
            { x: p2.x, y: midY },
            { x: p2.x, y: p2.y }
        ];
    }
}

function getComponentCenter(obj) {
    return obj.getCenterPoint();
}

function updateConnectionsForObject(obj) {
    if (!chipCanvas) return;
    
    chipConnections.forEach(conn => {
        if (conn.obj1 === obj || conn.obj2 === obj) {
            const center1 = getComponentCenter(conn.obj1);
            const center2 = getComponentCenter(conn.obj2);
            
            const points = calculateOrthogonalPoints(center1, center2);
            
            conn.line.set({
                points: points
            });
            conn.line.setCoords();
            conn.points = points;
        }
    });
    chipCanvas.renderAll();
}

// ===== УПРАВЛЕНИЕ =====

function clearSelection() {
    if (!chipCanvas) return;
    chipCanvas.discardActiveObject();
    chipCanvas.renderAll();
    updateEditorStatus('Выделение снято');
}

function deleteSelected() {
    if (!chipCanvas) return;
    
    const activeObject = chipCanvas.getActiveObject();
    if (activeObject) {
        deleteObject(activeObject);
    } else {
        updateEditorStatus('Выберите объект для удаления');
    }
}

function deleteObject(obj) {
    if (!chipCanvas) return;
    
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

// ===== МАСШТАБ =====

function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.1, 3);
    applyZoom();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
    applyZoom();
}

function applyZoom() {
    if (!chipCanvas) return;
    
    const zoomElement = document.getElementById('zoomLevel');
    if (zoomElement) zoomElement.textContent = Math.round(zoomLevel * 100) + '%';
    
    chipCanvas.setZoom(zoomLevel);
    chipCanvas.renderAll();
}

























// ===== СОХРАНЕНИЕ =====

async function saveChipProject() {
    if (!chipCanvas) return;

    if (!document.getElementById('editor').getAttribute('data-title')) {
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
    try{
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const response = await fetch('/save_schema/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(projectData)
        });
        showNotification('Проект сохранен');
    }catch{
        showNotification('Ошибка сохранения');
    }
    
    
}
































// ===== ЗАГРУЗКА ПРОЕКТА ИЗ БД =====
async function loadChipProject(projectId) {
    if (!chipCanvas) {
        console.error('Canvas not initialized');
        return;
    }
    
    showNotification('Загрузка проекта...', 'info');
    
    try {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        
        const response = await fetch(`/get_schema/${projectId}/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrfToken,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки проекта');
        }
        
        const result = await response.json();
        console.log('Loaded project:', result);
        
        // Очищаем canvas
        chipCanvas.clear();
        chipConnections = [];
        
        // Получаем данные проекта (result.data или сам result)
        const project = result.data || result;
        
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
































// ===== ЭКСПОРТ =====

function exportAsPNG() {
    if (!chipCanvas) return;
    
    const link = document.createElement('a');
    const projectName = currentProjectData?.name || 'microchip_design';
    link.download = `${projectName.replace(/\s+/g, '_')}.png`;
    link.href = chipCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
    });
    link.click();
    
    updateEditorStatus('Экспортировано как PNG');
}

function exportAsJSON() {
    if (!chipCanvas) return;
    
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
        name: document.getElementById('projectNameDisplay')?.textContent || 'Microchip Design',
        date: new Date().toISOString(),
        components: components,
        connections: connections,
        zoom: zoomLevel
    };
    
    const jsonStr = JSON.stringify(projectData, null, 2);
    const link = document.createElement('a');
    const projectName = currentProjectData?.name || 'microchip_design';
    link.download = `${projectName.replace(/\s+/g, '_')}.json`;
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    link.click();
    
    updateEditorStatus('Экспортировано как JSON');
}

// ===== СЧЕТЧИКИ И СТАТУС =====

function updateComponentCount() {
    if (!chipCanvas) return;
    const components = chipCanvas.getObjects().filter(obj => obj.componentType === 'component');
    const compCount = document.getElementById('compCount');
    if (compCount) compCount.textContent = components.length;
}

function updateConnectionCount() {
    const connCount = document.getElementById('connCount');
    if (connCount) connCount.textContent = chipConnections.length;
}

function updateEditorStatus(message) {
    const statusElement = document.getElementById('workspaceStatus');
    if (!statusElement) return;
    
    if (message) {
        statusElement.textContent = message;
        return;
    }
    
    if (!chipCanvas) return;
    
    const selected = chipCanvas.getActiveObjects();
    if (selected.length === 0) {
        statusElement.textContent = 'Выберите компонент для редактирования';
    } else if (selected.length === 1) {
        statusElement.textContent = 'Выбран 1 компонент';
    } else if (selected.length === 2) {
        statusElement.textContent = 'Выбрано 2 компонента. Нажмите "Соединить"';
    } else {
        statusElement.textContent = `Выбрано ${selected.length} компонентов`;
    }
}

function handleEditorHotkeys(e) {
    const editor = document.getElementById('editor');
    if (!editor || !editor.classList.contains('active')) return;
    
    if (e.key === 'Delete') {
        deleteSelected();
        e.preventDefault();
    }
    
    if (e.ctrlKey && e.key === 's') {
        saveChipProject();
        e.preventDefault();
    }
    
    if (e.ctrlKey && e.key === 'd') {
        clearSelection();
        e.preventDefault();
    }
    
    if (e.ctrlKey && e.key === 'c') {
        connectSelected();
        e.preventDefault();
    }
    
    if (e.key === '+' || e.key === '=') {
        zoomIn();
        e.preventDefault();
    }
    if (e.key === '-' || e.key === '_') {
        zoomOut();
        e.preventDefault();
    }
}

// ===== УВЕДОМЛЕНИЯ =====

function showNotification(message, type = 'success') {
    console.log('Notification:', message);
    
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}




// Создание скрина 


function takeScreenshot() {
    
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






















