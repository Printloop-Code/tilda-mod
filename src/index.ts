import { fabric } from 'fabric';
// import { createIcons } from 'lucide';

type View = 'front' | 'back';

// Типы для конфигурации продукта (аналогично example.js)
type BoundingBox = {
    sizeScalePercentage: number;
    position: {
        x: number;
        y: number;
    };
};

type SideConfig = {
    boundingBox: BoundingBox;
    layers: { [layerName: string]: string };
};

type ProductConfig = {
    printSize: {
        width: number;
        height: number;
        resolution: number;
    };
    sides: { [sideName: string]: SideConfig };
    colors: string[];
};

type LayoutProps = {
    name: string;
    view: View;
}

class Layout {
    type: string = '';
    name: string = '';
    view: View = 'front';
    position = {
        x: 0.5,
        y: 0.5,
    }
    size = 1;
    id: string; // Уникальный идентификатор

    constructor({
        name,
        view = 'front',
    }: LayoutProps) {
        this.name = name;
        this.view = view;
        this.id = Layout.generateId();
    }

    static generateId(): string {
        return `layout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Методы для работы с view
    changeView(newView: View): void {
        const oldView = this.view;
        this.view = newView;
        console.log(`Layout ${this.name} переключен с ${oldView} на ${newView}`);
    }

    toggleView(): View {
        this.view = this.view === 'front' ? 'back' : 'front';
        console.log(`Layout ${this.name} переключен на ${this.view}`);
        return this.view;
    }

    isOnFront(): boolean {
        return this.view === 'front';
    }

    isOnBack(): boolean {
        return this.view === 'back';
    }

    getViewInfo(): string {
        return `${this.name} (${this.type}) - сторона: ${this.view}`;
    }
}

class ImageLayout extends Layout {
    type = 'image';
    preview_url = 'https://kobold.vsemayki.ru/constructor/72fb6f6e-3f01-4aea-9578-d32fb93824dd.jpg';
    size = 0.5;

    constructor({
        name,
        view = 'front',
        preview_url,
    }: LayoutProps & { preview_url: string }) {
        super({ name, view });
        this.preview_url = preview_url;
    }
}

class TextLayout extends Layout {
    type = 'text';
    font = { family: 'Arial', size: 24 };
    name = "PrintLoop";

    constructor({
        name,
        view = 'front',
        font = {
            family: 'Arial',
            size: 24,
        },
    }: LayoutProps & { font: { family: string; size: number } }) {
        super({ name, view });
        this.font = font;
    }
}

type MockupType = 'tshirt' | 'hoodie';

type MockupView = {
    view: View;
    url: string;
}

type MockupColor = {
    name: string;
    hex: string;
    views: MockupView[];
}

type Mockup = {
    type: MockupType;
    colors: MockupColor[];
}

type EditorProps = {
    editorBlockId: string;
    mockupBlockId: string;
    sidesButtonClass: string;
    mockups: Mockup[];
    productConfig: ProductConfig;
    canvasAreaWidth?: number;
    canvasAreaHeight?: number;
}

type Control = {
    name: string;
    icon: string;
    action: (index: number) => void;
}

class Editor {
    layouts: Layout[] = [];
    selectView: View = "front";
    selectColor: string = "white";
    selectType: MockupType = "tshirt";
    mockups: Mockup[] = [];

    editorBlock: HTMLElement | null = null;
    mockupBlock: HTMLImageElement | null = null;
    layoutsBlock: HTMLElement | null = null;
    canvasesContainer: HTMLElement | null = null;

    // Поддержка множественных canvas как в example.js
    canvases: fabric.Canvas[] = [];
    layersCanvases: fabric.StaticCanvas[] = [];
    activeCanvas: fabric.Canvas | null = null;
    activeSide: string = "front";

    // Конфигурация продукта
    productConfig: ProductConfig;

    field = {
        zoom: 0.8,
        aspectRatio: 1 / 0.7,
    }

    layoutClasses: { [key: string]: typeof Layout } = {
        image: ImageLayout,
        text: TextLayout,
    }

    controls: Control[] = [
        {
            name: 'Копировать',
            icon: 'copy',
            action: (index) => {
                // this.copyLayout(index);
            }
        },
        {
            name: 'Удалить',
            icon: 'trash-2',
            action: (index) => {
                // this.deleteLayout(index);
            }
        }
    ]

    // Размеры области canvas - теперь динамические
    canvasAreaWidth = 600;
    canvasAreaHeight = 600;

    // Система привязки и направляющих
    snapTolerance = 10; // Расстояние в пикселях для привязки
    guideShowDistance = 25; // Расстояние показа направляющих (больше зоны привязки)
    guideLines: fabric.Line[] = []; // Массив направляющих линий
    isSnapping = false; // Флаг активности привязки
    snapEnabled = true; // Можно включать/выключать привязку

    // Фильтрация слоев
    showOnlyCurrentSide = true; // Показывать только слои текущей стороны

    // Связь между объектами canvas и layout'ами
    objectLayoutMap = new Map<fabric.Object, string>(); // Объект -> Layout ID

    // Система автосохранения
    autoSaveInterval: NodeJS.Timeout | null = null;
    lastSaveTime = 0;
    hasUnsavedChanges = false;
    saveDebounceTimer: NodeJS.Timeout | null = null;

    constructor({
        editorBlockId,
        mockupBlockId,
        mockups,
        productConfig,
        canvasAreaWidth = 600,
        canvasAreaHeight = 600,
    }: EditorProps) {
        if (mockups.length === 0)
            throw new Error('Mockups are not found');

        this.productConfig = productConfig;
        this.canvasAreaWidth = canvasAreaWidth;
        this.canvasAreaHeight = canvasAreaHeight;

        this.mockupBlock = document.getElementById(mockupBlockId) as HTMLImageElement;
        this.editorBlock = document.getElementById(editorBlockId);

        // Определяем реальные размеры контейнера
        this.updateCanvasSize();

        // Создаем контейнер для canvas
        this.canvasesContainer = document.createElement('div');
        this.canvasesContainer.id = 'canvases';
        this.canvasesContainer.style.position = 'absolute';
        this.canvasesContainer.style.top = '0';
        this.canvasesContainer.style.left = '0';
        this.canvasesContainer.style.width = '100%';
        this.canvasesContainer.style.height = '100%';
        this.canvasesContainer.style.pointerEvents = 'auto'; // Разрешаем события мыши
        this.canvasesContainer.style.zIndex = '1'; // Базовый z-index для контейнера
        this.editorBlock!.appendChild(this.canvasesContainer);

        // Обработчик изменения размера
        this.setupResizeHandler();

        try {
            if (localStorage.getItem('layouts')) {
                const savedLayouts = JSON.parse(localStorage.getItem('layouts')!);
                console.log('Загружаем layout\'ы из localStorage:', savedLayouts);

                if (Array.isArray(savedLayouts) && savedLayouts.length > 0) {
                    this.layouts = savedLayouts.map((layoutData: any) => {
                        const findClass = this.layoutClasses[layoutData.type];
                        if (!findClass) {
                            console.warn(`Неизвестный тип layout'а: ${layoutData.type}`);
                            return undefined;
                        }

                        // Создаем объект с минимальными параметрами
                        const layout = Object.create(findClass.prototype);

                        // Копируем все сохраненные свойства
                        Object.assign(layout, layoutData);

                        // Убеждаемся что у layout'а есть ID (для совместимости со старыми данными)
                        if (!layout.id) {
                            layout.id = Layout.generateId();
                        }

                        // Убеждаемся что у layout'а есть корректная позиция
                        if (!layout.position || typeof layout.position !== 'object') {
                            console.warn(`Layout ${layout.name} имеет некорректную позицию, устанавливаем по умолчанию`);
                            layout.position = { x: 0.5, y: 0.5 };
                        }

