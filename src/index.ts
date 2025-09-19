type Position = {
    x: number;
    y: number;
}

class Layout {
    id: string;
    type: string;
    position: Position;
    size: number;
    aspectRatio: number = 1;
    view: SideEnum;
    angle: number = 0;

    constructor({ type, view }: { type: string, view: SideEnum }) {
        this.id = (Math.random() + 1).toString(36).substring(7) + (Math.random() + 1).toString(36).substring(7);
        this.type = type;
        this.position = {
            x: 0,
            y: 0,
        };
        this.size = 1;
        this.view = view;
    }
}

class ImageLayout extends Layout {
    url: string;

    constructor({ view, url }: { view: SideEnum, url: string }) {
        super({ type: 'image', view });
        this.url = url;
    }
}

type Font = {
    family: string;
    size: number;
}

class TextLayout extends Layout {
    text: string;
    font: Font;

    constructor({ view, text = "PrintLoop", font }: { view: SideEnum, text?: string, font?: Font }) {
        super({ type: 'text', view });
        this.text = text;
        this.font = {
            family: font?.family || 'Arial',
            size: font?.size || 12,
        };
    }
}

type PrintConfig = {
    side: SideEnum;
    position: Position;
    size: {
        width: number;
        height: number;
    };
}

type Color = {
    name: string;
    hex: string;
}

type SideEnum = 'front' | 'back';

type Mockup = {
    side: SideEnum;
    url: string;
    color: Color;
}

type Product = {
    type: 'tshirt' | 'hoodie';
    mockups: Mockup[];
    printConfig: PrintConfig[];
}

type EditorProps = {
    blocks: {
        editorBlockClass: string;
        changeSideButtonClass: string;
        productListBlockClass: string;
        editorSettingsBlockClass: string;
    }
    productConfigs: Product[];
}

class Editor {
    editorBlock: HTMLElement;
    changeSideButton: HTMLElement;
    mockupBlock: HTMLImageElement;
    productListBlock: HTMLElement;
    editorSettingsBlock: HTMLElement;
    editorLoadingBlock: HTMLElement;
    canvasesContainer: HTMLElement;

    events = new EventTarget();

    selectType: Product['type'];
    selectColor: Color;
    selectSide: SideEnum;

    productConfigs: Product[];

    isLoading: boolean;
    loadingTime: number = 0;
    loadingInterval: NodeJS.Timeout | null = null;

    layersCanvases: fabric.StaticCanvas[] = [];
    canvases: fabric.Canvas[] = [];
    layouts: Layout[] = [];
    activeCanvas: fabric.Canvas | null = null;

    canvasAreaHeight = 600;

