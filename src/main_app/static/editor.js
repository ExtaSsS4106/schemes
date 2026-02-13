// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentUser = null;
let chipCanvas = null;
let chipConnections = [];
let currentProjectData = null;
let zoomLevel = 1;
let currentProjectId = null;

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event listeners');
    
    currentUser = localStorage.getItem('currentUser');
    
    const urlParams = new URLSearchParams(window.location.search);
    currentProjectId = urlParams.get('project_id');
    
    console.log('Current user:', currentUser);
    console.log('Current project ID:', currentProjectId);
    
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
            const id = btn.getAttribute('data-type') || btn.getAttribute('data-id');
            const ico = btn.getAttribute('data-ico');
            const title = btn.getAttribute('data-title') || id;
            
            if (ico) {
                addChipComponent(id, ico, title);
            } else {
                addChipComponentFallback(id);
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
            window.location.href = '/';
        });
    }
    
    document.addEventListener('keydown', handleEditorHotkeys);
});

// ===== РЕДАКТОР МИКРОЧИПОВ =====

function initChipEditor() {
    console.log('Initializing chip editor');
    
    const container = document.getElementById('chipCanvasContainer');
    if (!container) {
        console.error('Canvas container not found!');
        return;
    }
    
    if (!chipCanvas) {
        chipCanvas = new fabric.Canvas('chipCanvas', {
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: '#fafafa',
            selectionColor: 'rgba(102, 126, 234, 0.3)',
            selectionBorderColor: '#667eea',
            selectionLineWidth: 2
        });
        
        setupCanvasEvents();
        updateCanvasSize();
        
        window.addEventListener('resize', updateCanvasSize);
    }
    
    if (currentProjectId) {
        loadChipProject(currentProjectId);
    } else {
        chipCanvas.clear();
        chipConnections = [];
        currentProjectData = {
            id: Date.now().toString(),
            name: `Микрочип ${new Date().toLocaleDateString('ru-RU')}`,
            date: new Date().toISOString(),
            components: [],
            connections: []
        };
        const nameDisplay = document.getElementById('projectNameDisplay');
        if (nameDisplay) nameDisplay.textContent = currentProjectData.name;
        updateComponentCount();
        updateConnectionCount();
    }
    
    updateEditorStatus('Готов к работе');
}