                        // Проверяем корректность позиции
                        if (isNaN(layout.position.x) || isNaN(layout.position.y)) {
                            console.warn(`Layout ${layout.name} имеет некорректные координаты, исправляем`);
                            layout.position = { x: 0.5, y: 0.5 };
                        }

                        console.log(`Загружен layout ${layout.name}:`, {
                            id: layout.id,
                            position: layout.position,
                            size: layout.size,
                            type: layout.type
                        });

                        return layout;
                    }).filter((layout: Layout) => layout !== undefined) as Layout[];

                    console.log(`Загружено ${this.layouts.length} layout'ов из localStorage`);

                    // Пересохраняем для обеспечения корректности данных
                    this.saveLayoutsToStorage();
                } else {
                    console.log('localStorage содержит пустой массив layout\'ов');
                    this.layouts = [];
                }
            } else {
                console.log('Нет сохраненных layout\'ов в localStorage, начинаем с пустого массива');
                this.layouts = [];
            }
        } catch (error) {
            console.error('Ошибка загрузки из localStorage:', error);
            localStorage.removeItem('layouts');
            this.layouts = [];
        }


        this.selectType = mockups[0]!.type;
        this.selectColor = mockups[0]!.colors[0]!.name;

        this.mockups = mockups;

        this.showMockup();
        this.loadProduct();
        // Полная загрузка всех слоев при инициализации
        this.printLayouts();

        // Инициализация интерфейса
        this.initializeInterface();

        // Автоматическое сохранение при закрытии страницы
        window.addEventListener('beforeunload', () => {
            this.saveCurrentObjectPositions();
        });

        // Запускаем систему автосохранения
        this.startAutoSave();
    }

    updateCanvasSize() {
        if (this.editorBlock) {
            const rect = this.editorBlock.getBoundingClientRect();
            this.canvasAreaWidth = rect.width;
            this.canvasAreaHeight = rect.height;
        }
    }

    setupResizeHandler() {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.editorBlock) {
                    this.updateCanvasSize();
                    this.resizeAllCanvas();
                }
            }
        });

        if (this.editorBlock) {
            resizeObserver.observe(this.editorBlock);
        }

        // Дополнительный обработчик для window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.updateCanvasSize();
                this.resizeAllCanvas();
            }, 100);
        });
    }

    fixCanvasContainerPositioning(canvas: fabric.Canvas) {
        const canvasElement = canvas.getElement();
        const container = canvasElement.parentElement;

        if (container && container.classList.contains('canvas-container')) {
            // Принудительно устанавливаем правильное позиционирование
            container.style.position = 'absolute';
            container.style.top = '0px';
            container.style.left = '0px';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.zIndex = '9'; // Тот же z-index что и у canvas

            // Также исправляем positioning самого canvas внутри контейнера
            canvasElement.style.position = 'absolute';
            canvasElement.style.top = '0px';
            canvasElement.style.left = '0px';

            // Исправляем upper-canvas если есть
            const upperCanvas = container.querySelector('.upper-canvas') as HTMLCanvasElement;
            if (upperCanvas) {
                upperCanvas.style.position = 'absolute';
                upperCanvas.style.top = '0px';
                upperCanvas.style.left = '0px';
            }
        }
    }

    resizeAllCanvas() {
        // Обновляем размеры всех canvas
        this.canvases.forEach(canvas => {
            canvas.setWidth(this.canvasAreaWidth);
            canvas.setHeight(this.canvasAreaHeight);

            // Исправляем позиционирование после изменения размера
            this.fixCanvasContainerPositioning(canvas);
        });

        this.layersCanvases.forEach(layersCanvas => {
            layersCanvas.setWidth(this.canvasAreaWidth);
            layersCanvas.setHeight(this.canvasAreaHeight);
            // Также обновляем размеры DOM элемента
            const el = layersCanvas.getElement();
            el.width = this.canvasAreaWidth;
            el.height = this.canvasAreaHeight;
        });

        // Перерисовываем active canvas
        if (this.activeCanvas) {
            this.activeCanvas.renderAll();
        }
    }

    initializeInterface() {
        // Инициализация активного цвета
        setTimeout(() => {
            this.updateColorButtons();
        }, 100);
    }

    showMockup() {
        if (this.mockupBlock === null) return;

        const selectedMockup = this.mockups.find((mockup) => {
            return mockup.type === this.selectType && mockup.colors.find((color) => color.name === this.selectColor);
        })

        if (!selectedMockup)
            throw new Error('Selected mockup is not found');

        this.mockupBlock.src = selectedMockup.colors.find((color) => color.name === this.selectColor)!.views.find((view) => view.view === this.selectView)!.url;
    }

    async loadProduct() {
        try {
            const printSize = this.productConfig.printSize;
            const aspectRatio = parseFloat((printSize.width / printSize.height).toFixed(2));

            if (this.productConfig.sides) {
                // Для каждой стороны создаем canvas (аналогично example.js)
                for (const side in this.productConfig.sides) {
                    const sideConfig = this.productConfig.sides[side];
                    if (!sideConfig) continue;
                    const boundingBox = sideConfig.boundingBox;

                    // Создаем layers canvas (статический)
                    const layerscanvasEl = document.createElement("canvas");
                    layerscanvasEl.id = "layers--" + side;
                    layerscanvasEl.className = "layers";
                    layerscanvasEl.width = this.canvasAreaWidth;
                    layerscanvasEl.height = this.canvasAreaHeight;
                    layerscanvasEl.setAttribute("ref", side);

                    // Устанавливаем стили для layers canvas
                    layerscanvasEl.style.position = 'absolute';
                    layerscanvasEl.style.top = '0';
                    layerscanvasEl.style.left = '0';
                    layerscanvasEl.style.width = '100%';
                    layerscanvasEl.style.height = '100%';
                    layerscanvasEl.style.zIndex = '7'; // Поверх mockup (5), но под редактируемым canvas (8)

                    // Вставляем layers canvas
                    this.canvasesContainer!.appendChild(layerscanvasEl);

                    const layersCanvas = new fabric.StaticCanvas(layerscanvasEl, {
                        backgroundColor: 'transparent' // Прозрачный фон для layers canvas
                    });
                    // Добавляем дополнительные свойства
                    (layersCanvas as any).side = side;
                    (layersCanvas as any).name = "static-" + side;

                    // Создаем редактируемый canvas
                    const canvasEl = document.createElement("canvas");
                    canvasEl.width = this.canvasAreaWidth;
                    canvasEl.height = this.canvasAreaHeight;
                    canvasEl.setAttribute("data-title", side);

                    // Устанавливаем стили напрямую для canvas элемента
                    canvasEl.style.position = 'absolute';
                    canvasEl.style.top = '0';
                    canvasEl.style.left = '0';
                    canvasEl.style.width = '100%';
                    canvasEl.style.height = '100%';
                    canvasEl.style.zIndex = '9'; // Поверх mockup (5) и layers canvas (7), но под UI (15)

                    // Добавляем canvas напрямую в контейнер
                    this.canvasesContainer!.appendChild(canvasEl);

                    // Инициализируем fabric canvas
                    const canvas = new fabric.Canvas(canvasEl, {
                        controlsAboveOverlay: true,
                        width: this.canvasAreaWidth,
                        height: this.canvasAreaHeight,
                        backgroundColor: 'transparent', // Прозрачный фон для правильного наложения
                    });
                    // Добавляем дополнительные свойства
                    (canvas as any).name = side;
                    (canvas as any).side = side;

                    // Принудительно исправляем позиционирование контейнера fabric.js
                    setTimeout(() => {
                        this.fixCanvasContainerPositioning(canvas);
                    }, 10);

                    // Добавляем в массивы
                    this.layersCanvases.push(layersCanvas);
                    this.canvases.push(canvas);

                    // Инициализируем canvas с настройками
                    this.initCanvas(canvas, {
                        boundingBox,
                        sideConfig,
                        printSize,
                        aspectRatio
                    });

                    // Если это первый canvas (только что добавили), показываем область редактирования
                    if (this.canvases.length === 1) {
                        this.activeCanvas = canvas;
                        setTimeout(() => this.showEditableArea(), 100);
                    }

                    // Загружаем слои продукта (кроме базового мокапа)
                    if (sideConfig.layers) {
                        for (const layerName in sideConfig.layers) {
                            const layerUrl = sideConfig.layers[layerName];
                            // Пропускаем загрузку базового мокапа - он отображается через HTML img
                            if (layerUrl && layerName !== 'base') {
                                console.log('Loading layer:', layerName, layerUrl);
                                await this.loadLayer(side, layerUrl);
                            }
                        }
                    }
                }

                // Устанавливаем активную сторону на первую
                const firstSide = Object.keys(this.productConfig.sides)[0];
                if (firstSide) {
                    this.selectSide(firstSide);
                }
            }
        } catch (e) {
            console.error("Error building the canvas(s): " + e);
        }
    }

    initCanvas(canvas: fabric.Canvas, config: {
        boundingBox: BoundingBox;
        sideConfig: SideConfig;
        printSize: any;
        aspectRatio: number;
    }) {
        if (canvas && canvas instanceof fabric.Canvas) {
            const { aspectRatio, boundingBox } = config;
            const scale = boundingBox.sizeScalePercentage;
            const position = boundingBox.position;

            const width = Math.round((this.canvasAreaWidth * scale) / 100);
            const height = Math.round(width / aspectRatio);

            const left = (this.canvasAreaWidth * position.x) / 100;
            const top = (this.canvasAreaHeight * position.y) / 100;


            const clipArea = new fabric.Rect({
                width: width,
                height: height,
                left: left,
                top: top,
                fill: "rgb(255, 0, 0)",
            });


            // Создаем границу для показа области редактирования
            const areaBorder = new fabric.Rect({
                width: width - 3,
                height: height - 3,
                left: left,
                top: top,
                fill: "rgba(0,0,0,0)",
                strokeWidth: 3,
                stroke: "rgba(0, 0, 0, 0.46)",
                name: "area:border",
                opacity: 0.3,
                evented: false,
                selectable: false,
                hasControls: false
            });

            canvas.add(areaBorder);
            canvas.clipPath = clipArea; // И также устанавливаем как clipPat
            canvas.renderAll();


            // События для показа/скрытия границы
            canvas.on("mouse:down", () => {
                const border = this.getObject("area:border", canvas);
                if (border) {
                    border.set("opacity", 8);
                    canvas.requestRenderAll();
                }
            });

            canvas.on("mouse:up", () => {
                const border = this.getObject("area:border", canvas);
                if (border) {
                    border.set("opacity", 0.3);
                    canvas.requestRenderAll();
                }
            });

            // Автоматическое позиционирование новых объектов
            canvas.on("object:added", (e) => {
                const obj = e.target;
                if (obj && obj.name !== "area:clip" && obj.name !== "area:border" && obj.name !== "guideline") {
                    obj.scaleToWidth(clipArea.width! * 0.8); // 80% от области
                    obj.set({
                        left: clipArea.get("left")! + clipArea.width! / 2,
                        top: clipArea.get("top")! + clipArea.height! / 2
                    });
                    obj.setCoords();
                    canvas.renderAll();
                }
            });

            // Система привязки и направляющих
            canvas.on("object:moving", (e) => {
                const obj = e.target;
                if (obj && obj.name !== "area:clip" && obj.name !== "area:border" && obj.name !== "guideline" && this.snapEnabled) {
                    // Проверяем, близко ли объект к центру
                    const { nearX, nearY } = this.isNearCenter(obj, clipArea);

                    if (nearX || nearY) {
                        this.isSnapping = true;

                        // Показываем только те направляющие, которые нужны
                        this.showGuidelines(canvas, clipArea, nearX, nearY);

                        // Применяем привязку к центру
                        this.snapToCenter(obj, clipArea);

                        canvas.renderAll();
                    } else {
                        // Если объект далеко от центра, скрываем направляющие
                        if (this.isSnapping) {
                            this.clearGuidelines(canvas);
                            this.isSnapping = false;
                        }
                    }
                }
            });

            // Улучшенные обработчики событий для сохранения позиций
            const saveObjectPosition = (obj: fabric.Object, eventName: string) => {
                if (obj && obj.name !== "area:clip" && obj.name !== "area:border" && obj.name !== "guideline") {
                    const layoutId = (obj as any).layoutId;
                    if (layoutId) {
                        console.log(`Событие ${eventName} для объекта ${layoutId}:`, {
                            left: obj.left,
                            top: obj.top,
                            scaleX: obj.scaleX,
                            scaleY: obj.scaleY
                        });

                        // Сохраняем позицию
                        this.updateLayoutPosition(layoutId, obj.left!, obj.top!);

                        // Сохраняем размер если изменился
                        const layout = this.findLayoutById(layoutId);
                        if (layout && obj.scaleX) {
                            layout.size = obj.scaleX;
                            this.hasUnsavedChanges = true;
                        }

                        // Умное сохранение для всех событий
                        this.smartSave();
                    }
                }
            };

            canvas.on("object:moved", (e) => {
                const obj = e.target;

                // Немедленно скрываем направляющие после завершения перемещения
                if (this.snapEnabled && this.isSnapping) {
                    this.clearGuidelines(canvas);
                    this.isSnapping = false;
                }

                // Сохраняем позицию
                saveObjectPosition(obj!, 'object:moved');
            });

            canvas.on("object:modified", (e) => {
                const obj = e.target;
                saveObjectPosition(obj!, 'object:modified');
            });

            canvas.on("object:scaling", (e) => {
                const obj = e.target;
                saveObjectPosition(obj!, 'object:scaling');
            });

            canvas.on("object:rotating", (e) => {
                const obj = e.target;
                saveObjectPosition(obj!, 'object:rotating');
            });

            // Дополнительное сохранение при отпускании мыши
            canvas.on("mouse:up", (e) => {
                if (canvas.getActiveObject()) {
                    const obj = canvas.getActiveObject()!;
                    setTimeout(() => {
                        saveObjectPosition(obj, 'mouse:up');
                    }, 100); // Небольшая задержка чтобы позиция успела обновиться
                }
            });

            // Скрываем направляющие при снятии выделения с объекта
            canvas.on("selection:cleared", () => {
                if (this.isSnapping && this.snapEnabled) {
                    this.clearGuidelines(canvas);
                    this.isSnapping = false;
                }

                // Дополнительное сохранение при снятии выделения
                this.forceSave();
            });
        }
    }

    async loadLayer(side: string, url: string) {
        const layersCanvas = this.layersCanvases.find(
            c => (c as any).side === side && c instanceof fabric.StaticCanvas
        );

        if (!layersCanvas) {
            console.error('Layers canvas not found for side:', side);
            return;
        }

        try {
            const img = await this.loadImage(url);
            const imgObj = new fabric.Image(img);
            imgObj.scaleToWidth(layersCanvas.getWidth());
            imgObj.scaleToHeight(layersCanvas.getHeight());

            layersCanvas.add(imgObj);
            layersCanvas.renderAll();

            console.log('Layer loaded for side:', side);
        } catch (error) {
            console.error('Error loading layer:', error);
        }
    }

    loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    selectSide(side: string) {
        console.log("Selected side: ", side);

        this.activeSide = side;

        // Очищаем направляющие с предыдущего активного canvas
        if (this.activeCanvas) {
            this.clearGuidelines(this.activeCanvas);
        }

        // Скрываем/показываем canvas в зависимости от выбранной стороны
        this.canvases.forEach(canvas => {
            const canvasElement = canvas.getElement();

            if ((canvas as any).side === side) {
                this.activeCanvas = canvas;
                canvasElement.parentElement!.style.pointerEvents = "auto";
                canvasElement.style.display = "block";
            } else {
                canvasElement.parentElement!.style.pointerEvents = "none";
                canvasElement.style.display = "none";
                // Очищаем направляющие с неактивных canvas
                this.clearGuidelines(canvas);
            }
        });

        // Аналогично для слоев
        this.layersCanvases.forEach(layersCanvas => {
            const canvasElement = layersCanvas.getElement();

            if ((layersCanvas as any).side === side) {
                canvasElement.style.display = "block";
            } else {
                canvasElement.style.display = "none";
            }
        });

        // Сохраняем текущие позиции объектов перед переключением
        this.saveCurrentObjectPositions();

        // Обновляем вид мокапа
        this.selectView = side as View;
        this.showMockup();

        // Обновляем только HTML панель слоев (без перерисовки объектов на canvas)
        this.updateLayersPanel();

        // Принудительно обновляем активный canvas и его области редактирования
        if (this.activeCanvas) {
            this.showEditableArea();
            // Исправляем позиционирование при переключении
            this.fixCanvasContainerPositioning(this.activeCanvas);
        }
    }

    // Метод для показа области редактирования
    showEditableArea() {
        if (!this.activeCanvas) return;

        // Получаем области редактирования
        // const clipArea = this.getObject("area:clip", this.activeCanvas);
        const borderArea = this.getObject("area:border", this.activeCanvas);

        if (borderArea) {
            borderArea.visible = true;
            // Делаем границу клипинга слегка видимой
            borderArea.set({
                stroke: "rgba(0, 0, 0, 0.3)",
                strokeDashArray: [5, 5],
                opacity: 0.8,
                fill: "transparent"
            });
        }

        if (borderArea) {
            borderArea.visible = true;
            // Показываем синюю границу по умолчанию с низкой прозрачностью
            borderArea.set({
                opacity: 0.3,
                stroke: "rgb(64, 169, 243)",
                strokeWidth: 3
            });
        }

        // Принудительная перерисовка
        this.activeCanvas.renderAll();
    }

    // Обновленный метод для поиска объектов
    getObject(name: string, canvas?: fabric.Canvas): fabric.Object | undefined {
        const targetCanvas = canvas || this.activeCanvas;
        if (!targetCanvas) return undefined;

        return targetCanvas.getObjects().find(obj => (obj as any).name === name);
    }

    // Методы для работы с направляющими линиями и привязкой
    createGuideLine(x1: number, y1: number, x2: number, y2: number): fabric.Line {
        return new fabric.Line([x1, y1, x2, y2], {
            stroke: '#40a9f3',
            strokeWidth: 2,
            strokeDashArray: [8, 4],
            selectable: false,
            evented: false,
            excludeFromExport: true,
            name: 'guideline',
            opacity: 0.8,
            globalCompositeOperation: 'difference' // Инвертирующий эффект для лучшей видимости
        });
    }

    showGuidelines(canvas: fabric.Canvas, clipArea: fabric.Object, nearX: boolean = true, nearY: boolean = true) {
        // Очищаем старые направляющие
        this.clearGuidelines(canvas);

        if (!clipArea) return;

        const centerX = clipArea.left! + clipArea.width! / 2;
        const centerY = clipArea.top! + clipArea.height! / 2;

        // Показываем только те направляющие, которые нужны
        if (nearX) {
            // Вертикальная направляющая по центру
            const verticalGuide = this.createGuideLine(
                centerX, clipArea.top!,
                centerX, clipArea.top! + clipArea.height!
            );
            this.guideLines.push(verticalGuide);
        }

        if (nearY) {
            // Горизонтальная направляющая по центру
            const horizontalGuide = this.createGuideLine(
                clipArea.left!, centerY,
                clipArea.left! + clipArea.width!, centerY
            );
            this.guideLines.push(horizontalGuide);
        }

        // Добавляем направляющие на canvas только если есть что добавлять
        if (this.guideLines.length > 0) {
            this.guideLines.forEach(line => canvas.add(line));
            canvas.renderAll();
        }
    }

    clearGuidelines(canvas: fabric.Canvas) {
        this.guideLines.forEach(line => canvas.remove(line));
        this.guideLines = [];
        canvas.renderAll();
    }

    // Проверяем, близко ли объект к центру (в зоне показа направляющих)
    isNearCenter(obj: fabric.Object, clipArea: fabric.Object): { nearX: boolean, nearY: boolean } {
        if (!clipArea || !obj) return { nearX: false, nearY: false };

        const centerX = clipArea.left! + clipArea.width! / 2;
        const centerY = clipArea.top! + clipArea.height! / 2;

        const objBounds = obj.getBoundingRect();
        const objCenterX = objBounds.left + objBounds.width / 2;
        const objCenterY = objBounds.top + objBounds.height / 2;

        return {
            nearX: Math.abs(objCenterX - centerX) <= this.guideShowDistance,
            nearY: Math.abs(objCenterY - centerY) <= this.guideShowDistance
        };
    }

    snapToCenter(obj: fabric.Object, clipArea: fabric.Object): boolean {
        if (!clipArea || !obj) return false;

        const centerX = clipArea.left! + clipArea.width! / 2;
        const centerY = clipArea.top! + clipArea.height! / 2;

        // Получаем центр объекта с учетом его размеров и масштаба
        const objBounds = obj.getBoundingRect();
        const objCenterX = objBounds.left + objBounds.width / 2;
        const objCenterY = objBounds.top + objBounds.height / 2;

        let snapped = false;

        // Проверка привязки по горизонтали (к центру по X)
        if (Math.abs(objCenterX - centerX) <= this.snapTolerance) {
            const newLeft = centerX - objBounds.width / 2;
            obj.set({
                left: newLeft
            });
            snapped = true;
        }

        // Проверка привязки по вертикали (к центру по Y)  
        if (Math.abs(objCenterY - centerY) <= this.snapTolerance) {
            const newTop = centerY - objBounds.height / 2;
            obj.set({
                top: newTop
            });
            snapped = true;
        }

        if (snapped) {
            obj.setCoords();
        }

        return snapped;
    }

    // Методы управления системой привязки
    enableSnap() {
        this.snapEnabled = true;
        console.log('Привязка включена');
    }

    disableSnap() {
        this.snapEnabled = false;
        // Очищаем все направляющие при отключении
        this.canvases.forEach(canvas => this.clearGuidelines(canvas));
        console.log('Привязка выключена');
    }

    toggleSnap() {
        if (this.snapEnabled) {
            this.disableSnap();
        } else {
            this.enableSnap();
        }
        return this.snapEnabled;
    }

    // Методы настройки расстояний
    setSnapTolerance(tolerance: number) {
        this.snapTolerance = Math.max(1, tolerance);
        console.log(`Зона привязки установлена: ${this.snapTolerance}px`);
    }

    setGuideShowDistance(distance: number) {
        this.guideShowDistance = Math.max(this.snapTolerance, distance);
        console.log(`Зона показа направляющих установлена: ${this.guideShowDistance}px`);
    }

    // Метод для очистки пользовательских объектов с canvas
    clearCanvasUserObjects(canvas: fabric.Canvas) {
        // Получаем все объекты кроме системных (границ области и направляющих)
        const objectsToRemove = canvas.getObjects().filter(obj => {
            const objName = (obj as any).name;
            return objName !== "area:clip" && objName !== "area:border" && objName !== "guideline";
        });

        // Удаляем объекты из карты связей
        objectsToRemove.forEach(obj => {
            this.objectLayoutMap.delete(obj);
            canvas.remove(obj);
        });

        canvas.renderAll();
    }

    // Методы управления фильтрацией слоев
    showAllLayers() {
        this.showOnlyCurrentSide = false;
        this.updateLayersPanel();
        console.log('Показываем все слои');
    }

    showCurrentSideLayers() {
        this.showOnlyCurrentSide = true;
        this.updateLayersPanel();
        console.log('Показываем только слои текущей стороны');
    }

    toggleLayerFiltering() {
        if (this.showOnlyCurrentSide) {
            this.showAllLayers();
        } else {
            this.showCurrentSideLayers();
        }
        return this.showOnlyCurrentSide;
    }

    // Методы для работы с layout'ами и объектами
    findLayoutById(id: string): Layout | undefined {
        return this.layouts.find(layout => layout.id === id);
    }

    linkObjectToLayout(obj: fabric.Object, layoutId: string) {
        this.objectLayoutMap.set(obj, layoutId);
        (obj as any).layoutId = layoutId; // Также добавляем свойство к объекту для удобства
    }

    updateLayoutPosition(layoutId: string, x: number, y: number) {
        const layout = this.findLayoutById(layoutId);
        if (layout) {
            // Конвертируем абсолютные координаты в относительные (0-1)
            const relativeX = Math.max(0, Math.min(1, x / this.canvasAreaWidth));
            const relativeY = Math.max(0, Math.min(1, y / this.canvasAreaHeight));

            const oldPosition = { ...layout.position };

            layout.position.x = relativeX;
            layout.position.y = relativeY;

            // Помечаем что есть несохраненные изменения
            this.hasUnsavedChanges = true;

            // Сохраняем обновленные данные (немедленно для критических изменений)
            this.saveLayoutsToStorage();

            console.log(`Позиция layout'а ${layout.name} (${layoutId}) обновлена:`, {
                old: oldPosition,
                new: { x: relativeX, y: relativeY },
                absolute: { x, y },
                canvasSize: { width: this.canvasAreaWidth, height: this.canvasAreaHeight }
            });
        } else {
            console.warn(`Layout с ID ${layoutId} не найден для обновления позиции`);
        }
    }

    // Система автосохранения
    startAutoSave() {
        // Автосохранение каждые 5 секунд
        this.autoSaveInterval = setInterval(() => {
            if (this.hasUnsavedChanges) {
                console.log('Автосохранение позиций...');
                this.saveCurrentObjectPositions();
                this.hasUnsavedChanges = false;
            }
        }, 5000);

        console.log('Автосохранение запущено (каждые 5 секунд)');
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('Автосохранение остановлено');
        }
    }

    // Принудительное сохранение с отметкой времени
    forceSave() {
        // Отменяем предыдущий таймер если есть
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }

        this.saveCurrentObjectPositions();
        this.lastSaveTime = Date.now();
        this.hasUnsavedChanges = false;
        console.log('Принудительное сохранение выполнено');
    }

    // Умное сохранение с debouncing - не сохраняет слишком часто
    smartSave() {
        // Отменяем предыдущий таймер
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        // Устанавливаем новый таймер на 1 секунду
        this.saveDebounceTimer = setTimeout(() => {
            if (this.hasUnsavedChanges) {
                this.saveCurrentObjectPositions();
                this.lastSaveTime = Date.now();
                this.hasUnsavedChanges = false;
                console.log('Умное сохранение выполнено');
            }
            this.saveDebounceTimer = null;
        }, 1000);

        console.log('Умное сохранение запланировано через 1 секунду');
    }

    saveLayoutsToStorage() {
        const dataToSave = this.layouts.map(layout => ({
            id: layout.id,
            name: layout.name,
            position: layout.position,
            size: layout.size,
            view: layout.view
        }));

        localStorage.setItem('layouts', JSON.stringify(this.layouts));
        console.log('Сохранено в localStorage:', dataToSave);
    }

    // Методы для работы с view параметром layout'ов
    changeLayoutView(layoutId: string, newView: View): boolean {
        const layout = this.findLayoutById(layoutId);
        if (layout) {
            // Сначала сохраняем текущие позиции
            this.saveCurrentObjectPositions();

            // Меняем view у layout'а
            layout.changeView(newView);

            // Сохраняем изменения
            this.saveLayoutsToStorage();

            // Перемещаем объект на соответствующий canvas
            this.moveLayoutObjectToView(layout);

            // Обновляем панель если нужно
            if (this.showOnlyCurrentSide) {
                this.updateLayersPanel();
            }

            return true;
        }
        return false;
    }

    toggleLayoutView(layoutId: string): View | null {
        const layout = this.findLayoutById(layoutId);
        if (layout) {
            const newView = layout.toggleView();

            // Сохраняем изменения
            this.saveLayoutsToStorage();

            // Перемещаем объект на соответствующий canvas
            this.moveLayoutObjectToView(layout);

            // Обновляем панель если нужно
            if (this.showOnlyCurrentSide) {
                this.updateLayersPanel();
            }

            return newView;
        }
        return null;
    }

    // Метод для перемещения объекта layout'а на соответствующий canvas
    moveLayoutObjectToView(layout: Layout) {
        // Находим объект на старом canvas
        let objectToMove: fabric.Object | null = null;
        let oldCanvas: fabric.Canvas | null = null;

        // Ищем объект во всех canvas'ах
        for (const canvas of this.canvases) {
            const objects = canvas.getObjects();
            objectToMove = objects.find(obj => (obj as any).layoutId === layout.id) || null;
            if (objectToMove) {
                oldCanvas = canvas;
                break;
            }
        }

        if (objectToMove && oldCanvas) {
            // Удаляем объект со старого canvas
            oldCanvas.remove(objectToMove);
            oldCanvas.renderAll();

            // Находим новый canvas
            const newCanvas = this.canvases.find(canvas => (canvas as any).side === layout.view);
            if (newCanvas) {
                // Добавляем объект на новый canvas
                newCanvas.add(objectToMove);
                newCanvas.renderAll();

                console.log(`Объект ${layout.name} перемещен на canvas стороны ${layout.view}`);
            }
        }
    }

    // Получить все layout'ы определенной стороны
    getLayoutsByView(view: View): Layout[] {
        return this.layouts.filter(layout => layout.view === view);
    }

    // Получить информацию о распределении layout'ов по сторонам
    getViewStats(): { front: number, back: number, total: number } {
        const frontLayouts = this.getLayoutsByView('front');
        const backLayouts = this.getLayoutsByView('back');

        return {
            front: frontLayouts.length,
            back: backLayouts.length,
            total: this.layouts.length
        };
    }

    // Метод для копирования layout'а на другую сторону
    copyLayoutToView(layoutId: string, targetView: View): string | null {
        const originalLayout = this.findLayoutById(layoutId);
        if (!originalLayout) return null;

        // Создаем копию layout'а
        let newLayout: Layout;

        if (originalLayout instanceof ImageLayout) {
            newLayout = new ImageLayout({
                name: `${originalLayout.name} (копия)`,
                view: targetView,
                preview_url: originalLayout.preview_url
            });
        } else if (originalLayout instanceof TextLayout) {
            newLayout = new TextLayout({
                name: `${originalLayout.name} (копия)`,
                view: targetView,
                font: { ...originalLayout.font }
            });
        } else {
            return null;
        }

        // Копируем позицию и размер
        newLayout.position = { ...originalLayout.position };
        newLayout.size = originalLayout.size;

        // Добавляем новый layout
        this.addLayoutInternal(newLayout);

        console.log(`Layout ${originalLayout.name} скопирован на сторону ${targetView}`);
        return newLayout.id;
    }

    // Метод для сохранения текущих позиций всех объектов в layout'ы
    saveCurrentObjectPositions() {
        this.canvases.forEach(canvas => {
            const objects = canvas.getObjects().filter(obj => {
                const objName = (obj as any).name;
                return objName !== "area:clip" && objName !== "area:border" && objName !== "guideline";
            });

            objects.forEach(obj => {
                const layoutId = (obj as any).layoutId;
                if (layoutId) {
                    this.updateLayoutPosition(layoutId, obj.left!, obj.top!);

                    // Также сохраняем размер если он изменился
                    const layout = this.findLayoutById(layoutId);
                    if (layout && obj.scaleX) {
                        layout.size = obj.scaleX;
                    }
                }
            });
        });

        this.saveLayoutsToStorage();
        console.log('Сохранены текущие позиции всех объектов');
    }

    // Метод для обновления только HTML панели слоев (без перерисовки объектов)
    updateLayersPanel() {
        if (!this.layoutsBlock) {
            this.layoutsBlock = document.querySelector('.editor-layout');
        }

        if (!this.layoutsBlock) return;

        this.layoutsBlock.innerHTML = '';

        // Фильтруем слои по выбранной стороне (если включена фильтрация)
        const layersToShow = this.showOnlyCurrentSide
            ? this.layouts.filter(layout => layout.view === this.selectView)
            : this.layouts;

        if (this.showOnlyCurrentSide) {
            console.log(`Обновляем панель слоев для стороны "${this.selectView}":`, layersToShow);
        } else {
            console.log('Обновляем панель для всех слоев:', layersToShow);
        }

        // Создаем HTML элементы для каждого слоя (без создания объектов на canvas)
        layersToShow.forEach(layout => {
            this.createLayerPanelItem(layout);
        });
    }

    // Создание HTML элемента для панели слоев без создания объектов canvas
    createLayerPanelItem(layout: Layout) {
        const layoutItem = document.createElement('div');
        layoutItem.classList.add('editor-layout-item');
        this.layoutsBlock!.appendChild(layoutItem);

        const layoutItemPreview = document.createElement('div');
        layoutItemPreview.classList.add('editor-layout-item-preview');

        if (layout instanceof ImageLayout) {
            const imageBlock = document.createElement('img');
            imageBlock.src = layout.preview_url;
            imageBlock.classList.add('editor-layout-item-preview-image');
            layoutItemPreview.appendChild(imageBlock);
        } else if (layout instanceof TextLayout) {
            const textBlock = document.createElement('div');
            textBlock.classList.add('editor-layout-item-preview-text');
            textBlock.innerText = "T";
            layoutItemPreview.appendChild(textBlock);
        }

        layoutItem.appendChild(layoutItemPreview);

        const layoutItemContent = document.createElement('div');
        layoutItemContent.classList.add('editor-layout-item-content');
        layoutItemContent.innerText = layout.name;
        layoutItem.appendChild(layoutItemContent);

        const layoutItemControls = document.createElement('div');
        layoutItemControls.classList.add('editor-layout-item-controls');
        layoutItem.appendChild(layoutItemControls);

        this.controls.forEach(control => {
            const layoutItemControlButton = document.createElement('div');
            layoutItemControlButton.classList.add('editor-layout-item-control-button');
            layoutItemControlButton.addEventListener('click', control.action.bind(this, this.layouts.indexOf(layout)));
            layoutItemControls.appendChild(layoutItemControlButton);

            const layoutItemControl = document.createElement('i');
            layoutItemControl.classList.add('icon');
            layoutItemControl.title = control.name;
            layoutItemControl.dataset.lucide = control.icon;
            layoutItemControlButton.appendChild(layoutItemControl);
        });
    }


    addLayoutInternal(layout: Layout) {
        this.layouts.push(layout);
        this.saveLayoutsToStorage();

        // Создаем объект на canvas для нового слоя
        this.addLayoutToCanvas(layout);

        // Обновляем HTML панель
        this.updateLayersPanel();
    }

    // Метод для добавления конкретного layout'а на canvas
    async addLayoutToCanvas(layout: Layout) {
        const targetCanvas = this.canvases.find(canvas => (canvas as any).side === layout.view);
        if (!targetCanvas) {
            console.warn(`Canvas для стороны "${layout.view}" не найден`);
            return;
        }

        if (layout instanceof ImageLayout) {
            await new Promise((res) => {
                fabric.Image.fromURL(layout.preview_url, (image) => {
                    image.scale(layout.size);

                    // Конвертируем относительные координаты в абсолютные
                    const absoluteX = layout.position.x * this.canvasAreaWidth;
                    const absoluteY = layout.position.y * this.canvasAreaHeight;

                    console.log(`Добавляем новое изображение для ${layout.name}:`, {
                        relative: layout.position,
                        absolute: { x: absoluteX, y: absoluteY },
                        canvasSize: { width: this.canvasAreaWidth, height: this.canvasAreaHeight }
                    });

                    image.set({
                        top: absoluteY,
                        left: absoluteX,
                    });

                    // Связываем объект с layout'ом
                    this.linkObjectToLayout(image, layout.id);

                    // Добавляем на canvas
                    targetCanvas.add(image);
                    targetCanvas.renderAll();
                    res(image);
                });
            });
        } else if (layout instanceof TextLayout) {
            // Конвертируем относительные координаты в абсолютные
            const absoluteX = layout.position.x * this.canvasAreaWidth;
            const absoluteY = layout.position.y * this.canvasAreaHeight;

            console.log(`Добавляем новый текст для ${layout.name}:`, {
                relative: layout.position,
                absolute: { x: absoluteX, y: absoluteY },
                canvasSize: { width: this.canvasAreaWidth, height: this.canvasAreaHeight }
            });

            const text = new fabric.Text(layout.name, {
                fontFamily: layout.font.family,
                fontSize: layout.font.size,
                scaleX: layout.size,
                scaleY: layout.size,
                top: absoluteY,
                left: absoluteX,
            });

            // Связываем объект с layout'ом
            this.linkObjectToLayout(text, layout.id);

            // Добавляем на canvas
            targetCanvas.add(text);
            targetCanvas.renderAll();
        }
    }

    // Метод для полной перерисовки всех слоев (используется только при инициализации)
    async printLayouts() {
        this.layoutsBlock = document.querySelector('.editor-layout');
        this.layoutsBlock!.innerHTML = '';

        // Очищаем ВСЕ canvas'ы от пользовательских объектов
        this.canvases.forEach(canvas => {
            this.clearCanvasUserObjects(canvas);
        });

        console.log('Полная перерисовка всех слоев из сохраненных данных');

        // Отрисовываем все слои на соответствующие canvas'ы
        for (const layout of this.layouts) {
            console.log('Перерисовываем:', layout);
            await this.printLayout(layout);
        }

        // Обновляем HTML панель
        this.updateLayersPanel();
    }

    async printLayout(layout: Layout) {
        // Находим canvas для стороны слоя
        const targetCanvas = this.canvases.find(canvas => (canvas as any).side === layout.view);
        if (!targetCanvas) {
            console.warn(`Canvas для стороны "${layout.view}" не найден`);
            return;
        }

        const layoutItem = document.createElement('div');
        layoutItem.classList.add('editor-layout-item');
        this.layoutsBlock!.appendChild(layoutItem);

        const layoutItemPreview = document.createElement('div');
        layoutItemPreview.classList.add('editor-layout-item-preview');
        if (layout instanceof ImageLayout) {
            const imageBlock = document.createElement('img');
            imageBlock.src = layout.preview_url;
            imageBlock.classList.add('editor-layout-item-preview-image');
            layoutItemPreview.appendChild(imageBlock);

            await new Promise((res) => {
                fabric.Image.fromURL(layout.preview_url, (image) => {
                    image.scale(layout.size);

                    // Конвертируем относительные координаты в абсолютные
                    const absoluteX = layout.position.x * this.canvasAreaWidth;
                    const absoluteY = layout.position.y * this.canvasAreaHeight;

                    console.log(`Создаем изображение для ${layout.name}:`, {
                        relative: layout.position,
                        absolute: { x: absoluteX, y: absoluteY },
                        canvasSize: { width: this.canvasAreaWidth, height: this.canvasAreaHeight }
                    });

                    image.set({
                        top: absoluteY,
                        left: absoluteX,
                    });

                    // Связываем объект с layout'ом
                    this.linkObjectToLayout(image, layout.id);

                    // Добавляем на правильный canvas для стороны слоя
                    targetCanvas.add(image);
                    res(image);
                });
            })
        } else if (layout instanceof TextLayout) {
            const textBlock = document.createElement('div');
            textBlock.classList.add('editor-layout-item-preview-text');
            textBlock.innerText = "T";
            layoutItemPreview.appendChild(textBlock);

            // Конвертируем относительные координаты в абсолютные
            const absoluteX = layout.position.x * this.canvasAreaWidth;
            const absoluteY = layout.position.y * this.canvasAreaHeight;

            console.log(`Создаем текст для ${layout.name}:`, {
                relative: layout.position,
                absolute: { x: absoluteX, y: absoluteY },
                canvasSize: { width: this.canvasAreaWidth, height: this.canvasAreaHeight }
            });

            const text = new fabric.Text(layout.name, {
                fontFamily: layout.font.family,
                fontSize: layout.font.size,
                scaleX: layout.size,
                scaleY: layout.size,
                top: absoluteY,
                left: absoluteX,
            });

            // Связываем объект с layout'ом
            this.linkObjectToLayout(text, layout.id);

            // Добавляем на правильный canvas для стороны слоя
            targetCanvas.add(text);
        }
        layoutItem.appendChild(layoutItemPreview);

        const layoutItemContent = document.createElement('div');
        layoutItemContent.classList.add('editor-layout-item-content');
        layoutItemContent.innerText = layout.name;
        layoutItem.appendChild(layoutItemContent);

        const layoutItemControls = document.createElement('div');
        layoutItemControls.classList.add('editor-layout-item-controls');
        layoutItem.appendChild(layoutItemControls);

        this.controls.forEach(control => {
            const layoutItemControlButton = document.createElement('div');
            layoutItemControlButton.classList.add('editor-layout-item-control-button');
            layoutItemControlButton.addEventListener('click', control.action.bind(this, this.layouts.length));
            layoutItemControls.appendChild(layoutItemControlButton);

            const layoutItemControl = document.createElement('i');
            layoutItemControl.classList.add('icon');
            layoutItemControl.title = control.name;
            layoutItemControl.dataset.lucide = control.icon;
            layoutItemControlButton.appendChild(layoutItemControl);
        });

        // createIcons();
    }

    // Методы для интеграции с HTML интерфейсом
    addLayout(type: string, options: any) {
        console.log('Adding layout:', type, options);

        if (type === 'image' && this.layoutClasses.image) {
            const layout = new ImageLayout({
                name: options.name || 'Изображение',
                view: this.selectView,
                preview_url: options.preview_url || 'https://kobold.vsemayki.ru/constructor/72fb6f6e-3f01-4aea-9578-d32fb93824dd.jpg'
            });
            this.addLayoutInternal(layout);
        } else if (type === 'text' && this.layoutClasses.text) {
            const layout = new TextLayout({
                name: options.name || 'PrintLoop',
                view: this.selectView,
                font: options.font || { family: 'Arial', size: 24 }
            });
            this.addLayoutInternal(layout);
        }
    }

    changeColor(colorName: string) {
        console.log('Changing color to:', colorName);
        this.selectColor = colorName;
        this.showMockup();

        // Обновляем цвет фона всех canvas - оставляем прозрачным для правильного наложения
        this.canvases.forEach(canvas => {
            // Не изменяем backgroundColor, оставляем прозрачным
            canvas.renderAll();
        });

        // Обновляем активное состояние в интерфейсе
        this.updateColorButtons();
    }

    updateColorButtons() {
        const colorButtons = document.querySelectorAll('.editor-settings-group-option');
        colorButtons.forEach(button => {
            button.classList.remove('active');
            const buttonText = button.textContent?.toLowerCase();
            if (buttonText === this.selectColor) {
                button.classList.add('active');
            }
        });
    }

    changeView() {
        console.log('Changing view from:', this.selectView);
        // Переключение между front и back
        if (this.selectView === 'front') {
            this.selectSide('back');
        } else {
            this.selectSide('front');
        }
    }

    private getColorHex(colorName: string): string {
        const colorMap: { [key: string]: string } = {
            'white': '#ffffff',
            'black': '#000000',
            'red': '#ff0000',
            'green': '#00ff00',
            'blue': '#0000ff'
        };
        return colorMap[colorName] || '#ffffff';
    }

    // Экспорт artwork (аналогично example.js)
    exportArt(): string {
        if (!this.activeCanvas) {
            throw new Error('No active canvas found');
        }

        // Деактивируем все активные объекты
        this.activeCanvas.discardActiveObject();

        // Получаем область клипинга
        const clipArea = this.getObject("area:border");
        if (!clipArea) {
            throw new Error('Clip area not found');
        }

        // Получаем реальный размер печати в пикселях
        const printSize = this.productConfig.printSize;
        const resolution = printSize.resolution;
        const printW = parseFloat((printSize.width * resolution).toFixed(2));
        const printH = parseFloat((printSize.height * resolution).toFixed(2));

        const multiplier = printW / clipArea.width!;

        console.log('Export settings:', { clipArea, printSize, multiplier });

        const dataUrl = this.activeCanvas.toDataURL({
            format: "png",
            multiplier: multiplier,
            left: clipArea.left,
            top: clipArea.top,
            width: clipArea.width,
            height: clipArea.height
        });

        return dataUrl;
    }

    // Экспорт mockup с наложением слоев
    exportMockup(): string {
        if (!this.activeCanvas) {
            throw new Error('No active canvas found');
        }

        // Деактивируем все активные объекты
        this.activeCanvas.discardActiveObject();

        // Создаем временный canvas
        const tmpCanvas = document.createElement("canvas");
        const ctx = tmpCanvas.getContext("2d")!;
        tmpCanvas.width = this.canvasAreaWidth;
        tmpCanvas.height = this.canvasAreaHeight;

        // Экспортируем artwork canvas
        const artworkDataUrl = this.activeCanvas.toDataURL({
            format: "png",
            multiplier: 1
        });

        // Находим соответствующий layers canvas
        const layersCanvas = this.layersCanvases.find(c =>
            (c as any).side === this.activeSide
        );

        if (!layersCanvas) {
            console.warn('Layers canvas not found for side:', this.activeSide);
            return artworkDataUrl;
        }

        return new Promise<string>((resolve) => {
            const artworkImg = new Image();
            artworkImg.onload = () => {
                // Композитим изображение
                ctx.fillStyle = this.selectColor || "white";
                ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

                // Рисуем слои продукта
                ctx.drawImage(
                    layersCanvas.getElement(),
                    0, 0,
                    tmpCanvas.width, tmpCanvas.height
                );

                // Рисуем artwork поверх
                ctx.drawImage(
                    artworkImg,
                    0, 0,
                    tmpCanvas.width, tmpCanvas.height
                );

                resolve(tmpCanvas.toDataURL("image/png"));
            };
            artworkImg.src = artworkDataUrl;
        }) as any; // TypeScript workaround
    }

    // Утилита для сохранения base64 как файла
    saveBase64AsFile(base64: string, fileName: string) {
        const link = document.createElement("a");
        link.setAttribute("href", base64.replace("image/png", "image/octet-stream"));
        link.setAttribute("download", fileName);
        link.click();
    }
}