    constructor({ blocks, productConfigs }: EditorProps) {
        this.editorBlock = document.querySelector(blocks.editorBlockClass)!;
        this.changeSideButton = document.querySelector(blocks.changeSideButtonClass)!;
        this.productListBlock = document.querySelector(blocks.productListBlockClass)!;
        this.editorSettingsBlock = document.querySelector(blocks.editorSettingsBlockClass)!;

        this.productConfigs = productConfigs;


        // Set default values
        this.isLoading = true;
        this.selectColor = productConfigs[0]!.mockups[0]!.color;
        this.selectSide = productConfigs[0]!.mockups[0]!.side;
        this.selectType = productConfigs[0]!.type;
        this.loadState();


        // TODO: Remove DEBUG
        if (this.layouts.length === 0) {
            this.addLayout(new ImageLayout({
                view: 'front',
                url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Felis_silvestris_silvestris.jpg',
            }));
            this.addLayout(new TextLayout({
                view: 'front',
            }));
        }

        if (!this.editorBlock) {
            throw new Error('Editor block not found');
        }

        if (!this.changeSideButton) {
            console.warn('Change side button not found');
        } else {
            this.initChangeSideButton();
        }

        if (!this.editorSettingsBlock) {
            console.warn('Editor settings block not found');
        } else {
            this.initSettings();
        }

        if (!this.productListBlock) {
            console.warn('Product list block not found');
        } else {
            this.initProductList();
        }

        this.editorBlock.style.position = 'relative';

        this.createBackgroundBlock();
        this.mockupBlock = this.createMockupBlock();
        this.canvasesContainer = this.createCanvasesContainer();
        this.editorLoadingBlock = this.createEditorLoadingBlock();

        this.loadProduct();
        this.updateMockup();
        this.updateLayouts();

        this.events.addEventListener('mockup-updated', (event) => {
            this.mockupBlock.src = (event as CustomEvent).detail;
        })

        this.events.addEventListener('loading-time-updated', (event) => {
            if (this.isLoading) {
                if (this.loadingTime > 5) {
                    this.editorLoadingBlock.innerText = `Loading... ${(this.loadingTime / 10).toFixed(1)}s`;
                    this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0.745)";
                } else {
                    this.editorLoadingBlock.innerText = "";
                    this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0)";
                }
            } else {
                this.editorLoadingBlock.innerText = "";
            }
        })

        this.events.addEventListener('mockup-loading', (event) => {
            if ((event as CustomEvent).detail) {
                this.isLoading = true;
                console.debug(`[mockup] loading mockup`);

                this.loadingInterval = setInterval(() => {
                    this.loadingTime++;
                    this.events.dispatchEvent(new CustomEvent('loading-time-updated', { detail: this.loadingTime }));
                }, 100);
            } else {
                this.editorLoadingBlock.style.backgroundColor = "rgba(255, 255, 255, 0)";
                this.editorLoadingBlock.innerText = "";
                this.isLoading = false;
                clearInterval(this.loadingInterval!);
                this.loadingTime = 0;
            }
        })
    }

    initChangeSideButton() {
        this.changeSideButton.onclick = () => this.changeSide();
    }

    initSettings() {
        console.debug(`[settings] init for ${this.selectType}`);
        const product = this.productConfigs.find(product => product.type === this.selectType)!;

        // SelectColor
        console.debug(`[settings] [colors] init colors block`)
        const colors = product.mockups.filter(mockup => mockup.side === this.selectSide).map(mockup => mockup.color);
        const colorBlock = document.createElement('div');
        colors.forEach(color => {
            console.debug(`[settings] [colors] init color item ${color.name}`);
            const colorItem = document.createElement('div');
            colorItem.classList.add('editor-settings-item');
            colorItem.textContent = color.name;
            colorItem.onclick = () => this.changeColor(color.name);
            colorBlock.appendChild(colorItem);
        });
        this.editorSettingsBlock.appendChild(colorBlock);
    }

    updateSettings() {
        // Очищаем старые настройки
        this.editorSettingsBlock.innerHTML = '';

        // Создаем новые настройки для текущего продукта
        this.initSettings();
    }

    createEditorLoadingBlock() {
        const editorLoadingBlock = document.createElement('div');
        editorLoadingBlock.classList.add('editor-position');
        editorLoadingBlock.id = 'editor-loading';
        editorLoadingBlock.style.zIndex = "1000";
        editorLoadingBlock.style.pointerEvents = "none";

        this.editorBlock.appendChild(editorLoadingBlock);

        return editorLoadingBlock;
    }

    createBackgroundBlock() {
        const background = document.createElement('div');
        background.classList.add('editor-position');
        background.id = 'editor-background';
        this.editorBlock.appendChild(background);

        return background;
    }

    createMockupBlock() {
        const mockup = document.createElement('img');
        mockup.classList.add('editor-position');
        mockup.id = 'editor-mockup';
        this.editorBlock.appendChild(mockup);

        return mockup;
    }

    createCanvasesContainer() {
        const canvas = document.createElement('div');
        canvas.classList.add('editor-position');
        canvas.id = 'editor-canvases-container';
        canvas.style.zIndex = '10';
        canvas.style.pointerEvents = 'auto';
        this.editorBlock.appendChild(canvas);

        return canvas;
    }

    initProductList() {
        this.productListBlock.style.display = 'block';
        this.productConfigs.forEach(product => {
            const productItem = document.createElement('div');
            productItem.onclick = () => this.changeProduct(product.type);
            productItem.classList.add('product-item');
            productItem.textContent = product.type;
            this.productListBlock.appendChild(productItem);
        });
    }

    clearAllCanvas() {
        // Удаляем все DOM элементы canvas из контейнера
        if (this.canvasesContainer) {
            this.canvasesContainer.innerHTML = '';
        }

        // Очищаем массивы canvas
        this.canvases = [];
        this.layersCanvases = [];
        this.activeCanvas = null;
    }

    loadProduct() {
        const product = this.productConfigs.find(product => product.type === this.selectType)!;

        if (!product || !product.printConfig) {
            console.warn("[product] product or printConfig not found");
            return;
        }

        for (const printConfig of product.printConfig) {
            this.createCanvasForSide(printConfig);
        }

        this.setActiveSide(this.selectSide);

        setTimeout(() => {
            this.isLoading = false;
            this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: false }));
        }, 100);
    }

    createCanvasForSide(printConfig: any) {
        const layersCanvasBlock = document.createElement("canvas");
        layersCanvasBlock.id = "layers--" + printConfig.side;
        layersCanvasBlock.classList.add('editor-position');
        layersCanvasBlock.setAttribute("ref", printConfig.side);
        layersCanvasBlock.style.zIndex = '7';

        this.canvasesContainer.appendChild(layersCanvasBlock);

        const layersCanvas = new fabric.StaticCanvas(layersCanvasBlock, {
            width: this.editorBlock.clientWidth,
            height: this.editorBlock.clientHeight,
        });
        (layersCanvas as any).side = printConfig.side;
        (layersCanvas as any).name = "static-" + printConfig.side;

        const edtableCanvasBlock = document.createElement("canvas");
        edtableCanvasBlock.id = "edtable--" + printConfig.side;
        edtableCanvasBlock.setAttribute("ref", printConfig.side);
        edtableCanvasBlock.classList.add('editor-position');
        edtableCanvasBlock.style.zIndex = '9';

        this.canvasesContainer.appendChild(edtableCanvasBlock);

        const edtableCanvas = new fabric.Canvas(edtableCanvasBlock, {
            controlsAboveOverlay: true,
            width: this.editorBlock.clientWidth,
            height: this.editorBlock.clientHeight,
            backgroundColor: 'transparent',
            uniformScaling: true
        });
        (edtableCanvas as any).side = printConfig.side;
        (edtableCanvas as any).name = "editable-" + printConfig.side;

        this.layersCanvases.push(layersCanvas);
        this.canvases.push(edtableCanvas);

        // Если это первый canvas, делаем его активным
        if (this.canvases.length === 1) {
            this.activeCanvas = edtableCanvas;
        }

        this.initMainCanvas(edtableCanvas, printConfig);
    }

    initMainCanvas(canvas: fabric.Canvas, printConfig: any) {
        if (!canvas || !(canvas instanceof fabric.Canvas)) {
            console.warn("[canvas] canvas is not valid");
            return;
        }

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = (this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth);
        const top = (this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight);

        const clipArea = new fabric.Rect({
            width: width,
            height: height,
            left,
            top,
            fill: "rgb(255, 0, 0)",
            name: "area:clip",
            evented: false,
        })

        const areaBorder = new fabric.Rect({
            width: width - 3,
            height: height - 3,
            left,
            top,
            fill: "rgba(0,0,0,0)",
            strokeWidth: 3,
            stroke: "rgb(255, 155, 62)",
            name: "area:border",
            opacity: 0.3,
            evented: false,
            selectable: false,
            hasControls: false
        });

        areaBorder.set({
            opacity: 0.3,
            strokeDashArray: [5, 5],
            strokeWidth: 3
        });

        // canvas.add(clipArea);
        canvas.add(areaBorder);
        canvas.clipPath = clipArea;

        canvas.on("mouse:down", () => {
            console.debug(`[canvas] mouse:down`);
            const border = this.getObject("area:border", canvas);
            if (border) {
                border.set("opacity", 8);
                canvas.requestRenderAll();
            }
        });

        canvas.on("mouse:up", () => {
            console.debug(`[canvas] mouse:up`);
            const border = this.getObject("area:border", canvas);
            if (border) {
                border.set("opacity", 0.3);
                canvas.requestRenderAll();
            }
        });

        canvas.on("object:modified", (e) => {
            console.debug(`[canvas] object:modified`, e);
            const object = e.target;
            if (object) {
                const layout = this.layouts.find(layout => layout.id === object.name);
                if (layout) {

                    const printConfig = this.productConfigs.find(product => product.type === this.selectType)!.printConfig.find(printConfig => printConfig.side === layout.view)!;

                    const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
                    const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
                    const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
                    const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

                    console.log(left, top, object.scaleX!);

                    layout.position.x = (object.left! - left) / width;
                    layout.position.y = (object.top! - top) / height;
                    layout.size = object.scaleX!;
                    layout.aspectRatio = object.scaleY! / object.scaleX!;
                    layout.angle = object.angle!;

                    console.log(layout);
                    this.saveState();
                }
            }
        })
    }

    getObject(name: string, canvas?: fabric.Canvas): fabric.Object | undefined {
        const targetCanvas = canvas || this.activeCanvas || this.canvases[0];
        if (!targetCanvas) return undefined;

        return targetCanvas.getObjects().find(obj => (obj as any).name === name);
    }

    setActiveSide(side: string) {
        console.debug("Setting active side: ", side);

        this.canvases.forEach(canvas => {
            const canvasElement = canvas.getElement();
            const containerElement = canvasElement.parentElement;

            if ((canvas as any).side === side) {
                this.activeCanvas = canvas;
                if (containerElement) {
                    containerElement.style.pointerEvents = "auto";
                    containerElement.style.display = "block";
                }
                canvasElement.style.display = "block";
            } else {
                if (containerElement) {
                    containerElement.style.pointerEvents = "none";
                    containerElement.style.display = "none";
                }
                canvasElement.style.display = "none";
            }
        });

        this.layersCanvases.forEach(layersCanvas => {
            const canvasElement = layersCanvas.getElement();

            if ((layersCanvas as any).side === side) {
                canvasElement.style.display = "block";
            } else {
                canvasElement.style.display = "none";
            }
        });

        this.selectSide = side as any;
    }

    async updateMockup() {
        console.debug(`[settings] [mockup] update mockup for ${this.selectType} ${this.selectSide} ${this.selectColor.name}`);

        this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: true }));

        return new Promise((resolve, reject) => {
            const mockupImageUrl = this.productConfigs.find(product => product.type === this.selectType)!.mockups.find(mockup => mockup.side === this.selectSide && mockup.color.name === this.selectColor.name)!.url;

            const mockupImage = new Image()
            mockupImage.setAttribute('crossOrigin', 'anonymous')
            mockupImage.src = mockupImageUrl;

            mockupImage.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = mockupImage.width;
                canvas.height = mockupImage.height;
                const ctx = canvas.getContext("2d");
                ctx!.drawImage(mockupImage, 0, 0);
                const dataURL = canvas.toDataURL("image/png");

                resolve(dataURL);
                this.events.dispatchEvent(new CustomEvent('mockup-updated', { detail: dataURL }));
                this.events.dispatchEvent(new CustomEvent('mockup-loading', { detail: false }));

                if (this.mockupBlock) {
                    this.mockupBlock.src = dataURL;
                }
            }
        })
    }

    changeProduct(productType: Product['type']) {
        this.selectType = productType;
        this.selectColor = this.productConfigs.find(product => product.type === this.selectType)!.mockups[0]!.color;
        this.selectSide = this.productConfigs.find(product => product.type === this.selectType)!.mockups[0]!.side;

        // Очищаем старые canvas
        this.clearAllCanvas();

        // Пересоздаем canvas для нового продукта
        this.loadProduct();

        // Обновляем настройки для нового продукта
        this.updateSettings();

        this.updateMockup();
        this.saveState();
    }

    changeSide() {
        const newSide = this.selectSide === 'front' ? 'back' : 'front';
        this.setActiveSide(newSide);
        this.updateMockup();
        this.saveState();
    }

    changeColor(colorName: Color['name']) {
        console.debug(`[settings] [colors] change color to ${colorName}`);

        const trySelectColor = this.productConfigs.find(product => product.type === this.selectType)!.mockups.find(mockup => mockup.color.name === colorName)!.color;

        if (this.selectColor.name === colorName) {
            return;
        }

        if (trySelectColor) {
            this.selectColor = trySelectColor;
        } else {
            console.warn(`[settings] [colors] color ${colorName} not found. Select first color`);
            this.selectColor = this.productConfigs.find(product => product.type === this.selectType)!.mockups[0]!.color;
        }

        this.updateMockup();
        this.saveState();
    }

    addLayout(layout: Layout) {
        this.layouts.push(layout);
        this.saveState();
        this.addLayoutToCanvas(layout);
    }

    saveState() {
        console.debug(`[state] save state `);
        localStorage.setItem("editor-state-date", new Date().toISOString());
        localStorage.setItem("editor-state-color", this.selectColor.name);
        localStorage.setItem("editor-state-side", this.selectSide);
        localStorage.setItem("editor-state-type", this.selectType);
        localStorage.setItem("editor-state-layouts", JSON.stringify(this.layouts));
    }

    loadState() {
        console.debug(`[state] load state`);
        const date = localStorage.getItem("editor-state-date");

        if (date) {
            if (new Date(date).getTime() > new Date().getTime() - 1000 * 60 * 60 * 24 * 30) {
                console.debug(`[state] load state from localStorage`);
                const type = localStorage.getItem("editor-state-type");
                const color = localStorage.getItem("editor-state-color");
                const side = localStorage.getItem("editor-state-side");
                const layouts = localStorage.getItem("editor-state-layouts");

                if (type && color && side) {
                    this.selectType = type as Product['type'];
                    this.selectColor = this.productConfigs.find(product => product.type === this.selectType)!.mockups.find(mockup => mockup.color.name === color)!.color;
                    this.selectSide = side as SideEnum;
                    try {
                        this.layouts = layouts ? JSON.parse(layouts) : [];
                    } catch (error) {
                        console.warn("[state] load state from localStorage is not valid");
                        this.layouts = [];
                    }
                    this.updateMockup();
                } else {
                    console.warn("[state] load state from localStorage is not valid");
                }
            } else {
                console.warn("[state] load state from localStorage is expired");
            }
        } else {
            console.debug("[state] load state from localStorage is not found");
            localStorage.removeItem("editor-state-date");
            localStorage.removeItem("editor-state-color");
            localStorage.removeItem("editor-state-side");
            localStorage.removeItem("editor-state-type");
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

    async addLayoutToCanvas(layout: Layout) {
        const canvas = this.canvases.find(canvas => (canvas as any).side === layout.view);
        if (!canvas) {
            console.warn(`[canvas] canvas for ${layout.view} not found`);
            return;
        }

        const printConfig = this.productConfigs.find(product => product.type === this.selectType)!.printConfig.find(printConfig => printConfig.side === layout.view)!;

        const width = printConfig.size.width / 600 * this.editorBlock.clientWidth;
        const height = printConfig.size.height / 600 * this.editorBlock.clientHeight;
        const left = Math.round((this.editorBlock.clientWidth - width) / 2 + (printConfig.position.x / 100 * this.editorBlock.clientWidth));
        const top = Math.round((this.editorBlock.clientHeight - height) / 2 + (printConfig.position.y / 100 * this.editorBlock.clientHeight));

        const absoluteLeft = left + (width * layout.position.x);
        const absoluteTop = top + (height * layout.position.y);

        if (layout.type === 'image') {
            const imageLayout = layout as ImageLayout;

            const image = new fabric.Image(await this.loadImage(imageLayout.url));

            image.scaleToWidth(width);

            image.set({
                left: absoluteLeft,
                top: absoluteTop,
                name: layout.id,
                scaleX: layout.size,
                scaleY: layout.size * imageLayout.aspectRatio,
                angle: layout.angle,
            });
            canvas.add(image);
        } else if (layout.type === 'text') {
            const textLayout = layout as TextLayout;

            const text = new fabric.Text(textLayout.text, {
                fontFamily: textLayout.font.family,
                fontSize: textLayout.font.size,
            });
            text.set({
                top: absoluteTop,
                left: absoluteLeft,
                name: layout.id,
                scaleX: layout.size,
                scaleY: layout.size * textLayout.aspectRatio,
                angle: layout.angle,
            });

            canvas.add(text);
        }
    }

    updateLayouts() {
        this.layouts.forEach(layout => {
            this.addLayoutToCanvas(layout);
        });
    }
}

const editor = new Editor({
    blocks: {
        editorBlockClass: '.editor-content',
        changeSideButtonClass: '.change-side-button',
        productListBlockClass: '.select-products',
        editorSettingsBlockClass: '.editor-settings',
    },
    productConfigs: [
        {
            type: 'tshirt',
            printConfig: [
                {
                    side: 'front',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    size: {
                        width: 250,
                        height: 350,
                    },
                },
                {
                    side: 'back',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    size: {
                        width: 250,
                        height: 400,
                    },
                }
            ],
            mockups: [
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1753958151/white_mockup.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1755334227/white_mockup_back.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1753959137/black_mockup.webp',
                    color: { name: 'black', hex: '#000000' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1754896964/black_mockup_back.webp',
                    color: { name: 'black', hex: '#000000' },
                }
            ],
        },
        {
            type: 'hoodie',
            printConfig: [
                {
                    side: 'front',
                    position: {
                        x: 0,
                        y: -9,
                    },
                    size: {
                        width: 250,
                        height: 180,
                    },
                },
                {
                    side: 'back',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    size: {
                        width: 250,
                        height: 300,
                    },
                }
            ],
            mockups: [
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/white_hoddie_mockup.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/white_hoddie_mockup_back.webp',
                    color: { name: 'white', hex: '#ffffff' },
                },
                {
                    side: 'front',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/black_hoddie_mockup.webp',
                    color: { name: 'black', hex: '#000000' },
                },
                {
                    side: 'back',
                    url: 'https://res.cloudinary.com/dqt3gnimu/image/upload/v1756978139/black_hoddie_mockup_back.webp',
                    color: { name: 'black', hex: '#000000' },
                },
            ],
        }
    ],
});

(window as any).editor = editor;