function setupCanvasEvents() {
    if (!chipCanvas) return;
    
    chipCanvas.on('object:moving', function(e) {
        if (e.target.type === 'image' || e.target.componentType === 'component') {
            updateConnectionsForObject(e.target);
        }
    });
    
    chipCanvas.on('object:scaling', function(e) {
        if (e.target.type === 'image' || e.target.componentType === 'component') {
            updateConnectionsForObject(e.target);
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

// ===== ДОБАВЛЕНИЕ КОМПОНЕНТОВ =====

function addChipComponent(id, ico, title) {
    if (!chipCanvas) return;
    
    const left = 100 + Math.random() * 400;
    const top = 100 + Math.random() * 200;
    
    fabric.Image.fromURL(ico, function(img) {
        const scaleX = 60 / img.width;
        const scaleY = 60 / img.height;
        
        img.set({
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
        
        // Ограничение перемещения
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

function addChipComponentFallback(type) {
    if (!chipCanvas) return;
    
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
        width: 100,
        height: 60,
        fill: colors[type] || '#667eea',
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
    
    const text = new fabric.Text(labels[type] || type, {
        fontSize: 16,
        fill: 'white',
        fontWeight: 'bold',
        fontFamily: 'Arial',
        originX: 'center',
        originY: 'center'
    });
    
    const group = new fabric.Group([rect, text], {
        left: 100 + Math.random() * 400,
        top: 100 + Math.random() * 200,
        hasControls: true,
        hasBorders: true,
        lockRotation: true,
        componentType: type,
        id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    chipCanvas.add(group);
    chipCanvas.setActiveObject(group);
    chipCanvas.renderAll();
    
    updateEditorStatus(`Добавлен ${labels[type]}`);
    updateComponentCount();
}

function createComponentFromData(data) {
    return new Promise((resolve) => {
        fabric.Image.fromURL(data.ico, function(img) {
            img.set({
                left: data.left || 100,
                top: data.top || 100,
                scaleX: data.scaleX || (60 / img.width),
                scaleY: data.scaleY || (60 / img.height),
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
            
            img.on('moving', function() {
                constrainObject(img);
            });
            
            img.on('scaling', function() {
                constrainObject(img);
            });
            
            resolve(img);
        }, null, {
            crossOrigin: 'anonymous'
        });
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

// ===== СОХРАНЕНИЕ И ЗАГРУЗКА =====

function saveChipProject() {
    if (!chipCanvas) return;
    
    if (!currentUser) {
        showNotification('Войдите в систему для сохранения проектов', 'error');
        return;
    }
    
    const projectName = prompt('Введите название проекта:', 
        currentProjectData?.name || `Микрочип ${new Date().toLocaleDateString('ru-RU')}`);
    
    if (!projectName || projectName.trim() === '') {
        return;
    }
    
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
        id: currentProjectData?.id || Date.now().toString(),
        name: projectName.trim(),
        date: new Date().toISOString(),
        components: components,
        connections: connections,
        zoom: zoomLevel,
        lastModified: new Date().toISOString()
    };
    
    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (!users[currentUser]) {
        users[currentUser] = { projects: [] };
    }
    
    const projectIndex = users[currentUser].projects.findIndex(p => p.id === projectData.id);
    
    if (projectIndex >= 0) {
        users[currentUser].projects[projectIndex] = projectData;
    } else {
        users[currentUser].projects.push(projectData);
        currentProjectId = projectData.id;
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    const nameDisplay = document.getElementById('projectNameDisplay');
    if (nameDisplay) nameDisplay.textContent = projectData.name;
    
    currentProjectData = projectData;
    
    showNotification('Проект сохранен!');
    updateEditorStatus('Проект сохранен');
}

async function loadChipProject(projectId) {
    if (!chipCanvas) return;
    
    let users = JSON.parse(localStorage.getItem('users')) || {};
    if (!users[currentUser]) {
        console.error('User not found');
        return;
    }
    
    const projects = users[currentUser].projects;
    const project = projects.find(p => p.id == projectId);
    
    if (!project) {
        console.error('Project not found:', projectId);
        return;
    }
    
    chipCanvas.clear();
    chipConnections = [];
    
    const componentMap = new Map();
    
    if (project.components && Array.isArray(project.components)) {
        const loadPromises = project.components.map(compData => 
            createComponentFromData(compData).then(component => {
                componentMap.set(compData.id, component);
                chipCanvas.add(component);
                return component;
            })
        );
        
        await Promise.all(loadPromises);
    }
    
    if (project.connections && Array.isArray(project.connections)) {
        project.connections.forEach(connData => {
            const obj1 = componentMap.get(connData.fromId);
            const obj2 = componentMap.get(connData.toId);
            
            if (obj1 && obj2) {
                createConnection(obj1, obj2);
            }
        });
    }
    
    if (project.zoom) {
        zoomLevel = project.zoom;
        applyZoom();
    }
    
    currentProjectData = project;
    currentProjectId = project.id;
    
    const nameDisplay = document.getElementById('projectNameDisplay');
    if (nameDisplay) nameDisplay.textContent = project.name || 'Без названия';
    
    updateComponentCount();
    updateConnectionCount();
    updateEditorStatus(`Проект "${project.name}" загружен`);
    chipCanvas.renderAll();
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
    
    const projectData = {
        name: currentProjectData?.name || 'Microchip Design',
        date: new Date().toISOString(),
        components: chipCanvas.getObjects()
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
        statusElement.textContent = 'Выбран 1 компонент. Перетаскивайте для перемещения';
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