const tempWindow = window as unknown as (typeof window) & { editor: Editor };

const editor = new Editor({
    editorBlockId: 'editor-block',
    mockupBlockId: 'mockup',
    sidesButtonClass: 'editor-sides-button',
    productConfig: {
        printSize: {
            width: 10, // дюймы
            height: 12,
            resolution: 300 // DPI
        },
        sides: {
            front: {
                boundingBox: {
                    sizeScalePercentage: 30,
                    position: {
                        x: 35, // процент от ширины canvas
                        y: 25  // процент от высоты canvas
                    }
                },
                layers: {
                    // Базовый мокап теперь отображается через HTML img
                    // Здесь могут быть дополнительные декоративные слои
                }
            },
            back: {
                boundingBox: {
                    sizeScalePercentage: 30,
                    position: {
                        x: 35,
                        y: 25
                    }
                },
                layers: {
                    // Базовый мокап теперь отображается через HTML img
                    // Здесь могут быть дополнительные декоративные слои
                }
            }
        },
        colors: ["white", "black", "#ff0000", "#00ff00", "#0000ff"]
    },
    mockups: [
        {
            type: "tshirt",
            colors: [
                {
                    name: "white",
                    hex: "#ffffff",
                    views: [{
                        view: "front",
                        url: "https://res.cloudinary.com/dqt3gnimu/image/upload/v1753958151/white_mockup.webp",
                    }, {
                        view: "back",
                        url: "https://res.cloudinary.com/dqt3gnimu/image/upload/v1755334227/white_mockup_back.webp",
                    }],
                },
                {
                    name: "black",
                    hex: "#000000",
                    views: [{
                        view: "front",
                        url: "https://res.cloudinary.com/dqt3gnimu/image/upload/v1753959137/black_mockup.webp",
                    }, {
                        view: "back",
                        url: "https://res.cloudinary.com/dqt3gnimu/image/upload/v1754896964/black_mockup_back.webp",
                    }],
                },
            ],
        },
        {
            type: "hoodie",
            colors: [
                {
                    name: "white",
                    hex: "#ffffff",
                    views: [],
                },
            ],
        },
        {
            type: "hoodie",
            colors: [
                {
                    name: "black",
                    hex: "#000000",
                    views: [],
                },
            ],
        }
    ]
})

