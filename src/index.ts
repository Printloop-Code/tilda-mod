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

    constructor({
        name,
        view = 'front',
    }: LayoutProps) {
        this.name = name;
        this.view = view;
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
                this.layouts = savedLayouts.map((layout: any) => {
                    const findClass = this.layoutClasses[layout.type];
                    if (!findClass) return undefined;
                    return new findClass(layout);
                }).filter((layout: Layout) => layout !== undefined) as Layout[];

                localStorage.setItem('layouts', JSON.stringify(this.layouts));
            }
        } catch (error) {
            localStorage.removeItem('layouts');
        }


        this.selectType = mockups[0]!.type;
        this.selectColor = mockups[0]!.colors[0]!.name;

        this.mockups = mockups;

        this.showMockup();
        this.loadProduct();
        this.printLayouts();

        // Инициализация интерфейса
        this.initializeInterface();
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
                if (obj && obj.name !== "area:clip" && obj.name !== "area:border") {
                    obj.scaleToWidth(clipArea.width! * 0.8); // 80% от области
                    obj.set({
                        left: clipArea.get("left")! + clipArea.width! / 2,
                        top: clipArea.get("top")! + clipArea.height! / 2
                    }); clipArea
                    obj.setCoords();
                    canvas.renderAll();
                }
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

        // Обновляем вид мокапа
        this.selectView = side as View;
        this.showMockup();

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


    addLayoutInternal(layout: Layout) {
        this.layouts.push(layout);
        localStorage.setItem('layouts', JSON.stringify(this.layouts));
        this.printLayout(layout);
    }

    async printLayouts() {
        this.layoutsBlock = document.querySelector('.editor-layout');
        this.layoutsBlock!.innerHTML = '';

        for (const layout of this.layouts) {
            console.log(layout);
            await this.printLayout(layout);
        }
    }

    async printLayout(layout: Layout) {
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
                    image.set({
                        top: layout.position.y,
                        left: layout.position.x,
                    });

                    this.activeCanvas!.add(image);
                    res(image);
                });
            })
        } else if (layout instanceof TextLayout) {
            const textBlock = document.createElement('div');
            textBlock.classList.add('editor-layout-item-preview-text');
            textBlock.innerText = "T";
            layoutItemPreview.appendChild(textBlock);

            const text = new fabric.Text(layout.name, {
                fontFamily: layout.font.family,
                fontSize: layout.font.size,
                scaleX: layout.size,
                scaleY: layout.size,
                top: layout.position.y,
                left: layout.position.x,
            });
            this.activeCanvas!.add(text);
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