tempWindow.editor = editor;

// Глобальные функции для управления привязкой
(window as any).toggleSnap = () => editor.toggleSnap();
(window as any).enableSnap = () => editor.enableSnap();
(window as any).disableSnap = () => editor.disableSnap();
(window as any).setSnapTolerance = (tolerance: number) => editor.setSnapTolerance(tolerance);
(window as any).setGuideShowDistance = (distance: number) => editor.setGuideShowDistance(distance);

// Глобальные функции для управления отображением слоев
(window as any).showAllLayers = () => editor.showAllLayers();
(window as any).showCurrentSideLayers = () => editor.showCurrentSideLayers();
(window as any).toggleLayerFiltering = () => editor.toggleLayerFiltering();

// Отладочные функции
(window as any).printLayoutPositions = () => {
    console.log('Текущие позиции layout\'ов:');
    editor.layouts.forEach(layout => {
        console.log(`${layout.name} (${layout.id}):`, layout.position);
    });
};

// Функция для ручного сохранения позиций
(window as any).saveCurrentPositions = () => editor.saveCurrentObjectPositions();

// Отладочные функции для localStorage
(window as any).showSavedLayouts = () => {
    const saved = localStorage.getItem('layouts');
    if (saved) {
        console.log('Сохраненные layout\'ы в localStorage:', JSON.parse(saved));
    } else {
        console.log('Нет сохраненных layout\'ов в localStorage');
    }
};

(window as any).clearSavedLayouts = () => {
    localStorage.removeItem('layouts');
    console.log('localStorage очищен');
};

// Функции для работы с view параметром
(window as any).changeLayoutView = (layoutId: string, newView: 'front' | 'back') => {
    return editor.changeLayoutView(layoutId, newView);
};

(window as any).toggleLayoutView = (layoutId: string) => {
    return editor.toggleLayoutView(layoutId);
};

(window as any).copyLayoutToView = (layoutId: string, targetView: 'front' | 'back') => {
    return editor.copyLayoutToView(layoutId, targetView);
};

(window as any).getViewStats = () => {
    const stats = editor.getViewStats();
    console.log('Статистика по сторонам:', stats);
    return stats;
};

(window as any).showLayoutsByView = (view: 'front' | 'back') => {
    const layouts = editor.getLayoutsByView(view);
    console.log(`Layout'ы на стороне ${view}:`, layouts.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        position: l.position
    })));
    return layouts;
};

(window as any).listAllLayouts = () => {
    console.log('Все layout\'ы:');
    editor.layouts.forEach(layout => {
        console.log(`- ${layout.getViewInfo()}, позиция: (${layout.position.x.toFixed(2)}, ${layout.position.y.toFixed(2)})`);
    });
    return editor.layouts;
};

// Функции для управления автосохранением
(window as any).forceSave = () => {
    editor.forceSave();
};

(window as any).startAutoSave = () => {
    editor.startAutoSave();
};

(window as any).stopAutoSave = () => {
    editor.stopAutoSave();
};

// Отладочные функции для тестирования сохранения
(window as any).testSaveRestore = () => {
    console.log('=== ТЕСТ СОХРАНЕНИЯ И ВОССТАНОВЛЕНИЯ ===');

    // Сохраняем текущее состояние
    editor.saveCurrentObjectPositions();
    console.log('1. Текущие позиции сохранены');

    // Показываем что сохранилось
    const saved = localStorage.getItem('layouts');
    if (saved) {
        const parsedLayouts = JSON.parse(saved);
        console.log('2. Сохраненные данные:', parsedLayouts.map((l: any) => ({
            name: l.name,
            position: l.position,
            view: l.view
        })));
    }

    // Показываем текущие позиции объектов на canvas
    console.log('3. Текущие позиции объектов на canvas:');
    editor.canvases.forEach((canvas, index) => {
        const side = (canvas as any).side || `canvas-${index}`;
        const objects = canvas.getObjects().filter(obj => {
            const objName = (obj as any).name;
            return objName !== "area:clip" && objName !== "area:border" && objName !== "guideline";
        });

        objects.forEach(obj => {
            const layoutId = (obj as any).layoutId;
            if (layoutId) {
                console.log(`   ${side}: ${layoutId} - позиция: (${obj.left}, ${obj.top})`);
            }
        });
    });
};

(window as any).checkAutoSave = () => {
    console.log('Статус автосохранения:', {
        active: editor.autoSaveInterval !== null,
        hasUnsavedChanges: editor.hasUnsavedChanges,
        lastSaveTime: new Date(editor.lastSaveTime).toLocaleTimeString(),
        debounceTimer: editor.saveDebounceTimer !== null
    });
};

(window as any).smartSave = () => {
    editor.smartSave();
};

// editor.addLayout(new ImageLayout({
//     name: 'Изображение',
//     view: 'front',
//     preview_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTT5aQxvTnjob-J9ak9Fhx1_shpxzNWhZA4lA&s',
// }));

// editor.addLayout(new TextLayout({
//     name: 'Текст',
//     view: 'front',
//     font: {
//         family: 'Arial',
//         size: 24,
//     },
// }));